"use client";

/**
 * Página de resultado: junta todas as seções da análise.
 */

import { useCallback, useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildEvidenceIndex } from "@/lib/client/evidence";
import { CONTENT_TYPE_LABEL, formatDate } from "@/lib/client/format";
import { ScoreCard } from "./ScoreCard";
import { PoliticalAxes } from "./PoliticalAxes";
import { GroupOverview } from "./GroupOverview";
import { HighlightedText } from "./HighlightedText";
import { CategoryDetails, FactOpinion, Omissions, Rewrite } from "./Sections";

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "teal" }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm ${
        tone === "teal" ? "bg-teal-soft text-teal-deep" : "bg-paper text-muted"
      }`}
    >
      {children}
    </span>
  );
}

function Stats({ result }: { result: AnalysisResult }) {
  const s = result.stats;
  const seconds = Math.round(s.durationMs / 1000);
  return (
    <section aria-label="Informações técnicas da análise" className="border-t border-line pt-6 text-sm text-muted">
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="inline">Modelo: </dt>
          <dd className="inline text-ink">{s.model}</dd>
        </div>
        {!result.demo && (
          <>
            <div>
              <dt className="inline">Custo estimado: </dt>
              <dd className="inline text-ink">
                {s.fromCache ? "US$ 0 (resultado guardado)" : `US$ ${s.estimatedCostUsd.toFixed(3).replace(".", ",")}`}
              </dd>
            </div>
            <div>
              <dt className="inline">Tempo: </dt>
              <dd className="inline text-ink">{seconds} s</dd>
            </div>
          </>
        )}
        <div>
          <dt className="inline">Trechos descartados: </dt>
          <dd className="inline text-ink">{s.discardedEvidence}</dd>
        </div>
      </dl>
      {s.parts > 1 && <p className="mt-2">O texto foi dividido em {s.parts} partes e os resultados foram consolidados.</p>}
    </section>
  );
}

export function ResultView({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const index = useMemo(() => buildEvidenceIndex(result), [result]);
  const [selected, setSelected] = useState<string[]>([]);

  /** Rola até um trecho no texto e o seleciona. */
  const showEvidence = useCallback(
    (evidenceId: string) => {
      const el = document.getElementById(`ev-${evidenceId}`);
      if (!el) return;
      // seleciona o pedaço destacado onde a evidência começa (e todas as evidências que o cobrem)
      const ids = el.getAttribute("data-ids")?.split(" ").filter(Boolean) ?? [];
      setSelected(ids.length ? ids : [evidenceId]);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      el.classList.remove("hl-flash");
      void el.getBoundingClientRect();
      el.classList.add("hl-flash");
      el.focus({ preventScroll: true });
    },
    [],
  );

  const showGroup = useCallback((groupId: string) => {
    const el = document.getElementById(`group-${groupId}`) as HTMLDetailsElement | null;
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const { source, context } = result;
  const date = formatDate(source.publishedAt);
  const byline = [source.outlet, source.author, date].filter(Boolean);

  return (
    <div className="mx-auto grid max-w-6xl gap-14">
      <div className="grid gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-ink px-4 py-1.5 font-display text-[15px] font-medium hover:bg-ink hover:text-paper"
          >
            Nova análise
          </button>
          {result.demo && (
            <p className="text-sm text-muted">Exemplo pronto: resultado preparado à mão, sem usar a IA.</p>
          )}
          {result.stats.fromCache && (
            <p className="text-sm text-muted">Este texto já tinha sido analisado. Mostrando o resultado guardado.</p>
          )}
        </div>

        <header className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip tone="teal">{CONTENT_TYPE_LABEL[context.contentType]}</Chip>
            {context.country && <Chip>{context.country}</Chip>}
            {context.topic && <Chip>{context.topic}</Chip>}
          </div>
          <h1 className="max-w-4xl text-[1.75rem] leading-tight font-semibold sm:text-[2.25rem]">
            {source.title || context.topic || "Texto analisado"}
          </h1>
          {byline.length > 0 && <p className="text-muted">{byline.join(", ")}</p>}
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="justify-self-start text-sm break-all text-teal-deep underline underline-offset-4">
              Abrir a página original
            </a>
          )}
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <ScoreCard result={result} />
          <PoliticalAxes result={result} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section aria-labelledby="summary-title" className="grid content-start gap-2">
            <h2 id="summary-title" className="text-xl font-medium">
              Resumo da análise
            </h2>
            <p className="max-w-[68ch] text-[17px] leading-relaxed">{result.summary}</p>
            {context.politicalContext && (
              <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-muted">
                <span className="font-medium text-ink">Contexto considerado: </span>
                {context.politicalContext}
              </p>
            )}
          </section>
          <FactOpinion result={result} />
        </div>
      </div>

      <GroupOverview groups={result.groups} onSelectGroup={showGroup} />

      <HighlightedText result={result} index={index} selected={selected} onSelect={setSelected} />

      <div className="grid gap-10 lg:grid-cols-2">
        <Omissions result={result} />
        <Rewrite result={result} onShow={showEvidence} />
      </div>

      <CategoryDetails groups={result.groups} onShow={showEvidence} />

      <Stats result={result} />
    </div>
  );
}
