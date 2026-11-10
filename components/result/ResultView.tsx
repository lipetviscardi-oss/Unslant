"use client";

/**
 * Página de resultado: junta todas as seções da análise.
 */

import { useCallback, useMemo, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildEvidenceIndex } from "@/lib/client/evidence";
import { Figures } from "./Figures";
import { formatDate } from "@/lib/client/format";
import { useDict, useLang } from "@/lib/i18n";
import { ScoreCard } from "./ScoreCard";
import { PoliticalAxes } from "./PoliticalAxes";
import { GroupOverview } from "./GroupOverview";
import { HighlightedText } from "./HighlightedText";
import { ClaimCheck } from "./ClaimCheck";
import { Balance } from "./Balance";
import { ModeToggle, PoliticalLine, TopProblems } from "./SimpleView";
import { readMode, saveMode, type ResultMode } from "@/lib/client/mode";
import { CategoryDetails, FactOpinion, Omissions, Rewrite } from "./Sections";

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "teal" }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm ${tone === "teal" ? "bg-teal-soft text-teal-deep" : "bg-paper text-muted"}`}>
      {children}
    </span>
  );
}

const MODEL_LABEL: Record<string, string> = {
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
  "gemini-3.8-flash": "Gemini 3.8 Flash",
};

/** "Claude Sonnet 5.5 (especialistas, visão geral) · Claude Haiku 5.5 (identificação, síntese, busca)" */
function modelsUsed(s: AnalysisResult["stats"]): string {
  if (!s.stages) return MODEL_LABEL[s.model] ?? s.model;
  const byModel = new Map<string, string[]>();
  for (const [stage, v] of Object.entries(s.stages)) {
    for (const m of v.model.split(" + ")) byModel.set(m, [...(byModel.get(m) ?? []), stage]);
  }
  return [...byModel.entries()].map(([m, stages]) => `${MODEL_LABEL[m] ?? m} (${stages.join(", ")})`).join(" · ");
}

function Stats({ result }: { result: AnalysisResult }) {
  const t = useDict();
  const lang = useLang();
  const s = result.stats;
  const seconds = Math.round(s.durationMs / 1000);
  const cost = s.estimatedCostUsd.toLocaleString(lang === "pt" ? "pt-BR" : "en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return (
    <section aria-label={t.result.stats.aria} className="border-t border-line pt-6 text-sm text-muted">
      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <dt className="inline">{t.result.stats.model}</dt>
          <dd className="inline text-ink">{result.demo ? t.result.stats.demoModel : modelsUsed(s)}</dd>
        </div>
        {!result.demo && (
          <>
            <div>
              <dt className="inline">{t.result.stats.cost}</dt>
              <dd className="inline text-ink">{s.fromCache ? t.result.stats.costCached(cost) : `US$ ${cost}`}</dd>
            </div>
            {s.webSearches ? (
              <div>
                <dt className="inline">{t.result.stats.searches}</dt>
                <dd className="inline text-ink">{s.webSearches}</dd>
              </div>
            ) : null}
            <div>
              <dt className="inline">{t.result.stats.time}</dt>
              <dd className="inline text-ink">{seconds} s</dd>
            </div>
          </>
        )}
        <div>
          <dt className="inline">{t.result.stats.discarded}</dt>
          <dd className="inline text-ink">{s.discardedEvidence}</dd>
        </div>
        {!result.demo && (
          <div>
            <dt className="inline">{t.result.stats.version}</dt>
            <dd className="inline text-ink">{result.promptVersion}</dd>
          </div>
        )}
      </dl>
      {s.parts > 1 && <p className="mt-2">{t.result.stats.parts(s.parts)}</p>}
    </section>
  );
}

export function ResultView({
  result,
  onReset,
  onReanalyze,
  initialMode,
}: {
  result: AnalysisResult;
  /** Tipo de análise escolhido no formulário. */
  initialMode?: ResultMode;
  onReset: () => void;
  /** Só aparece quando o resultado veio do cache: refaz a análise do zero. */
  onReanalyze?: () => void;
}) {
  const t = useDict();
  const lang = useLang();
  const index = useMemo(() => buildEvidenceIndex(result), [result]);
  const [selected, setSelected] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  // Modo simples primeiro; o site lembra a última escolha do leitor (só neste navegador).
  // Abre no tipo de análise escolhido no formulário (ou na última escolha do leitor).
  const [mode, setModeState] = useState<ResultMode>(() => initialMode ?? readMode());
  const setMode = useCallback((m: ResultMode) => {
    setModeState(m);
    saveMode(m);
  }, []);

  /** Rola até um trecho no texto e o seleciona. Devolve false se ele não estiver visível. */
  const scrollToEvidence = useCallback((evidenceId: string) => {
    const el = document.querySelector<HTMLElement>(`[data-ids~="${CSS.escape(evidenceId)}"]`);
    if (!el) return false;
    // seleciona o destaque inteiro (todas as evidências que ele reúne)
    const ids = el.getAttribute("data-ids")?.split(" ").filter(Boolean) ?? [];
    setSelected(ids.length ? ids : [evidenceId]);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    el.classList.remove("hl-flash");
    void el.getBoundingClientRect();
    el.classList.add("hl-flash");
    el.focus({ preventScroll: true });
    return true;
  }, []);

  const showEvidence = useCallback(
    (evidenceId: string) => {
      // Evidência numa imagem: rola até a figura na seção "Imagens e gráficos".
      const figureId = index.get(evidenceId)?.evidence.figureId;
      if (figureId) {
        const el = document.getElementById(`figure-${figureId}`);
        el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        el?.focus({ preventScroll: true });
        return;
      }
      if (scrollToEvidence(evidenceId)) return;
      // O trecho é leve e está escondido: mostra todos e tenta de novo.
      setShowAll(true);
      setTimeout(() => scrollToEvidence(evidenceId), 60);
    },
    [scrollToEvidence, index],
  );

  /** No modo simples, "Ver no texto" abre o modo detalhado e vai até o trecho. */
  const showInDetailed = useCallback(
    (evidenceId: string) => {
      setMode("detailed");
      setTimeout(() => showEvidence(evidenceId), 80);
    },
    [setMode, showEvidence],
  );

  const showGroup = useCallback((groupId: string) => {
    const el = document.getElementById(`group-${groupId}`) as HTMLDetailsElement | null;
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const { source, context } = result;
  const isClaim = context.contentType === "claim";
  const date = formatDate(source.publishedAt, lang);
  const byline = [source.outlet, source.author, date].filter(Boolean);
  const otherLanguage = result.language !== lang;

  return (
    <div className="mx-auto grid max-w-6xl gap-14">
      <div className="grid gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-ink px-4 py-1.5 font-display text-[15px] font-medium hover:bg-ink hover:text-paper"
          >
            {t.result.newAnalysis}
          </button>
          <div className="grid gap-1 text-right text-sm text-muted">
            {result.demo && <p>{t.result.demoNote}</p>}
            {result.stats.fromCache && (
              <p>
                {t.result.cacheNote}
                {onReanalyze && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={onReanalyze}
                      className="font-medium text-teal-deep underline underline-offset-2 hover:no-underline"
                    >
                      {t.result.reanalyze}
                    </button>{" "}
                    <span>{t.result.reanalyzeCost}</span>
                  </>
                )}
              </p>
            )}
            {otherLanguage && <p>{t.result.languageNote(t.labels.languageName[result.language])}</p>}
          </div>
        </div>

        <header className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip tone="teal">{t.labels.contentType[context.contentType]}</Chip>
            {context.country && <Chip>{context.country}</Chip>}
            {context.topic && <Chip>{context.topic}</Chip>}
          </div>
          {!isClaim && (context.contentTypeSource === "user" || context.contentTypeReason) && (
            <p className="max-w-[70ch] text-sm text-muted">
              {context.contentTypeSource === "user" ? (
                t.result.typeByUser
              ) : (
                <>
                  <span className="font-medium text-ink">{t.result.typeReason(t.labels.contentType[context.contentType])}</span>
                  {context.contentTypeReason}
                </>
              )}
            </p>
          )}
          {isClaim ? (
            <>
              <p className="text-sm text-muted">{t.result.claimHeading}</p>
              <h1 className="max-w-4xl text-[1.6rem] leading-snug font-semibold sm:text-[2rem]">“{result.text}”</h1>
              {source.claimContext && (
                <p className="text-muted">
                  {t.result.claimSeenAt} {source.claimContext}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="max-w-4xl text-[1.75rem] leading-tight font-semibold sm:text-[2.25rem]">
                {source.title || context.topic || t.result.untitled}
              </h1>
              {byline.length > 0 && <p className="text-muted">{byline.join(", ")}</p>}
              {source.url && (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="justify-self-start text-sm break-all text-teal-deep underline underline-offset-4">
                  {t.result.openOriginal}
                </a>
              )}
            </>
          )}
        </header>

        <ModeToggle mode={mode} onChange={setMode} />

        {mode === "simple" ? (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <ScoreCard result={result} />
            <PoliticalLine result={result} />
          </div>
        ) : null}
        {mode === "simple" && isClaim && result.claimCheck && <ClaimCheck check={result.claimCheck} />}
      </div>

      {mode === "simple" ? (
        <>
          <TopProblems result={result} onShow={showInDetailed} />
          {!isClaim && <Rewrite result={result} onShow={showInDetailed} />}
          <Balance result={result} limit={2} compact />
          <div className="flex flex-col items-start gap-2 border-t border-line pt-8">
            <button
              type="button"
              onClick={() => {
                setMode("detailed");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-full bg-ink px-5 py-2.5 font-display text-[16px] font-medium text-paper hover:bg-teal-deep"
            >
              {t.result.simple.seeAll}
            </button>
            <p className="text-sm text-muted">{t.result.simple.seeAllHelp}</p>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-8">
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
              <ScoreCard result={result} />
              <PoliticalAxes result={result} />
            </div>

            {isClaim && result.claimCheck && <ClaimCheck check={result.claimCheck} />}

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <section aria-labelledby="summary-title" className="grid content-start gap-2">
                <h2 id="summary-title" className="text-xl font-medium">
                  {t.result.summaryTitle}
                </h2>
                <p className="max-w-[68ch] text-[17px] leading-relaxed">{result.summary}</p>
                {context.politicalContext && (
                  <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-muted">
                    <span className="font-medium text-ink">{t.result.contextConsidered}</span>
                    {context.politicalContext}
                  </p>
                )}
              </section>
              <FactOpinion result={result} />
            </div>
          </div>

          <GroupOverview groups={result.groups} onSelectGroup={showGroup} />

          <HighlightedText
            result={result}
            index={index}
            selected={selected}
            onSelect={setSelected}
            showAll={showAll}
            onToggleAll={() => setShowAll((v) => !v)}
          />

          <Figures result={result} />

          <div className="grid gap-10 lg:grid-cols-2">
            <Omissions result={result} />
            {/* Em afirmações, a "versão mais precisa" já aparece na verificação. */}
            {!isClaim && <Rewrite result={result} onShow={showEvidence} />}
          </div>

          <Balance result={result} />

          <CategoryDetails groups={result.groups} onShow={showEvidence} />
        </>
      )}

      <Stats result={result} />
    </div>
  );
}
