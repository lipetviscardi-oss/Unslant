"use client";

/**
 * O texto original com os trechos problemáticos destacados.
 * Clicar num destaque mostra a(s) categoria(s) e a explicação.
 */

import { useMemo } from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildSegments, countHighlights, type EvidenceRef } from "@/lib/client/evidence";
import { formatScore, severity, SEVERITY_SOFT, SEVERITY_TEXT } from "@/lib/client/format";
import { useDict, useLang } from "@/lib/i18n";

interface Props {
  result: AnalysisResult;
  index: Map<string, EvidenceRef>;
  selected: string[];
  onSelect: (ids: string[]) => void;
  showAll: boolean;
  onToggleAll: () => void;
}

function EvidenceDetails({ refs, onClose }: { refs: EvidenceRef[]; onClose: () => void }) {
  const t = useDict();
  const lang = useLang();
  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display font-medium">
          {refs.length === 1 ? t.result.text.detailsOne : t.result.text.detailsMany(refs.length)}
        </p>
        <button type="button" onClick={onClose} className="rounded-full px-2 text-sm text-muted underline underline-offset-4 hover:text-ink">
          {t.result.text.close}
        </button>
      </div>
      <ul className="grid gap-4">
        {refs.map((r) => {
          const sev = severity(r.category.score);
          return (
            <li key={r.evidence.id} className="grid gap-1.5 border-t border-line pt-3 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-medium">{r.categoryDef?.name[lang] ?? r.category.id}</p>
                <span className={`rounded-full px-2 py-0.5 text-sm ${SEVERITY_SOFT[sev]} ${SEVERITY_TEXT[sev]}`}>
                  {formatScore(r.category.score, lang)}/10
                </span>
              </div>
              <p className="text-sm text-muted">
                {r.groupDef?.name[lang]}
                {r.evidence.strength ? ` · ${t.result.text.weight(t.result.text.strength[r.evidence.strength])}` : ""}
              </p>
              {r.evidence.eraUsage && (
                <p>
                  <span className="rounded-full bg-mist px-2 py-0.5 text-xs text-ink">{t.result.era.usage[r.evidence.eraUsage]}</span>
                </p>
              )}
              <p className="text-[15px] leading-relaxed">{r.evidence.explanation}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function HighlightedText({ result, index, selected, onSelect, showAll, onToggleAll }: Props) {
  const t = useDict();
  const lang = useLang();
  const segments = useMemo(() => buildSegments(result.text.length, index, !showAll), [result.text.length, index, showAll]);
  const counts = useMemo(() => countHighlights(index), [index]);
  const selectedRefs = selected.map((id) => index.get(id)).filter((r): r is EvidenceRef => Boolean(r));
  const selectedKey = selected.join("|");
  const isClaim = result.context.contentType === "claim";

  return (
    <section aria-labelledby="text-title" className="grid gap-5">
      <div>
        <h2 id="text-title" className="text-2xl font-medium">
          {isClaim ? t.result.text.titleClaim : t.result.text.title}
        </h2>
        <p className="mt-1 text-muted">
          {counts.total === 0
            ? t.result.text.none
            : showAll
              ? t.result.text.count(counts.total)
              : t.result.text.countFiltered(counts.visible, counts.total)}
        </p>
        {counts.total > counts.visible && (
          <button
            type="button"
            onClick={onToggleAll}
            aria-pressed={showAll}
            className="mt-2 rounded-full border border-line bg-paper px-4 py-1.5 text-sm hover:border-ink"
          >
            {showAll ? t.result.text.showStrong : t.result.text.showAll(counts.total)}
          </button>
        )}
        {counts.total > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted" aria-label={t.result.text.legendAria}>
            <li className="flex items-center gap-2"><span className="hl hl-low">abc</span> {t.result.text.legend.low}</li>
            <li className="flex items-center gap-2"><span className="hl hl-mid">abc</span> {t.result.text.legend.mid}</li>
            <li className="flex items-center gap-2"><span className="hl hl-high">abc</span> {t.result.text.legend.high}</li>
            <li className="basis-full text-[13px]">{t.result.text.legendNote}</li>
          </ul>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-[20px] bg-paper px-5 py-6 sm:px-8 sm:py-8">
          <div className={`max-w-[68ch] whitespace-pre-wrap leading-[1.8] ${isClaim ? "text-[19px]" : "text-[17px]"}`}>
            {segments.map((seg) => {
              const slice = result.text.slice(seg.start, seg.end);
              if (seg.ids.length === 0) return <span key={seg.start}>{slice}</span>;
              const sev = seg.tone;
              const isSelected = seg.ids.join("|") === selectedKey;
              const names = [...new Set(seg.ids.map((id) => index.get(id)?.categoryDef?.name[lang]).filter(Boolean))].join(", ");
              return (
                <mark
                  key={seg.start}
                  data-ids={seg.ids.join(" ")}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={t.result.text.markAria(slice, names)}
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
            <p className="text-[15px] text-muted">{t.result.text.asideHint}</p>
          )}
        </aside>
      </div>

      {/* Celular: painel que sobe da parte de baixo da tela */}
      {selectedRefs.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 max-h-[62vh] overflow-y-auto rounded-t-[20px] border-t border-line bg-paper px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(31,47,56,0.15)] lg:hidden"
          role="dialog"
          aria-label={t.result.text.dialogAria}
        >
          <EvidenceDetails refs={selectedRefs} onClose={() => onSelect([])} />
        </div>
      )}
    </section>
  );
}
