/**
 * Envia o pedido de análise ao servidor e lê o progresso em tempo real
 * (roda no navegador).
 */

import type { AnalysisResult, ResultAccess, StreamEvent } from "@/lib/analysis/types";
import { errorMessage } from "@/lib/errors";
import type { Lang } from "@/lib/taxonomy";

/** Tipos de texto que o usuário pode escolher no formulário. */
export type DeclaredType =
  | "news"
  | "feature"
  | "analysis"
  | "opinion"
  | "editorial"
  | "academic_paper"
  | "press_release"
  | "blog"
  | "other";

export type AnalyzeRequest = (
  | { mode: "url"; url: string; lang: Lang; contentType?: DeclaredType }
  | { mode: "text"; text: string; lang: Lang; contentType?: DeclaredType }
  | {
      mode: "pdf";
      text: string;
      meta: { title?: string; author?: string };
      /** Páginas com figura/tabela, já como imagem. */
      images?: { page: number; data: string; thumb?: string; caption?: string }[];
      lang: Lang;
      contentType?: DeclaredType;
    }
  | { mode: "claim"; text: string; meta: { context?: string }; lang: Lang }
  | { mode: "demo"; demoId: string; lang: Lang }
) & {
  /** true = ignora o resultado guardado e analisa de novo. */
  fresh?: boolean;
  /** Tipo de análise: "simple" ou "detailed" (decide o limite do dia e como o resultado abre). */
  view?: "simple" | "detailed";
};

/** Fuso horário do navegador: o limite diário zera à meia-noite dele. */
export function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export class AnalyzeError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function requestAnalysis(
  req: AnalyzeRequest,
  onEvent: (e: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<{ result: AnalysisResult; access?: ResultAccess }> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, tz: browserTimeZone() }),
      signal,
    });
  } catch {
    throw new AnalyzeError("NETWORK", errorMessage("UNKNOWN", req.lang));
  }
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new AnalyzeError(data?.code ?? "UNKNOWN", data?.message ?? errorMessage("UNKNOWN", req.lang));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AnalysisResult | null = null;
  let access: ResultAccess | undefined;

  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === "error") throw new AnalyzeError(event.code, event.message);
      if (event.type === "result") {
        result = event.result;
        access = event.access;
      }
      onEvent(event);
    }
    if (done) break;
  }

  if (!result) throw new AnalyzeError("UNKNOWN", errorMessage("UNKNOWN", req.lang));
  return { result, access };
}
