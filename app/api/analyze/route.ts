/**
 * ROTA DE ANÁLISE: POST /api/analyze
 *
 * Recebe o conteúdo (link, texto ou texto extraído de PDF), executa a
 * análise e devolve, aos poucos, eventos de progresso e o resultado final
 * (um JSON por linha). Assim a tela mostra em que etapa a análise está.
 */

import { createHash } from "node:crypto";
import { z } from "zod";
import { config } from "@/lib/config";
import { AppError, errorMessage } from "@/lib/errors";
import { countWords, normalizeText } from "@/lib/text";
import { extractFromUrl, fetchImage, type ArticleImage } from "@/lib/extract/url";
import { cleanArticleText } from "@/lib/extract/clean";
import type { VisualInput } from "@/lib/analysis/visuals";
import { runPipeline } from "@/lib/analysis/pipeline";
import { cacheKey, readCache, writeCache } from "@/lib/analysis/cache";
import { releaseDailySlot, reserveDailySlot } from "@/lib/analysis/limits";
import { promptVersion } from "@/lib/prompts/version";
import { runDemo } from "@/lib/demo";
import type { AnalysisResult, ResultAccess, SourceInfo, StreamEvent } from "@/lib/analysis/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { identifyViewer, limitsFor, linkUsage, refundUsage, remainingToday, reserveUsage, siteUsageLast24h, type Kind } from "@/lib/analysis/usage";
import { saveAnalysis } from "@/lib/analysis/store";
import { toSimplePayload } from "@/lib/analysis/access";

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
  /**
   * Aba PDF: páginas com figura/tabela, já transformadas em imagem pelo
   * navegador (JPEG em base64). A miniatura é uma imagem pequena para a tela.
   */
  images: z
    .array(
      z.object({
        page: z.number().int().min(1).max(10_000),
        data: z.string().max(700_000).regex(/^[A-Za-z0-9+/=]+$/),
        thumb: z.string().max(80_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/).optional(),
        caption: z.string().max(300).optional(),
      }),
    )
    .max(config.visual.maxPdfPages)
    .optional(),
  /** Tipo escolhido no formulário (decide o limite usado e o que é enviado ao navegador). */
  view: z.enum(["simple", "detailed"]).optional(),
  /** Fuso horário do navegador (ex.: "America/New_York"): o limite diário zera à meia-noite dele. */
  tz: z.string().max(64).optional(),
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

  // Limites por pessoa (Fase 4): só com o banco configurado. Exemplos prontos e o
  // teste automático (npm run teste, só no computador de desenvolvimento) não contam.
  const kind: Kind = body.view === "detailed" ? "detailed" : "simple";
  const limitsOn = body.mode !== "demo" && !dev && supabaseAdmin() !== null;
  // Precisa ser antes de começar a resposta: pode gravar o cookie anônimo do visitante.
  const viewer = limitsOn ? await identifyViewer(body.tz) : null;
  if (viewer && limitsFor(viewer)[kind] === 0) {
    return Response.json({ code: "LOGIN_REQUIRED", message: errorMessage("LOGIN_REQUIRED", lang) }, { status: 403 });
  }
  /** Salva em "Minhas análises" (quem tem conta) e diz o que a pessoa pode ver. */
  const finish = async (result: AnalysisResult, key: string, counted: boolean, usageId: number | null) => {
    if (!viewer) return { result, access: undefined };
    const analysisId = await saveAnalysis({ viewer, kind, result, cacheKey: key, counted });
    if (analysisId) await linkUsage(usageId, analysisId);
    const access: ResultAccess = {
      limitsOn: true,
      loggedIn: Boolean(viewer.userId),
      analysisId: analysisId ?? undefined,
      kind,
      unlocked: kind === "detailed",
      remaining: await remainingToday(viewer),
    };
    // Na simples, o navegador recebe só o que o modo simples mostra.
    return { result: kind === "simple" ? toSimplePayload(result) : result, access };
  };

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
      let usageId: number | null = null;
      try {
        if (body.mode === "demo") {
          send({ type: "result", result: await runDemo(body.demoId ?? "", lang, send) });
          return;
        }

        // 1. Obter o texto
        send({ type: "stage", stage: "extracting" });
        let text: string;
        let source: SourceInfo;
        let visuals: VisualInput[] = [];
        if (body.mode === "url") {
          if (!body.url) throw new AppError("URL_INVALID");
          const page = await extractFromUrl(body.url);
          ({ text, source } = page);
          visuals = await downloadArticleImages(page.images, lang);
        } else {
          text = normalizeText(body.text ?? "");
          source =
            body.mode === "pdf"
              ? { type: "pdf", title: body.meta?.title || undefined, author: body.meta?.author || undefined }
              : body.mode === "claim"
                ? { type: "claim", claimContext: body.meta?.context?.trim() || undefined }
                : { type: "text" };
        }

        // Tira chamadas de newsletter, propaganda do veículo, "leia também" e listas de tags.
        if (body.mode !== "claim") {
          const cleaned = cleanArticleText(text);
          if (cleaned.removed.length) console.info(`[unslant] limpeza: ${cleaned.removed.length} trecho(s) removido(s)`, cleaned.removed);
          text = cleaned.text;
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
        // As imagens entram na chave (resumidas por um hash): o mesmo texto com imagens diferentes
        // nunca reaproveita o resultado guardado de outras imagens.
        const imagesForKey = body.mode === "pdf" ? (body.images ?? []) : visuals.map((v) => ({ data: v.data, caption: v.caption }));
        const images = imagesForKey.length ? createHash("sha256").update(JSON.stringify(imagesForKey)).digest("hex") : "";
        const key = cacheKey(JSON.stringify({ mode: body.mode, source, text, images }), lang, promptVersion());
        const cached = dev?.noCache || body.fresh ? null : await readCache(key);
        if (cached) {
          cached.stats.fromCache = true;
          // Resultado reaproveitado: sai na hora e não conta no limite do dia.
          send({ type: "result", ...(await finish(cached, key, false, null)) });
          return;
        }

        // 3. Análise com a IA: confere o limite do dia e registra o uso ANTES de gastar.
        if (viewer) {
          const remaining = await remainingToday(viewer);
          if (remaining && remaining[kind] <= 0) {
            throw new AppError(kind === "detailed" ? "LIMIT_DETAILED" : viewer.userId ? "LIMIT_SIMPLE" : "LIMIT_ANON");
          }
          const site = await siteUsageLast24h();
          if (site !== null && site >= config.limits.globalDailyAnalyses) {
            throw new AppError("DAILY_LIMIT", `${site}/${config.limits.globalDailyAnalyses} nas últimas 24 h`);
          }
          const slot = await reserveUsage(viewer, kind);
          if (slot === "limit") throw new AppError(kind === "detailed" ? "LIMIT_DETAILED" : viewer.userId ? "LIMIT_SIMPLE" : "LIMIT_ANON");
          usageId = slot;
        } else {
          reserveDailySlot();
          reserved = true;
        }
        if (body.mode === "pdf" && body.images?.length) {
          visuals = body.images.map((img, i) => ({
            id: `img-${i + 1}`,
            label: `${lang === "pt" ? "Página" : "Page"} ${img.page}`,
            caption: img.caption,
            mediaType: "image/jpeg" as const,
            data: img.data,
            thumb: img.thumb,
          }));
        }
        const result = await runPipeline({
          visuals,
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
        send({ type: "result", ...(await finish(result, key, true, usageId)) });
      } catch (err) {
        const code = err instanceof AppError ? err.code : "UNKNOWN";
        // Erros que acontecem antes de qualquer gasto devolvem a vaga do limite diário.
        if (reserved && (code === "MISSING_API_KEY" || code === "AI_AUTH" || code === "AI_NO_CREDIT")) {
          releaseDailySlot();
        }
        // A análise não saiu: o uso do dia é devolvido.
        if (usageId !== null) await refundUsage(usageId).catch(() => undefined);
        console.error(`[unslant] erro ${code}:`, err instanceof AppError ? err.detail ?? "" : err);
        // No computador de desenvolvimento (npm run dev), o detalhe técnico vai junto, para facilitar
        // o diagnóstico. No site publicado, só a mensagem simples (o detalhe fica no registro do servidor).
        const detail = process.env.NODE_ENV === "development" && err instanceof AppError && err.detail ? ` [detalhe: ${err.detail.slice(0, 400)}]` : "";
        send({ type: "error", code, message: errorMessage(code, lang) + detail });
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

/** Baixa as imagens da matéria (em paralelo, com as proteções de lib/extract/url.ts). As que falharem são puladas. */
async function downloadArticleImages(images: ArticleImage[], lang: "pt" | "en"): Promise<VisualInput[]> {
  if (!config.visual.enabled || images.length === 0) return [];
  const files = await Promise.all(images.map((img) => fetchImage(img.url)));
  const out: VisualInput[] = [];
  files.forEach((file, i) => {
    if (!file) return;
    const img = images[i];
    out.push({
      id: `img-${out.length + 1}`,
      label: `${lang === "pt" ? "Imagem" : "Image"} ${out.length + 1}`,
      caption: img.caption || img.alt,
      mediaType: file.mediaType,
      data: file.data,
      thumb: img.url,
    });
  });
  return out;
}
