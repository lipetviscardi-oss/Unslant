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
      (Math.abs(current.y - y) > Math.max(2, (current.height || 10) * 0.4) ||
        x - current.xEnd > Math.min(pageWidth * 0.06, Math.max(pageWidth * 0.015, (current.height || 10) * 1.2)) ||
        x < current.x - 1);
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
  const clean = lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() })).filter((l) => l.text);
  // Número sozinho só é número de página no topo ou no pé da página (no meio, é valor de tabela).
  const ys = clean.map((l) => l.y);
  const top = Math.max(...ys);
  const bottom = Math.min(...ys);
  return clean.filter((l) => !(/^\d{1,4}$/.test(l.text) && (l.y >= top - 2 || l.y <= bottom + 2)));
}

const JOURNAL_LIKE = /\b(journal|revista|review|proceedings|annals|bulletin|magazine|letters|gazette|gazeta|jornal|di[áa]rio|quarterly)\b/i;
const MONTHS_EN = "January|February|March|April|May|June|July|August|September|October|November|December";
const MONTHS_PT = "janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";

/** Linhas da página agrupadas por altura na página (pedaços na mesma altura viram uma linha). */
function rows(lines: Line[]): Line[] {
  const sorted = [...lines].sort((a, b) => b.y - a.y);
  const groups: Line[][] = [];
  for (const l of sorted) {
    const g = groups[groups.length - 1];
    if (g && Math.abs(g[0].y - l.y) <= Math.max(2, l.height * 0.35) && Math.abs(g[0].height - l.height) <= Math.max(g[0].height, l.height) * 0.5) g.push(l);
    else groups.push([l]);
  }
  // Dentro da mesma linha, da esquerda para a direita.
  return groups.map((g) => {
    const parts = [...g].sort((a, b) => a.x - b.x);
    return { ...parts[0], height: Math.max(...parts.map((p) => p.height)), text: parts.map((p) => p.text).join(" ").replace(/\s+([,.;])/g, "$1") };
  });
}

/** Remove marcas de nota dos nomes dos autores ("Séralini 1*", "Group*"). */
const cleanAuthors = (s: string) =>
  s
    .split(/\s+[—–]\s+/)[0] // "A. Hart, J. Moreno — Instituto X": fica só com os nomes
    .replace(/(\p{L})\s*\d+(?:,\d+)*\*?/gu, "$1").replace(/\*/g, "").replace(/\s+,/g, ",").replace(/,\s*,/g, ",").replace(/\s+/g, " ").replace(/[,\s]+$/, "").trim();
const looksLikeNames = (s: string) => {
  const w = s.split(/\s+/).filter((x) => /\p{L}/u.test(x));
  if (w.length === 0 || w.length > 60 || s.length > 400) return false;
  const caps = w.filter((x) => /^\p{Lu}/u.test(x)).length;
  return caps / w.length >= 0.45 && (/[,&]|\b(and|e|group|grupo|consortium|collaborat)/i.test(s) || w.length <= 6);
};

/** Data no texto (nunca a do arquivo, que é quando o PDF foi gerado ou escaneado). */
function findDate(page1: string, all: string): string | undefined {
  const pub = all.match(new RegExp(`\\b(?:Published(?: online)?|Publicado(?: em)?)\\s*:?\\s*(\\d{1,2}\\s+(?:${MONTHS_EN})\\s+\\d{4}|(?:${MONTHS_EN})\\s+\\d{1,2},\\s+\\d{4})`, "i"));
  if (pub) return pub[1];
  const patterns = [
    new RegExp(`\\b(?:${MONTHS_EN})\\s+\\d{1,2},\\s+\\d{4}\\b`, "i"),
    new RegExp(`\\b\\d{1,2}\\s+(?:${MONTHS_EN})\\s+\\d{4}\\b`, "i"),
    new RegExp(`\\b\\d{1,2}\\s+de\\s+(?:${MONTHS_PT})\\s+de\\s+\\d{4}\\b`, "i"),
  ];
  for (const re of patterns) {
    const m = page1.match(re);
    if (m) return m[0];
  }
  const acc = all.match(new RegExp(`\\bAccepted\\s*:?\\s*(\\d{1,2}\\s+(?:${MONTHS_EN})\\s+\\d{4})`, "i"));
  return acc?.[1];
}

