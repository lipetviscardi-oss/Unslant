"use client";

/**
 * Página inicial do unslant. Ela tem três estados:
 *  - formulário (link, texto, PDF ou afirmação);
 *  - progresso (enquanto a análise acontece);
 *  - resultado.
 */

import { useRef, useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { ProgressPanel, type ProgressState } from "@/components/ProgressPanel";
import { ResultView } from "@/components/result/ResultView";
import { AnalyzeError, requestAnalysis, type AnalyzeRequest } from "@/lib/client/analyze";
import type { AnalysisResult, ResultAccess } from "@/lib/analysis/types";
import { useDict } from "@/lib/i18n";

type View =
  | { kind: "form"; error?: string }
  | { kind: "running"; progress: ProgressState }
  | { kind: "result"; result: AnalysisResult; request: AnalyzeRequest; access?: ResultAccess };

export function Home() {
  const t = useDict();
  const [view, setView] = useState<View>({ kind: "form" });
  const abortRef = useRef<AbortController | null>(null);

  async function start(req: AnalyzeRequest) {
    const controller = new AbortController();
    abortRef.current = controller;
    setView({ kind: "running", progress: { stage: req.mode === "url" ? "extracting" : "context" } });
    window.scrollTo({ top: 0 });
    try {
      const { result, access } = await requestAnalysis(
        req,
        (event) => {
          if (event.type === "stage") {
            setView({ kind: "running", progress: { stage: event.stage, done: event.done, total: event.total, note: event.note } });
          }
        },
        controller.signal,
      );
      setView({ kind: "result", result, request: req, access });
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (controller.signal.aborted) {
        setView({ kind: "form" });
        return;
      }
      const message =
        err instanceof AnalyzeError
          ? err.code === "NETWORK"
            ? t.home.networkError
            : err.message
          : t.home.unexpectedError;
      setView({ kind: "form", error: message });
    } finally {
      abortRef.current = null;
    }
  }

  function reset() {
    setView({ kind: "form" });
    window.scrollTo({ top: 0 });
  }

  if (view.kind === "result") {
    const { result, request, access } = view;
    return (
      <ResultView
        result={result}
        onReset={reset}
        onReanalyze={result.stats.fromCache ? () => start({ ...request, fresh: true }) : undefined}
        initialMode={request.view}
        access={access}
      />
    );
  }

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
        <h1 className="text-[2rem] leading-[1.15] font-semibold sm:text-[2.75rem]">{t.home.title}</h1>
        <p className="max-w-[60ch] text-[18px] leading-relaxed text-muted">{t.home.intro}</p>
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
