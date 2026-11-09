"use client";

/**
 * Página inicial do unslant. Ela tem três estados:
 *  - formulário (escolher link, texto ou PDF);
 *  - progresso (enquanto a análise acontece);
 *  - resultado.
 */

import { useRef, useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { ProgressPanel, type ProgressState } from "@/components/ProgressPanel";
import { ResultView } from "@/components/result/ResultView";
import { AnalyzeError, requestAnalysis, type AnalyzeRequest } from "@/lib/client/analyze";
import type { AnalysisResult } from "@/lib/analysis/types";

type View =
  | { kind: "form"; error?: string }
  | { kind: "running"; progress: ProgressState }
  | { kind: "result"; result: AnalysisResult };

export default function Home() {
  const [view, setView] = useState<View>({ kind: "form" });
  const abortRef = useRef<AbortController | null>(null);

  async function start(req: AnalyzeRequest) {
    const controller = new AbortController();
    abortRef.current = controller;
    setView({ kind: "running", progress: { stage: req.mode === "url" ? "extracting" : "context" } });
    window.scrollTo({ top: 0 });
    try {
      const result = await requestAnalysis(
        req,
        (event) => {
          if (event.type === "stage") {
            setView({ kind: "running", progress: { stage: event.stage, done: event.done, total: event.total } });
          }
        },
        controller.signal,
      );
      setView({ kind: "result", result });
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (controller.signal.aborted) {
        setView({ kind: "form" });
        return;
      }
      const message = err instanceof AnalyzeError ? err.message : "Ocorreu um erro inesperado. Tente de novo.";
      setView({ kind: "form", error: message });
    } finally {
      abortRef.current = null;
    }
  }

  function reset() {
    setView({ kind: "form" });
    window.scrollTo({ top: 0 });
  }

  if (view.kind === "result") return <ResultView result={view.result} onReset={reset} />;

  if (view.kind === "running") {
    return (
      <div className="pt-8 sm:pt-14">
        <ProgressPanel progress={view.progress} onCancel={() => abortRef.current?.abort()} />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-10 pt-8 sm:pt-14">
      <div className="grid gap-4">
        <h1 className="text-[2rem] leading-[1.15] font-semibold sm:text-[2.75rem]">
          Veja como um texto tenta convencer você.
        </h1>
        <p className="max-w-[60ch] text-[18px] leading-relaxed text-muted">
          Envie uma notícia, um artigo de opinião ou um paper. O unslant aponta vieses de linguagem, fontes, dados e
          lógica, sempre com o trecho exato do texto como prova, e mostra a inclinação política quando ela existe.
        </p>
      </div>

      {view.error && (
        <div role="alert" className="rounded-2xl border border-ember/40 bg-ember-soft/60 px-5 py-4 text-[15px] text-ember-ink">
          {view.error}
        </div>
      )}

      <AnalyzeForm onSubmit={start} />
    </div>
  );
}
