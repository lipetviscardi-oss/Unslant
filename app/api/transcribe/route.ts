/**
 * TRANSCRIÇÃO DE PDF ESCANEADO: POST /api/transcribe
 *
 * Recebe um lote de páginas (imagens JPEG feitas pelo navegador) e devolve o
 * texto transcrito pela IA leve. O navegador manda o documento em lotes
 * pequenos (cada pedido precisa ficar abaixo do limite de tamanho da Vercel)
 * e, no fim, segue para a análise normal com o texto.
 * Proteção contra gastos: limite de páginas por pessoa e no site (config.ocr).
 */

import { z } from "zod";
import { config } from "@/lib/config";
import { AppError, errorMessage } from "@/lib/errors";
import { callStructured, mapApiError, UsageTracker } from "@/lib/ai/client";
import { TranscriptionSchema } from "@/lib/analysis/schemas";
import { transcribePrompt } from "@/lib/prompts/transcribe";
import { identifyViewer } from "@/lib/analysis/usage";
import { releaseOcrPages, reserveOcrPages } from "@/lib/analysis/ocr-usage";

export const maxDuration = 120;

const Body = z.object({
  lang: z.enum(["pt", "en"]).default("pt"),
  tz: z.string().max(64).optional(),
  pages: z
    .array(z.object({ page: z.number().int().min(1).max(config.ocr.maxPages), data: z.string().min(100).max(1_200_000).regex(/^[A-Za-z0-9+/=]+$/) }))
    .min(1)
    .max(config.ocr.batchPages),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  const lang = parsed.success ? parsed.data.lang : "pt";
  const fail = (code: Parameters<typeof errorMessage>[0], status: number) => Response.json({ code, message: errorMessage(code, lang) }, { status });
  if (!parsed.success) return fail("INVALID_INPUT", 400);
  if (!config.ocr.enabled || config.ai.provider !== "anthropic") return fail("PDF_SCANNED", 400);
  const { pages, tz } = parsed.data;

  const viewer = await identifyViewer(tz);
  let reservation: number | "limit" | null = null;
  try {
    reservation = await reserveOcrPages(viewer, pages.length);
  } catch (err) {
    console.warn("[unslant] limite de transcrição indisponível:", err);
    return fail("UNKNOWN", 500);
  }
  if (reservation === "limit") return fail("OCR_LIMIT", 429);

  const usage = new UsageTracker();
  try {
    const out = await callStructured({
      label: `transcrição (${pages.length} página(s))`,
      stage: "transcrição",
      light: true,
      schema: TranscriptionSchema,
      task: transcribePrompt(pages.map((p) => p.page)),
      images: pages.map((p) => ({ label: `[página ${p.page}]`, mediaType: "image/jpeg" as const, data: p.data })),
      effort: "low",
      maxTokens: config.ocr.maxTokens,
      usage,
      signal: request.signal,
    });
    // Só as páginas pedidas, na ordem pedida.
    const byPage = new Map(out.pages.map((p) => [p.page, p.text.trim()]));
    const result = pages.map((p) => ({ page: p.page, text: byPage.get(p.page) ?? "" }));
    console.info(`[unslant] transcrição: ${pages.length} página(s), qualidade ${out.quality}, US$ ${usage.costUsd()}`);
    return Response.json({ pages: result, quality: out.quality, costUsd: usage.costUsd() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (typeof reservation === "number") await releaseOcrPages(reservation).catch(() => undefined);
    const e = err instanceof AppError ? err : mapApiError(err);
    console.error(`[unslant] transcrição falhou: ${e.code}`, e.detail ?? "");
    return fail(e.code === "AI_AUTH" || e.code === "AI_NO_CREDIT" || e.code === "AI_RATE_LIMIT" ? e.code : "OCR_FAILED", 502);
  }
}