/**
 * Título, autores, revista e data pela primeira página:
 *  - título: o bloco com a maior letra que NÃO é o nome da revista
 *    (no NEJM, o nome da revista no topo tem letra maior que o título);
 *  - autores: as linhas logo abaixo do título, se parecerem nomes;
 *  - revista: o bloco com cara de nome de revista ou a citação do artigo;
 *  - data: escrita no texto (a data guardada no arquivo é ignorada).
 */
function documentInfo(page1: Line[], allText: string) {
  const r = rows(page1).filter((l) => /\p{L}/u.test(l.text));
  if (r.length === 0) return {};
  const body = median(r.map((l) => l.height));
  // Blocos de letra grande: linhas seguidas com a mesma altura de letra.
  const blocks: { lines: Line[]; height: number }[] = [];
  for (const l of r) {
    if (l.height < body * 1.3) continue;
    const last = blocks[blocks.length - 1];
    const prev = last?.lines[last.lines.length - 1];
    if (last && prev && Math.abs(prev.height - l.height) <= l.height * 0.12 && prev.y - l.y <= l.height * 2.2) last.lines.push(l);
    else blocks.push({ lines: [l], height: l.height });
  }
  const text = (b: { lines: Line[] }) => b.lines.map((l) => l.text).join(" ").replace(/\s+/g, " ").trim();
  const nWords = (t: string) => t.split(/\s+/).length;
  const byHeight = [...blocks].sort((a, b) => b.height - a.height);
  const journalBlock = byHeight.find((b) => JOURNAL_LIKE.test(text(b)) && nWords(text(b)) <= 8);
  const titleBlock = byHeight.find((b) => b !== journalBlock && nWords(text(b)) >= 3 && nWords(text(b)) <= 40 && !/^(r\s?e\s?s\s?e\s?a\s?r\s?c\s?h|open access|article|artigo)/i.test(text(b)));
  const title = titleBlock ? text(titleBlock) : undefined;

  let authors: string | undefined;
  if (titleBlock) {
    const lastTitle = titleBlock.lines[titleBlock.lines.length - 1];
    const below = r.filter((l) => l.y < lastTitle.y && lastTitle.y - l.y <= titleBlock.height * 5).slice(0, 3);
    const picked: string[] = [];
    for (const l of below) {
      if (/^(a\s?b\s?s\s?t\s?r\s?a\s?c\s?t|resumo|background|summary|introdu|key ?words)/i.test(l.text)) break;
      if (!looksLikeNames(l.text)) break;
      picked.push(l.text);
    }
    const a = cleanAuthors(picked.join(" "));
    if (a && looksLikeNames(a)) authors = a;
  }

  const page1Text = r.map((l) => l.text).join(" ");
  let publication = journalBlock ? text(journalBlock).replace(/\b\p{L}/gu, (c) => c.toUpperCase()).replace(/\b(Of|And|The|De|Da|Do)\b/g, (w, _x, i) => (i === 0 ? w : w.toLowerCase())) : undefined;
  if (!publication) {
    const cite = allText.match(/Cite this article as:[^\n]*?\.\s+([A-Z][A-Za-z&\- ]{3,60}?)\s+(?:19|20)\d{2},?\s*\d*\s*:\s*\d+/);
    publication = cite?.[1]?.trim();
  }
  return { title, authors, publication, publishedAt: findDate(page1Text, allText) };
}

/** Título dos metadados que é só lixo (nome de arquivo, "Microsoft Word - ...", "Untitled"). */
function usefulMetaTitle(title: string | undefined, fileName: string): string | undefined {
  if (!title) return undefined;
  const base = fileName.replace(/\.pdf$/i, "").trim().toLowerCase();
  if (title.toLowerCase() === base) return undefined;
  if (/^(microsoft (word|powerpoint)|untitled|sem t[íi]tulo|document\d*$|doc\d*$)|\.(docx?|pdf|tex|odt)$/i.test(title)) return undefined;
  return title.split(/\s+/).length >= 2 ? title : undefined;
}

/**
 * Onde fica o espaço vazio entre as duas colunas. Não precisa ser no meio:
 * revistas como o NEJM têm uma coluna larga e outra estreita. Testa cortes
 * de 25% a 85% da largura e fica com o que deixa mais texto dos dois lados
 * e menos linhas atravessando.
 */
