"use client";

/**
 * Seções menores da página de resultado: fato vs. opinião, omissões,
 * reescrita neutra e detalhes de cada categoria.
 */

import type { AnalysisResult, GroupResult } from "@/lib/analysis/types";
import { TAXONOMY } from "@/lib/taxonomy";
import { CONFIDENCE_LABEL, formatScore, severity, SEVERITY_SOFT, SEVERITY_TEXT } from "@/lib/client/format";

export function FactOpinion({ result }: { result: AnalysisResult }) {
  const fact = Math.round(result.factOpinion.factPercent);
  return (
    <div className="grid content-start gap-2">
      <h3 className="text-base font-medium">Fato e opinião</h3>
      <div
        className="flex h-3 overflow-hidden rounded-full bg-mist-deep"
        role="img"
        aria-label={`Cerca de ${fact}% de fatos e ${100 - fact}% de opinião`}
      >
        <span className="h-full bg-ink" style={{ width: `${fact}%` }} />
      </div>
      <div className="flex justify-between text-sm">
        <span>
          <strong className="font-display tabular-nums">{fact}%</strong> fatos verificáveis
        </span>
        <span className="text-muted">
          <strong className="font-display tabular-nums">{100 - fact}%</strong> opinião e interpretação
        </span>
      </div>
      <p className="text-[15px] text-muted">{result.factOpinion.explanation}</p>
    </div>
  );
}

export function Omissions({ result }: { result: AnalysisResult }) {
  return (
    <section aria-labelledby="omissions-title" className="grid content-start gap-4">
      <h2 id="omissions-title" className="text-2xl font-medium">
        O que o texto pode estar omitindo
      </h2>
      {result.omissions.length === 0 ? (
        <p className="text-muted">Nenhuma omissão relevante foi identificada.</p>
      ) : (
        <ul className="grid gap-4">
          {result.omissions.map((o) => (
            <li key={o.title} className="grid gap-1 border-l-[3px] border-teal pl-4">
              <p className="font-medium">{o.title}</p>
              <p className="text-[15px] leading-relaxed text-muted">{o.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Rewrite({ result, onShow }: { result: AnalysisResult; onShow: (evidenceId: string) => void }) {
  if (!result.rewrite) return null;
  const rw = result.rewrite;
  return (
    <section aria-labelledby="rewrite-title" className="grid content-start gap-4">
      <h2 id="rewrite-title" className="text-2xl font-medium">
        Como ficaria mais neutro
      </h2>
      <div className="grid gap-3 rounded-[20px] bg-paper p-5 sm:p-6">
        <div>
          <p className="mb-1 text-sm text-muted">Trecho original</p>
          <p className="text-[16px] leading-relaxed">
            <span className="hl hl-high">{rw.original}</span>
          </p>
        </div>
        <div>
          <p className="mb-1 text-sm text-muted">Versão neutra sugerida</p>
          <p className="text-[16px] leading-relaxed">
            <span className="rounded bg-teal-soft px-1">{rw.rewritten}</span>
          </p>
        </div>
        <p className="text-[15px] text-muted">{rw.explanation}</p>
        <button
          type="button"
          onClick={() => onShow(rw.evidenceId)}
          className="justify-self-start text-sm text-teal-deep underline underline-offset-4"
        >
          Ver o trecho no texto
        </button>
      </div>
    </section>
  );
}

const STATUS_TEXT = {
  found: "",
  none_found: "Sem problemas encontrados",
  not_applicable: "Não se aplica a este texto",
} as const;

function GroupDetails({ group, onShow }: { group: GroupResult; onShow: (evidenceId: string) => void }) {
  const def = TAXONOMY.find((t) => t.id === group.id);
  const found = group.categories.filter((c) => c.status === "found").length;
  return (
    <details id={`group-${group.id}`} className="group rounded-[16px] bg-paper open:pb-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[16px] px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-display text-[17px] font-medium">{def?.name.pt ?? group.id}</span>
          <span className="block text-sm text-muted">
            {group.score === null
              ? "Não se aplica a este texto"
              : found === 0
                ? "Nenhum problema encontrado"
                : `${found} de ${group.categories.length} categorias com problemas`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {group.score !== null && (
            <span className={`rounded-full px-2.5 py-0.5 font-display tabular-nums ${SEVERITY_SOFT[severity(group.score)]} ${SEVERITY_TEXT[severity(group.score)]}`}>
              {formatScore(group.score)}
            </span>
          )}
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
            <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="grid gap-5 px-5 pt-1 pb-4">
        <p className="text-[15px] text-muted">{def?.description.pt}</p>
        {group.categories.map((c) => {
          const cdef = def?.categories.find((x) => x.id === c.id);
          const sev = severity(c.score);
          return (
            <div key={c.id} className="grid gap-2 border-t border-line pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h4 className="font-medium">{cdef?.name.pt ?? c.id}</h4>
                {c.status === "found" ? (
                  <span className="text-sm">
                    <span className={`rounded-full px-2 py-0.5 font-display tabular-nums ${SEVERITY_SOFT[sev]} ${SEVERITY_TEXT[sev]}`}>
                      {formatScore(c.score)}
                    </span>
                    <span className="ml-2 text-muted">{CONFIDENCE_LABEL[c.confidence]}</span>
                  </span>
                ) : (
                  <span className="text-sm text-muted">{STATUS_TEXT[c.status]}</span>
                )}
              </div>
              {cdef && <p className="text-sm text-muted">{cdef.description.pt}</p>}
              <p className="text-[15px] leading-relaxed">{c.summary}</p>
              {c.evidence.length > 0 && (
                <ul className="grid gap-3">
                  {c.evidence.map((e) => (
                    <li key={e.id} className="grid gap-1 rounded-xl bg-mist px-4 py-3">
                      <p className="text-[15px] italic">“{e.quote}”</p>
                      <p className="text-[15px] text-muted">{e.explanation}</p>
                      <button
                        type="button"
                        onClick={() => onShow(e.id)}
                        className="justify-self-start text-sm text-teal-deep underline underline-offset-4"
                      >
                        Ver no texto
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {c.discarded > 0 && (
                <p className="text-sm text-muted">
                  {c.discarded === 1 ? "1 trecho citado pela IA foi descartado" : `${c.discarded} trechos citados pela IA foram descartados`}{" "}
                  por não existir no texto original.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

export function CategoryDetails({ groups, onShow }: { groups: GroupResult[]; onShow: (evidenceId: string) => void }) {
  return (
    <section aria-labelledby="details-title" className="grid gap-4">
      <div>
        <h2 id="details-title" className="text-2xl font-medium">
          Todas as categorias
        </h2>
        <p className="mt-1 text-muted">
          Cada categoria com nota, nível de confiança e os trechos que sustentam o apontamento.
        </p>
      </div>
      <div className="grid gap-3">
        {groups.map((g) => (
          <GroupDetails key={g.id} group={g} onShow={onShow} />
        ))}
      </div>
    </section>
  );
}
