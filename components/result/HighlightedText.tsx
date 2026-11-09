"use client";

/**
 * O texto original com os trechos problemáticos destacados.
 * Clicar num destaque mostra a(s) categoria(s) e a explicação.
 */

import { useMemo } from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildSegments, type EvidenceRef } from "@/lib/client/evidence";
import { formatScore, severity, SEVERITY_SOFT, SEVERITY_TEXT } from "@/lib/client/format";

interface Props {
  result: AnalysisResult;
  index: Map<string, EvidenceRef>;
  selected: string[];
  onSelect: (ids: string[]) => void;
}

function EvidenceDetails({ refs, onClose }: { refs: EvidenceRef[]; onClose: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display font-medium">
          {refs.length === 1 ? "O que este trecho indica" : `Este trecho aparece em ${refs.length} categorias`}
        </p>
        <button type="button" onClick={onClose} className="rounded-full px-2 text-sm text-muted underline underline-offset-4 hover:text-ink">
          Fechar
        </button>
      </div>
      <ul className="grid gap-4">
        {refs.map((r) => {
          const sev = severity(r.category.score);
          return (
            <li key={r.evidence.id} className="grid gap-1.5 border-t border-line pt-3 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-medium">{r.categoryDef?.name.pt ?? r.category.id}</p>
                <span className={`rounded-full px-2 py-0.5 text-sm ${SEVERITY_SOFT[sev]} ${SEVERITY_TEXT[sev]}`}>
                  {formatScore(r.category.score)}/10
                </span>
              </div>
              <p className="text-sm text-muted">{r.groupDef?.name.pt}</p>
              <p className="text-[15px] leading-relaxed">{r.evidence.explanation}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HighlightedText({ result, index, selected, onSelect }: Props) {
  const segments = useMemo(() => buildSegments(result.text.length, index), [result.text.length, index]);
  const selectedRefs = selected.map((id) => index.get(id)).filter((r): r is EvidenceRef => Boolean(r));
  const selectedKey = selected.join("|");

  return (
    <section aria-labelledby="text-title" className="grid gap-5">
      <div>
        <h2 id="text-title" className="text-2xl font-medium">
          O texto, com os trechos destacados
        </h2>
        <p className="mt-1 text-muted">
          {index.size > 0
            ? `${index.size} trechos foram apontados. Clique num destaque para ver o motivo.`
            : "Nenhum trecho foi apontado como problemático."}
        </p>
        {index.size > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted" aria-label="Legenda das cores">
            <li className="flex items-center gap-2"><span className="hl hl-low">abc</span> problema leve</li>
            <li className="flex items-center gap-2"><span className="hl hl-mid">abc</span> moderado</li>
            <li className="flex items-center gap-2"><span className="hl hl-high">abc</span> forte</li>
          </ul>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-[20px] bg-paper px-5 py-6 sm:px-8 sm:py-8">
          <div className="max-w-[68ch] whitespace-pre-wrap text-[17px] leading-[1.8]">
            {segments.map((seg) => {
              const slice = result.text.slice(seg.start, seg.end);
              if (seg.ids.length === 0) return <span key={seg.start}>{slice}</span>;
              const maxScore = Math.max(...seg.ids.map((id) => index.get(id)?.category.score ?? 0));
              const sev = severity(maxScore);
              const isSelected = seg.ids.join("|") === selectedKey;
              const names = seg.ids.map((id) => index.get(id)?.categoryDef?.name.pt).filter(Boolean).join(", ");
              return (
                <mark
                  key={seg.start}
                  id={seg.starts.length ? `ev-${seg.starts[0]}` : undefined}
                  data-ids={seg.ids.join(" ")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${slice}. Trecho destacado: ${names}`}
                  onClick={() => onSelect(seg.ids)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(seg.ids);
                    }
                  }}
                  className={`hl hl-${sev} text-inherit`}
                >
                  {slice}
                </mark>
              );
            })}
          </div>
        </article>

        {/* Computador: painel fixo ao lado do texto */}
        <aside className="sticky top-6 hidden rounded-[20px] border border-line bg-paper/70 p-5 lg:block" aria-live="polite">
          {selectedRefs.length > 0 ? (
            <EvidenceDetails refs={selectedRefs} onClose={() => onSelect([])} />
          ) : (
            <p className="text-[15px] text-muted">
              Clique num trecho destacado para ver que tipo de viés ele indica e por quê.
            </p>
          )}
        </aside>
      </div>

      {/* Celular: painel que sobe da parte de baixo da tela */}
      {selectedRefs.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 max-h-[62vh] overflow-y-auto rounded-t-[20px] border-t border-line bg-paper px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(31,47,56,0.15)] lg:hidden"
          role="dialog"
          aria-label="Detalhes do trecho"
        >
          <EvidenceDetails refs={selectedRefs} onClose={() => onSelect([])} />
        </div>
      )}
    </section>
  );
}