function findGutter(lines: Line[], pageWidth: number): number | null {
  let best: { g: number; score: number } | null = null;
  for (let f = 0.25; f <= 0.85; f += 0.01) {
    const g = pageWidth * f;
    const left = lines.filter((l) => l.xEnd <= g).length;
    const right = lines.filter((l) => l.x >= g).length;
    const cross = lines.length - left - right;
    if (left < 5 || right < 5 || cross > lines.length * 0.4) continue;
    // Mais texto nos dois lados e menos linhas cruzando; empate: mais perto do meio.
    const score = Math.min(left, right) - cross * 2 - Math.abs(f - 0.5);
    if (!best || score > best.score) best = { g, score };
  }
  return best?.g ?? null;
}

function orderColumns(lines: Line[], pageWidth: number): Line[] {
  const g = findGutter(lines, pageWidth);
  if (g === null) return lines;
  const left = lines.filter((l) => l.xEnd <= g + pageWidth * 0.01);
  const right = lines.filter((l) => l.x >= g - pageWidth * 0.01);
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

  // Pouquíssimo texto por página = PDF escaneado (imagem): o texto será transcrito pela IA.
  if (chars / Math.max(1, pdf.numPages) < 100) {
    const pageCount = pdf.numPages;
    await pdf.cleanup();
    if (!config.ocr.enabled) throw new AppError("PDF_SCANNED");
    return {
      text: "",
      source: { type: "pdf", title: file.name.replace(/\.pdf$/i, ""), scanned: true, pageCount },
      images: [],
    };
  }

  let title: string | undefined;
  let author: string | undefined;
  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, unknown>;
    title = typeof info?.Title === "string" && info.Title.trim() ? info.Title.trim() : undefined;
    author = typeof info?.Author === "string" && info.Author.trim() && !/^(anonymous|unknown|admin|user|autor)$/i.test(info.Author.trim()) ? info.Author.trim() : undefined;
  } catch {
    /* metadados são opcionais */
  }
  const images = await renderVisualPages(pdf, visualHints);
  await pdf.cleanup();

  const fullText = normalizeText(paragraphs.join("\n\n"));
  // Título, autores, revista e data: pela primeira página; senão, os metadados (se não forem lixo); senão, o nome do arquivo.
  const info = pages[0] ? documentInfo(pages[0], fullText) : {};
  const bestTitle = info.title ?? usefulMetaTitle(title, file.name) ?? file.name.replace(/\.pdf$/i, "");
  return {
    text: fullText,
    source: {
      type: "pdf",
      title: bestTitle,
      author: info.authors ?? author,
      ...(info.publication ? { outlet: info.publication } : {}),
      ...(info.publishedAt ? { publishedAt: info.publishedAt } : {}),
    },
    images,
  };
}

/** A página desenhada ficou em branco? (menos de 0,2% de pontos escuros, numa cópia reduzida) */
function isBlank(canvas: HTMLCanvasElement): boolean {
  const w = 200;
  const h = Math.max(1, Math.round((canvas.height / canvas.width) * w));
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const ctx = small.getContext("2d");
  if (!ctx) return false;
  ctx.drawImage(canvas, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  let dark = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114 < 200) dark++;
  return dark / (w * h) < 0.002;
}

/** Uma página escaneada em imagem, para a transcrição. */
export interface ScannedPage {
  page: number;
  /** JPEG em base64 (sem o prefixo "data:"). */
  data: string;
}

/**
 * PDF ESCANEADO: transforma as primeiras páginas (até config.ocr.maxPages)
 * em imagens JPEG, uma por vez, para a IA transcrever. Roda no navegador.
 */
export async function renderScannedPages(file: File, onProgress?: (done: number, total: number) => void): Promise<{ pages: ScannedPage[]; totalPages: number }> {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  const total = Math.min(pdf.numPages, config.ocr.maxPages);
  const pages: ScannedPage[] = [];
  let blank = 0;
  for (let i = 1; i <= total; i++) {
    const canvas = await renderPage(await pdf.getPage(i), config.ocr.longSide);
    // Página em branco (ex.: imagem num formato que o navegador não conseguiu desenhar): não vale pagar a IA por ela.
    if (isBlank(canvas)) blank++;
    else pages.push({ page: i, data: jpeg(canvas, config.ocr.jpegQuality).replace(/^data:image\/jpeg;base64,/, "") });
    onProgress?.(i, total);
  }
  const totalPages = pdf.numPages;
  await pdf.cleanup();
  if (pages.length === 0) throw new AppError(blank ? "PDF_IMAGE_FORMAT" : "PDF_SCANNED");
  return { pages, totalPages };
}
