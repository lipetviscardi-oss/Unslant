/**
 * LEITURA DE PDF (aba "PDF") — roda no NAVEGADOR do usuário.
 *
 * O arquivo não é enviado ao servidor: o texto é extraído aqui mesmo e só
 * o texto segue para a análise. Isso é mais rápido, mais privado e evita o
 * limite de tamanho de envio da Vercel.
 *
 * PDFs guardam texto como "pedacinhos" posicionados na página, não como
 * parágrafos. Aqui reconstruímos linhas e parágrafos pela posição de cada
 * pedaço, juntamos palavras hifenizadas no fim da linha, removemos números
 * de página soltos e cabeçalhos/rodapés repetidos, e lemos páginas em duas
 * colunas na ordem certa (esquerda inteira, depois direita).
 */

import { AppError } from "@/lib/errors";
import { normalizeText } from "@/lib/text";
import type { SourceInfo } from "@/lib/analysis/types";
import { config } from "@/lib/config";

/** Página com figura/tabela, transformada em imagem para a etapa "Imagens e gráficos". */
export interface PdfPageImage {
  page: number;
  /** JPEG em base64 (sem o prefixo "data:"), para a IA. */
  data: string;
  /** Miniatura pequena (data URL), para a tela. */
  thumb: string;
  /** Legenda encontrada na página ("Figura 2 — …"), se houver. */
  caption?: string;
}

/** Começo de legenda: "Figura 3", "Fig. 2", "Tabela 1", "Gráfico 4", "Quadro 2", "Chart 1". */
const CAPTION_RE = /^(fig(?:ura|ure)?\.?|tabela|table|gr[aá]fico|quadro|chart|graph)\s*\d+/i;

/** Total máximo das imagens enviadas (o servidor da Vercel aceita até ~4,5 MB por pedido). */
const IMAGE_BUDGET_CHARS = 3_200_000;

/** Desenha a página num canvas com o lado maior em `longSide` pixels. */
async function renderPage(page: PdfPage, longSide: number): Promise<HTMLCanvasElement> {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: longSide / Math.max(base.width, base.height) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvas, viewport }).promise;
  return canvas;
}

const jpeg = (canvas: HTMLCanvasElement, quality: number) => canvas.toDataURL("image/jpeg", quality);

/** Miniatura: cópia reduzida do canvas da página. */
function thumbnail(canvas: HTMLCanvasElement, width = 240): string {
  const t = document.createElement("canvas");
  t.width = width;
  t.height = Math.round((canvas.height / canvas.width) * width);
  t.getContext("2d")?.drawImage(canvas, 0, 0, t.width, t.height);
  return jpeg(t, 0.6);
}

type PdfPage = Awaited<ReturnType<Awaited<ReturnType<typeof import("unpdf")["getDocumentProxy"]>>["getPage"]>>;

interface Line {
  text: string;
  y: number;
  height: number;
  /** Começo e fim da linha na horizontal. */
  x: number;
  xEnd: number;
}

interface TextItemLike {
  str: string;
  transform: number[];
  height: number;
  width?: number;
  hasEOL?: boolean;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** 1. Agrupa os pedaços de texto de uma página em linhas. */
function pageToLines(items: TextItemLike[], pageWidth: number): Line[] {
  const lines: Line[] = [];
  let current: Line | null = null;
  for (const it of items) {
    const x = it.transform[4];
    const y = it.transform[5];
    const w = it.width ?? it.str.length * (it.height || 10) * 0.5;
    // Nova linha quando muda a altura na página ou quando há um salto grande
    // para a direita (o pedaço pertence à outra coluna, na mesma altura).
    const newLine =
      current &&
      (Math.abs(current.y - y) > Math.max(2, (current.height || 10) * 0.4) || x - current.xEnd > pageWidth * 0.06 || x < current.x - 1);
    if (newLine && current) {
      lines.push(current);
      current = null;
    }
    if (!current) current = { text: "", y, height: it.height, x, xEnd: x + w };
    // espaço entre pedaços quando necessário
    if (current.text && !/\s$/.test(current.text) && it.str && !/^\s/.test(it.str)) current.text += " ";
    current.text += it.str;
    current.height = Math.max(current.height, it.height);
    current.xEnd = Math.max(current.xEnd, x + w);
    if (it.hasEOL) {
      lines.push(current);
      current = null;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() }))
    .filter((l) => l.text && !/^\d{1,4}$/.test(l.text)); // remove números de página soltos
}

