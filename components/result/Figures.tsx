"use client";

/**
 * "Imagens e gráficos": cada figura que a IA viu (páginas de PDF com figuras
 * ou tabelas, imagens da matéria), com miniatura, descrição e os problemas
 * encontrados nela.
 */

import type { AnalysisResult, CategoryResult } from "@/lib/analysis/types";
import { formatScore, severity, SEVERITY_SOFT, SEVERITY_TEXT } from "@/lib/client/format";
import { getCategory } from "@/lib/taxonomy";
import { useDict, useLang } from "@/lib/i18n";

export function Figures({ result }: { result: AnalysisResult }) {
  const t = useDict();
  const lang = useLang();
  const figures = result.figures;
  if (!figures?.length) return null;
  const tf = t.result.figures;

  // Problemas encontrados em cada figura (das categorias "só de imagem").
  const issues = new Map<string, { category: CategoryResult; explanation: string }[]>();
  for (const g of result.groups) {
    for (const c of g.categories) {
      for (const e of c.evidence) {
        if (!e.figureId) continue;
        issues.set(e.figureId, [...(issues.get(e.figureId) ?? []), { category: c, explanation: e.explanation }]);
      }
    }
  }
  const relevant = figures.filter((f) => f.relevant || issues.has(f.id));
  const hidden = figures.length - relevant.length;

  return (
    <section aria-labelledby="figures-title" className="flex flex-col gap-5">
      <div>
        <h2 id="figures-title" className="text-2xl font-medium">
          {tf.title}
        </h2>
        <p className="mt-1 max-w-[70ch] text-muted">{tf.intro(figures.length)}</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {relevant.map((f) => {
          const list = issues.get(f.id) ?? [];
          return (
            <li key={f.id} id={`figure-${f.id}`} tabIndex={-1} className="flex gap-4 rounded-[16px] bg-paper p-4 focus:outline-2 focus:outline-teal">
              {f.thumb && (
                // eslint-disable-next-line @next/next/no-img-element -- miniaturas de origens variadas (data URL ou site da matéria)
                <img
                  src={f.thumb}
                  alt={f.description || f.label}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="h-28 w-24 shrink-0 rounded-lg border border-line bg-mist object-cover object-top"
                />
              )}
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
                  <span className="font-medium text-ink">{f.label}</span>
                  <span>{t.labels.figureKind[f.kind]}</span>
                </p>
                {f.description && <p className="text-[15px] leading-relaxed">{f.description}</p>}
                {list.length === 0 ? (
                  <p className="text-sm text-teal-deep">{tf.noIssues}</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {list.map((it, i) => {
                      const sev = severity(it.category.score);
                      const name = getCategory(it.category.id)?.category.name[lang] ?? it.category.id;
                      return (
                        <li key={i} className="text-sm">
                          <span className={`mr-1.5 rounded-full px-2 py-0.5 font-display tabular-nums ${SEVERITY_SOFT[sev]} ${SEVERITY_TEXT[sev]}`}>
                            {formatScore(it.category.score, lang)}
                          </span>
                          <strong className="font-medium">{name}:</strong> {it.explanation}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && <p className="text-sm text-muted">{tf.hidden(hidden)}</p>}
    </section>
  );
}
