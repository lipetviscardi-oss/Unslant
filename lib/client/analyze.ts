/**
 * Envia o pedido de análise ao servidor e lê o progresso em tempo real
 * (roda no navegador).
 */

import type { AnalysisResult, StreamEvent } from "@/lib/analysis/types";
import { errorMessage } from "@/lib/errors";
import type { Lang } from "@/lib/taxonomy";

export type AnalyzeRequest =
  | { mode: "url"; url: string; lang: Lang }
  | { mode: "text"; text: string; lang: Lang }
  | { mode: "pdf"; text: string; meta: { title?: string; author?: string }; lang: Lang }
  | { mode: "claim"; text: string; meta: { context?: string }; lang: Lang }
  | { mode: "demo"; demoId: string; lang: Lang };

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
): Promise<AnalysisResult> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
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
      if (event.type === "result") result = event.result;
      onEvent(event);
    }
    if (done) break;
  }

  if (!result) throw new AnalyzeError("UNKNOWN", errorMessage("UNKNOWN", req.lang));
  return result;
}
