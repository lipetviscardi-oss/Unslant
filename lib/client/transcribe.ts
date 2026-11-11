/**
 * PDF ESCANEADO (roda no navegador): transforma as páginas em imagens e
 * manda para /api/transcribe em lotes pequenos. Devolve o texto transcrito.
 */

import { config } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { renderScannedPages } from "@/lib/extract/pdf-client";
import { AnalyzeError, browserTimeZone } from "./analyze";
import type { Lang } from "@/lib/taxonomy";

type Quality = "good" | "partial" | "poor";
interface TranscribedBatch {
  pages: { page: number; text: string }[];
  quality: Quality;
}

/** Manda um lote para /api/transcribe. retryable = vale tentar de novo página por página. */
async function sendBatch(batch: { page: number; data: string }[], lang: Lang): Promise<TranscribedBatch | { error: AnalyzeError; retryable: boolean }> {
  let res: Response;
  try {
    res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, tz: browserTimeZone(), pages: batch }),
    });
  } catch {
    return { error: new AnalyzeError("NETWORK", errorMessage("OCR_FAILED", lang)), retryable: true };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.pages) {
    const code = data?.code ?? "OCR_FAILED";
    return { error: new AnalyzeError(code, data?.message ?? errorMessage("OCR_FAILED", lang)), retryable: code === "OCR_FAILED" };
  }
  return { pages: data.pages, quality: data.quality };
}

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
  let quality: Quality = "good";
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
    let out = await sendBatch(batch, lang);
    // Lote com várias páginas falhou: tenta uma página por vez (uma só quase nunca falha).
    if ("error" in out && out.retryable && batch.length > 1) {
      const parts: TranscribedBatch[] = [];
      for (const page of batch) {
        const one = await sendBatch([page], lang);
        if ("error" in one) throw one.error;
        parts.push(one);
      }
      out = { pages: parts.flatMap((p) => p.pages), quality: parts.reduce((q, p) => (rank[p.quality] > rank[q] ? p.quality : q), "good" as Quality) };
    }
    if ("error" in out) throw out.error;
    for (const p of out.pages) if (p.text) texts.push(p.text);
    if (rank[out.quality] > rank[quality]) quality = out.quality;
  }
  onProgress({ phase: "transcribing", done: pages.length, total: pages.length });
  return { text: texts.join("\n\n"), transcribedPages: pages.length, totalPages, quality };
}
