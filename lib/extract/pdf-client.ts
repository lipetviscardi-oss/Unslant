/**
 * LEITURA DE PDF (aba "PDF") — roda no NAVEGADOR do usuário.
 *
 * O arquivo não é enviado ao servidor: o texto é extraído aqui mesmo e só
 * o texto segue para a análise. Isso é mais rápido, mais privado e evita o
 * limite de tamanho de envio da Vercel.
 *
 * PDFs guardam texto como "pedacinhos" posicionados na página, não como
 * parágrafos. Aqui reconstruímos linhas e parágrafos pela posição de cada
 * pedaço, juntamos palavras hifenizadas no fim da linha e removemos números
 * de página soltos.
 */

import { AppError } from "@/lib/errors";
import { normalizeText } from "@/lib/text";
import type { SourceInfo } from "@/lib/analysis/types";

interface Line {
  text: string;
  y: number;
  height: number;
}

interface TextItemLike {
  str: string;
  transform: number[];
  height: number;
  hasEOL?: boolean;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function pageToParagraphs(items: TextItemLike[]): string[] {
  // 1. agrupa pedaços em linhas (mesma altura na página)
  const lines: Line[] = [];
  let current: Line | null = null;
  for (const it of items) {
    const y = it.transform[5];
    if (current && Math.abs(current.y - y) > Math.max(2, (current.height || 10) * 0.4)) {
      lines.push(current);
      current = null;
    }
    if (!current) current = { text: "", y, height: it.height };
    // espaço entre pedaços quando necessário
    if (current.text && !/\s$/.test(current.text) && it.str && !/^\s/.test(it.str)) current.text += " ";
    current.text += it.str;
    current.height = Math.max(current.height, it.height);
    if (it.hasEOL) {
      lines.push(current);
      current = null;
    }
  }
  if (current) lines.push(current);

  const clean = lines
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() }))
    .filter((l) => l.text && !/^\d{1,4}$/.test(l.text)); // remove números de página soltos

  // 2. junta linhas em parágrafos usando o espaço vertical entre elas
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

  const paragraphs: string[] = [];
  let chars = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = (content.items as unknown[]).filter(
      (it): it is TextItemLike => typeof it === "object" && it !== null && "str" in it,
    );
    chars += items.reduce((s, it) => s + it.str.trim().length, 0);
    paragraphs.push(...pageToParagraphs(items));
  }

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
