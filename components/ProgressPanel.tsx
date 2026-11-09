"use client";

import type { ProgressStage } from "@/lib/analysis/types";

const STEPS: { id: ProgressStage; label: string; detail: string }[] = [
  { id: "extracting", label: "Extraindo o texto", detail: "Separando o texto principal de menus e anúncios." },
  { id: "context", label: "Identificando o contexto", detail: "Tipo de texto, país e cenário político." },
  { id: "analyzing", label: "Analisando os vieses", detail: "Linguagem, fontes, dados, falácias e mais, ao mesmo tempo." },
  { id: "synthesizing", label: "Escrevendo o resumo", detail: "Juntando os achados e conferindo cada trecho citado." },
];

export interface ProgressState {
  stage: ProgressStage;
  done?: number;
  total?: number;
}

export function ProgressPanel({ progress, onCancel }: { progress: ProgressState; onCancel: () => void }) {
  const current = STEPS.findIndex((s) => s.id === progress.stage);

  return (
    <section aria-labelledby="progress-title" className="mx-auto max-w-xl rounded-[20px] bg-paper p-6 sm:p-8">
      <h2 id="progress-title" className="mb-1 text-xl font-medium">
        Analisando
      </h2>
      <p className="mb-6 text-sm text-muted">Costuma levar entre 30 segundos e 2 minutos.</p>

      <ol className="grid gap-5" aria-live="polite">
        {STEPS.map((step, i) => {
          const state = i < current ? "done" : i === current ? "active" : "pending";
          return (
            <li key={step.id} className="grid grid-cols-[28px_1fr] gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full border-2 ${
                  state === "done"
                    ? "border-teal bg-teal text-paper"
                    : state === "active"
                      ? "border-teal"
                      : "border-line"
                }`}
              >
                {state === "done" ? (
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M3 7.5 6 10l5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : state === "active" ? (
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-teal motion-reduce:animate-none" />
                ) : null}
              </span>
              <div className={state === "pending" ? "text-muted" : ""}>
                <p className="font-medium">
                  {step.label}
                  <span className="sr-only">
                    {state === "done" ? " (concluído)" : state === "active" ? " (em andamento)" : " (aguardando)"}
                  </span>
                </p>
                {state === "active" && <p className="text-sm text-muted">{step.detail}</p>}
                {state === "active" && step.id === "analyzing" && progress.total ? (
                  <div className="mt-2">
                    <div className="h-2 overflow-hidden rounded-full bg-mist">
                      <div
                        className="h-full rounded-full bg-teal transition-[width] duration-300"
                        style={{ width: `${Math.round(((progress.done ?? 0) / progress.total) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {progress.done ?? 0} de {progress.total} aspectos concluídos
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <button type="button" onClick={onCancel} className="mt-8 text-sm text-muted underline underline-offset-4 hover:text-ink">
        Cancelar análise
      </button>
    </section>
  );
}