/**
 * 2. Páginas em duas colunas (comum em papers): lê a coluna da esquerda
 * inteira antes da direita. Linhas que ocupam a largura toda (título,
 * resumo) ficam antes ou depois das colunas, conforme a posição.
 */
function orderColumns(lines: Line[], pageWidth: number): Line[] {
  const mid = pageWidth / 2;
  const left = lines.filter((l) => l.xEnd <= mid + pageWidth * 0.03);
  const right = lines.filter((l) => l.x >= mid - pageWidth * 0.03);
  // Só reordena quando as duas colunas têm bastante texto.
  if (left.length < 5 || right.length < 5 || left.length + right.length < lines.length * 0.6) return lines;
  // A área das colunas vai de onde as DUAS começam até onde as duas terminam.
  // Assim, cabeçalho, título e rodapé (que só aparecem de um lado) ficam fora dela.
  const top = Math.min(Math.max(...left.map((l) => l.y)), Math.max(...right.map((l) => l.y)));
  const bottom = Math.max(Math.min(...left.map((l) => l.y)), Math.min(...right.map((l) => l.y)));
  const byY = (a: Line, b: Line) => b.y - a.y; // de cima para baixo
  const tol = 1;
  const above = lines.filter((l) => l.y > top + tol);
  const below = lines.filter((l) => l.y < bottom - tol);
  const inside = lines.filter((l) => !above.includes(l) && !below.includes(l));
  return [
    ...above.sort(byY),
    ...inside.filter((l) => left.includes(l)).sort(byY),
    ...inside.filter((l) => !left.includes(l)).sort(byY),
    ...below.sort(byY),
  ];
}

/** Texto "genérico" de uma linha, para reconhecer cabeçalhos repetidos com número de página. */
const lineKey = (text: string) => text.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();

/**
 * 3. Remove cabeçalhos e rodapés repetidos (nome da revista, título curto,
 * "Página 3 de 20"): linhas que aparecem no topo ou no pé de pelo menos
 * metade das páginas.
 */
function removeRepeatedHeaders(pages: Line[][]): Line[][] {
  if (pages.length < 3) return pages;
  const count = new Map<string, number>();
  for (const lines of pages) {
    const edges = new Set([...lines.slice(0, 2), ...lines.slice(-2)].map((l) => lineKey(l.text)));
    for (const k of edges) count.set(k, (count.get(k) ?? 0) + 1);
  }
  const repeated = new Set([...count].filter(([k, n]) => n >= Math.max(3, pages.length / 2) && k.length < 160).map(([k]) => k));
  if (repeated.size === 0) return pages;
  return pages.map((lines) =>
    lines.filter((l, i) => !((i < 2 || i >= lines.length - 2) && repeated.has(lineKey(l.text)))),
  );
}

