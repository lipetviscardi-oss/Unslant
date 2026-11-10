/**
 * ROTA DE ANÁLISE: POST /api/analyze
 *
 * Recebe o conteúdo (link, texto ou texto extraído de PDF), executa a
 * análise e devolve, aos poucos, eventos de progresso e o resultado final
 * (um JSON por linha). Assim a tela mostra em que etapa a análise está.
 */

import { z } from "zod";
import { config } from "@/lib/config";
import { AppError, errorMessage } from "@/lib/errors";
import { countWords, normalizeText } from "@/lib/text";
import { extractFromUrl } from "@/lib/extract/url";
import { runPipeline } from "@/lib/analysis/pipeline";
import { cacheKey, readCache, writeCache } from "@/lib/analysis/cache";
import { releaseDailySlot, reserveDailySlot } from "@/lib/analysis/limits";
import { promptVersion } from "@/lib/prompts/version";
import { runDemo } from "@/lib/demo";
import type { SourceInfo, StreamEvent } from "@/lib/analysis/types";

// Análises podem levar alguns minutos (limite da Vercel: até 300 s no plano grátis).
export const maxDuration = 300;

const RequestSchema = z.object({
  mode: z.enum(["url", "text", "pdf", "claim", "demo"]),
  lang: z.enum(["pt", "en"]).default("pt"),
  url: z.string().max(2048).optional(),
  text: z.string().max(1_000_000).optional(),
  meta: z
    .object({
      title: z.string().max(500).optional(),
      author: z.string().max(500).optional(),
      /** Afirmações: onde a pessoa viu ou ouviu. */
      context: z.string().max(300).optional(),
    })
    .optional(),
  demoId: z.string().max(50).optional(),
  /** true = ignora o resultado guardado e analisa de novo (botão "Analisar de novo"). */
  fresh: z.boolean().optional(),
  /** Tipo de texto escolhido pelo usuário (opcional; sem ele, a IA identifica). */
  contentType: z
    .enum(["news", "feature", "analysis", "opinion", "editorial", "academic_paper", "press_release", "blog", "other"])
    .optional(),
  /**
   * Opções só para o teste automático (npm run teste). Ignoradas fora do
   * modo de desenvolvimento (npm run dev).
   */
  devOptions: z
    .object({
      /** Analisa do zero, sem usar o cache. */
      noCache: z.boolean().optional(),
      /** Experimenta outro "esforço" nos especialistas (o resultado não vai para o cache). */
      specialistEffort: z.enum(["low", "medium", "high"]).optional(),
      /** Experimenta o modelo leve (Haiku) nos especialistas: todos ("haiku") ou todos menos o da visão geral ("mixed"). */
      specialistModel: z.enum(["haiku", "mixed"]).optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return Response.json({ code: "INVALID_INPUT", message: errorMessage("INVALID_INPUT") }, { status: 400 });
  }
  const lang = body.lang;
  const dev = process.env.NODE_ENV === "development" ? body.devOptions : undefined;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: StreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          closed = true; // o navegador fechou a conexão
        }
      };

      let reserved = false;
      try {
        if (body.mode === "demo") {
          send({ type: "result", result: await runDemo(body.demoId ?? "", lang, send) });
          return;
        }

        // 1. Obter o texto
        send({ type: "stage", stage: "extracting" });
        let text: string;
        let source: SourceInfo;
        if (body.mode === "url") {
          if (!body.url) throw new AppError("URL_INVALID");
          ({ text, source } = await extractFromUrl(body.url));
        } else {
          text = normalizeText(body.text ?? "");
          source =
            body.mode === "pdf"
              ? { type: "pdf", title: body.meta?.title || undefined, author: body.meta?.author || undefined }
              : body.mode === "claim"
                ? { type: "claim", claimContext: body.meta?.context?.trim() || undefined }
                : { type: "text" };
        }

        if (body.contentType && body.mode !== "claim") source = { ...source, declaredType: body.contentType };

        const words = countWords(text);
        const isClaim = body.mode === "claim";
        const min = isClaim ? config.text.claimMinWords : config.text.minWords;
        const max = isClaim ? config.text.claimMaxWords : config.text.maxWords;
        if (words < min) throw new AppError(isClaim ? "CLAIM_TOO_SHORT" : "TEXT_TOO_SHORT", `${words} palavras`);
        if (words > max) throw new AppError(isClaim ? "CLAIM_TOO_LONG" : "TEXT_TOO_LONG", `${words} palavras`);

        // 2. Já analisamos este texto antes? (cache)
        // Cada campo entra separado (JSON), para que textos diferentes nunca gerem a mesma chave.
        const key = cacheKey(JSON.stringify({ mode: body.mode, source, text }), lang, promptVersion());
        const cached = dev?.noCache || body.fresh ? null : await readCache(key);
        if (cached) {
          cached.stats.fromCache = true;
          send({ type: "result", result: cached });
          return;
        }

        // 3. Análise com a IA
        reserveDailySlot();
        reserved = true;
        const result = await runPipeline({
          text,
          source,
          lang,
          signal: request.signal,
          onProgress: send,
          specialistEffort: dev?.specialistEffort,
          specialistModel: dev?.specialistModel,
        });
        // Resultado de experimento não entra no cache (para não se misturar com as análises normais).
        if (!dev?.specialistEffort && !dev?.specialistModel) await writeCache(key, result);
        send({ type: "result", result });
      } catch (err) {
        const code = err instanceof AppError ? err.code : "UNKNOWN";
        // Erros que acontecem antes de qualquer gasto devolvem a vaga do limite diário.
        if (reserved && (code === "MISSING_API_KEY" || code === "AI_AUTH" || code === "AI_NO_CREDIT")) {
          releaseDailySlot();
        }
        console.error(`[unslant] erro ${code}:`, err instanceof AppError ? err.detail ?? "" : err);
        send({ type: "error", code, message: errorMessage(code, lang) });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* já fechado */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
