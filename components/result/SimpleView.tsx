"use client";

/**
 * MODO SIMPLES — a resposta rápida: os principais problemas em linguagem do
 * dia a dia (nomes em lib/taxonomy.ts, campo "simpleName"), a inclinação
 * política numa linha e um exemplo de cada problema.
 */

import type { AnalysisResult, CategoryResult, Evidence } from "@/lib/analysis/types";
import { formatScore, severity, SEVERITY_SOFT, SEVERITY_TEXT } from "@/lib/client/format";
import { getCategory } from "@/lib/taxonomy";
import { useDict, useLang } from "@/lib/i18n";

export type ResultMode = "simple" | "detailed";

/** Seletor "Simples | Detalhado". */
export function ModeToggle({ mode, onChange }: { mode: ResultMode; onChange: (m: ResultMode) => void }) {
  const t = useDict();
  return (
    <div role="group" aria-label={t.result.mode.label} className="inline-flex self-start rounded-full bg-mist p-1">
      {(["simple", "detailed"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={`rounded-full px-4 py-1.5 font-display text-[15px] font-medium ${mode === m ? "bg-ink text-paper" : "text-ink hover:bg-paper"}`}
        >
          {t.result.mode[m]}
        </button>
      ))}
    </div>
  );
}

/** Inclinação política em uma linha. */
export function PoliticalLine({ result }: { result: AnalysisResult }) {
  const t = useDict();
  const ts = t.result.simple;
  const { dispute, economic, social } = result.political;
  const parts: string[] = [];
  if (dispute?.status === "favors_a" || dispute?.status === "favors_b") {
    const side = dispute.status === "favors_a" ? dispute.sideA : dispute.sideB;
    parts.push(ts.favors(side, ts.strength[dispute.strength ?? "slight"]));
  } else if (dispute?.status === "balanced") {
    parts.push(ts.balanced);
  }
  for (const [axis, r] of [["economic", economic], ["social", social]] as const) {
    if (r.position === "left" || r.position === "right") parts.push(ts.axis(t.result.axes[axis].name, t.labels.position[r.position]));
  }
  return (
    <section aria-labelledby="simple-political" className="rounded-[20px] bg-paper p-5 sm:p-6">
      <h2 id="simple-political" className="text-sm text-muted">
        {ts.politicalTitle}
      </h2>
      <p className="mt-1 text-[17px] leading-relaxed">{parts.length ? parts.join(" · ") : ts.noLeaning}</p>
    </section>
  );
}

/** Melhor exemplo de um problema: um trecho do autor no texto ou, se for de imagem, a figura. */
function example(c: CategoryResult): Evidence | undefined {
  return c.evidence.find((e) => e.start >= 0 && !e.quoted) ?? c.evidence.find((e) => e.start >= 0) ?? c.evidence[0];
}

/** Os 3 principais problemas, do mais forte para o mais leve. */
export function TopProblems({ result, onShow }: { result: AnalysisResult; onShow: (evidenceId: string) => void }) {
  const t = useDict();
  const lang = useLang();
  const ts = t.result.simple;
  const top = result.groups
    .flatMap((g) => g.categories)
    .filter((c) => c.status === "found" && c.evidence.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <section aria-labelledby="top-problems" className="flex flex-col gap-4">
      <h2 id="top-problems" className="text-2xl font-medium">
        {ts.problemsTitle}
      </h2>
      {top.length === 0 ? (
        <p className="rounded-[20px] bg-paper p-5 text-[17px] sm:p-6">{ts.noProblems}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {top.map((c) => {
            const def = getCategory(c.id)?.category;
            const sev = severity(c.score);
            const ev = example(c);
            const figure = ev?.figureId ? result.figures?.find((f) => f.id === ev.figureId) : undefined;
            return (
              <li key={c.id} className="flex flex-col gap-2 rounded-[20px] bg-paper p-5 sm:p-6">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`rounded-full px-2.5 py-0.5 font-display tabular-nums ${SEVERITY_SOFT[sev]} ${SEVERITY_TEXT[sev]}`}>
                    {formatScore(c.score, lang)}
                  </span>
                  <span className="font-display text-lg font-medium">{def?.simpleName[lang] ?? def?.name[lang] ?? c.id}</span>
                  <span className={`text-sm ${SEVERITY_TEXT[sev]}`}>{ts.level[sev]}</span>
                </p>
                {c.summary && <p className="text-[15px] leading-relaxed text-muted">{c.summary}</p>}
                {ev && (
                  <div className="flex items-start gap-3 rounded-xl bg-mist px-4 py-3">
                    {figure?.thumb && (
                      // eslint-disable-next-line @next/next/no-img-element -- miniatura da figura (data URL ou site da matéria)
                      <img src={figure.thumb} alt={figure.description || figure.label} referrerPolicy="no-referrer" className="h-20 w-16 shrink-0 rounded border border-line object-cover object-top" />
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="text-[15px] italic">{ev.figureId ? ev.quote : `“${ev.quote}”`}</p>
                      <button type="button" onClick={() => onShow(ev.id)} className="self-start text-sm text-teal-deep underline underline-offset-4">
                        {ev.figureId ? t.result.details.showFigure : t.result.details.showInText}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