/** 4. Junta as linhas em parágrafos usando o espaço vertical entre elas. */
function linesToParagraphs(clean: Line[]): string[] {
  const gaps: number[] = [];
  for (let i = 1; i < clean.length; i++) {
    const g = clean[i - 1].y - clean[i].y;
    if (g > 0) gaps.push(g);
  }
  const typicalGap = median(gaps) || 12;
  const avgLen = clean.reduce((s, l) => s + l.text.length, 0) / Math.max(1, clean.length);

  const paragraphs: string[] = [];
  let para = "";
  for (let i = 0; i < clean.length; i++) {
    const line = clean[i];
    if (!para) {
      para = line.text;
    } else if (/[A-Za-zÀ-ÿ]-$/.test(para) && /^[a-zà-ÿ]/.test(line.text)) {
      para = para.slice(0, -1) + line.text; // junta palavra hifenizada
    } else {
      para += " " + line.text;
    }
    const next = clean[i + 1];
    const gap = next ? line.y - next.y : Infinity;
    const shortLine = line.text.length < avgLen * 0.6 && /[.!?:"”)]$/.test(line.text);
    if (!next || gap > typicalGap * 1.5 || gap < 0 || shortLine) {
      paragraphs.push(para);
      para = "";
    }
  }
  return paragraphs;
}

/**
 * Escolhe e desenha as páginas com figuras/tabelas: primeiro as que têm
 * legenda ("Figura 2", "Tabela 1"), depois as que têm imagem. Se quase todas
 * as páginas têm imagem (ex.: logotipo no topo), só as legendas contam.
 */
async function renderVisualPages(
  pdf: { numPages: number; getPage: (n: number) => Promise<PdfPage> },
  hints: { page: number; caption?: string; hasImage: boolean }[],
): Promise<PdfPageImage[]> {
  if (typeof document === "undefined" || hints.length === 0) return [];
  const imageOnly = hints.filter((h) => !h.caption && h.hasImage);
  const logoEverywhere = hints.filter((h) => h.hasImage).length > pdf.numPages * 0.8;
  const chosen = [...hints.filter((h) => h.caption), ...(logoEverywhere ? [] : imageOnly)]
    .slice(0, config.visual.maxPdfPages)
    .sort((a, b) => a.page - b.page);
  const perImage = IMAGE_BUDGET_CHARS / Math.max(1, chosen.length);
  const out: PdfPageImage[] = [];
  for (const h of chosen) {
    try {
      const page = await pdf.getPage(h.page);
      let canvas = await renderPage(page, 1400);
      let url = jpeg(canvas, 0.72);
      if (url.length > perImage) url = jpeg(canvas, 0.5);
      if (url.length > perImage) {
        canvas = await renderPage(page, 1000);
        url = jpeg(canvas, 0.5);
      }
      if (url.length > perImage * 1.5) continue; // página pesada demais: fica só como texto
      out.push({ page: h.page, data: url.slice(url.indexOf(",") + 1), thumb: thumbnail(canvas), caption: h.caption });
    } catch {
      /* página que não desenha: fica só como texto */
    }
  }
  return out;
}

export async function extractFromPdf(file: File): Promise<{ text: string; source: SourceInfo; images: PdfPageImage[] }> {
  const { getDocumentProxy } = await import("unpdf");
  let pdf;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    pdf = await getDocumentProxy(data);
  } catch (err) {
    throw new AppError("PDF_INVALID", err instanceof Error ? err.message : String(err));
  }

  const pages: Line[][] = [];
  /** Sinais de figura por página: legenda encontrada e/ou imagem desenhada. */
  const visualHints: { page: number; caption?: string; hasImage: boolean }[] = [];
  const OPS = config.visual.enabled ? (await (await import("unpdf")).getResolvedPDFJS()).OPS : null;
  let chars = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const pageWidth = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const items = (content.items as unknown[]).filter(
      (it): it is TextItemLike => typeof it === "object" && it !== null && "str" in it,
    );
    chars += items.reduce((s, it) => s + it.str.trim().length, 0);
    const lines = orderColumns(pageToLines(items, pageWidth), pageWidth);
    pages.push(lines);
    if (OPS) {
      const caption = lines.find((l) => CAPTION_RE.test(l.text))?.text.slice(0, 200);
      let hasImage = false;
      try {
        const ops = await page.getOperatorList();
        hasImage = ops.fnArray.some((f) => f === OPS.paintImageXObject || f === OPS.paintInlineImageXObject);
      } catch {
        /* sem lista de operações: usa só a legenda */
      }
      if (caption || hasImage) visualHints.push({ page: i, caption, hasImage });
    }
  }
  const paragraphs = removeRepeatedHeaders(pages).flatMap(linesToParagraphs);

  // Pouquíssimo texto por página = provavelmente um PDF escaneado (imagem).
  if (chars / Math.max(1, pdf.numPages) < 100) throw new AppError("PDF_SCANNED");

  let title: string | undefined;
  let author: string | undefined;
  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, unknown>;
    title = typeof info?.Title === "string" && info.Title.trim() ? info.Title.trim() : undefined;
    author = typeof info?.Author === "string" && info.Author.trim() ? info.Author.trim() : undefined;
  } catch {
    /* metadados são opcionais */
  }
  const images = await renderVisualPages(pdf, visualHints);
  await pdf.cleanup();

  return {
    text: normalizeText(paragraphs.join("\n\n")),
    source: { type: "pdf", title: title ?? file.name.replace(/\.pdf$/i, ""), author },
    images,
  };
}
