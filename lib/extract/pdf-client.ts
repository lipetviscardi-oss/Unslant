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

export async function extractFromPdf(file: File): Promise<{ text: string; source: SourceInfo }> {
  const { getDocumentProxy } = await import("unpdf");
  let pdf;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    pdf = await getDocumentProxy(data);
  } catch (err) {
    throw new AppError("PDF_INVALID", err instanceof Error ? err.message : String(err));
  }

  const pages: Line[][] = [];
  let chars = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const pageWidth = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const items = (content.items as unknown[]).filter(
      (it): it is TextItemLike => typeof it === "object" && it !== null && "str" in it,
    );
    chars += items.reduce((s, it) => s + it.str.trim().length, 0);
    pages.push(orderColumns(pageToLines(items, pageWidth), pageWidth));
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
  await pdf.cleanup();

  return {
    text: normalizeText(paragraphs.join("\n\n")),
    source: { type: "pdf", title: title ?? file.name.replace(/\.pdf$/i, ""), author },
  };
}
