/**
 * PDF ESCANEADO (roda no navegador): transforma as páginas em imagens e
 * manda para /api/transcribe em lotes pequenos. Devolve o texto transcrito.
 */

import { config } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { renderScannedPages } from "@/lib/extract/pdf-client";
import { AnalyzeError, browserTimeZone } from "./analyze";
import type { Lang } from "@/lib/taxonomy";

export interface TranscribeProgress {
  phase: "rendering" | "transcribing";
  done: number;
  total: number;
}

export async function transcribePdf(
  file: File,
  lang: Lang,
  onProgress: (p: TranscribeProgress) => void,
): Promise<{ text: string; transcribedPages: number; totalPages: number; quality: "good" | "partial" | "poor" }> {
  const { pages, totalPages } = await renderScannedPages(file, (done, total) => onProgress({ phase: "rendering", done, total }));
  const texts: string[] = [];
  const rank = { good: 0, partial: 1, poor: 2 } as const;
  let quality: "good" | "partial" | "poor" = "good";
  // Lotes de até config.ocr.batchPages páginas E até ~3 MB (a Vercel recusa pedidos acima de ~4,5 MB).
  const batches: (typeof pages)[] = [];
  for (const p of pages) {
    const last = batches[batches.length - 1];
    const size = last ? last.reduce((n, x) => n + x.data.length, 0) : Infinity;
    if (!last || last.length >= config.ocr.batchPages || size + p.data.length > 3_000_000) batches.push([p]);
    else last.push(p);
  }
  let i = 0;
  for (const batch of batches) {
    onProgress({ phase: "transcribing", done: i, total: pages.length });
    i += batch.length;
    let res: Response;
    try {
      res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, tz: browserTimeZone(), pages: batch }),
      });
    } catch {
      throw new AnalyzeError("NETWORK", errorMessage("OCR_FAILED", lang));
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.pages) throw new AnalyzeError(data?.code ?? "OCR_FAILED", data?.message ?? errorMessage("OCR_FAILED", lang));
    for (const p of data.pages as { page: number; text: string }[]) if (p.text) texts.push(p.text);
    if (rank[data.quality as keyof typeof rank] > rank[quality]) quality = data.quality;
  }
  onProgress({ phase: "transcribing", done: pages.length, total: pages.length });
  return { text: texts.join("\n\n"), transcribedPages: pages.length, totalPages, quality };
}
