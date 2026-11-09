"use client";

/**
 * Inclinação política em dois eixos. Os dois lados usam a MESMA cor, de
 * propósito: a ferramenta não "torce" para nenhum.
 */

import type { AnalysisResult, AxisResult } from "@/lib/analysis/types";
import { useDict } from "@/lib/i18n";

const OPTIONS = ["left", "unidentified", "right"] as const;

function Axis({ name, help, axis }: { name: string; help: string; axis: AxisResult }) {
  const t = useDict();
  const POSITION_LABEL = t.labels.position;
  const CONFIDENCE_LABEL = t.labels.confidence;
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-base font-medium">{name}</h3>
        <span className="text-sm text-muted">{help}</span>
      </div>
      <div className="grid grid-cols-3 rounded-full bg-mist p-1 text-center text-sm" role="img" aria-label={`${name}: ${POSITION_LABEL[axis.position]}`}>
        {OPTIONS.map((o) => (
          <span
            key={o}
            className={`rounded-full px-2 py-1.5 ${axis.position === o ? "bg-ink font-medium text-paper" : "text-muted"}`}
          >
            {POSITION_LABEL[o]}
          </span>
        ))}
      </div>
      <p className="text-[15px] leading-relaxed">
        {axis.justification}
        {axis.position !== "unidentified" && <span className="text-muted"> ({CONFIDENCE_LABEL[axis.confidence]})</span>}
      </p>
      {axis.quote && (
        <blockquote className="border-l-[3px] border-line pl-3 text-[15px] italic text-muted">“{axis.quote}”</blockquote>
      )}
    </div>
  );
}

export function PoliticalAxes({ result }: { result: AnalysisResult }) {
  const t = useDict();
  const country = result.context.country;
  const showCountry = country && !/^(não identificado|unidentified|not identified|internacional|international)$/i.test(country);
  return (
    <section aria-labelledby="axes-title" className="grid content-start gap-6 rounded-[20px] bg-paper p-6 sm:p-7">
      <div>
        <h2 id="axes-title" className="text-xl font-medium">
          {t.result.axes.title}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {showCountry ? t.result.axes.countryNote(country) : ""}
          {t.result.axes.unidentifiedNote}
        </p>
      </div>
      <Axis name={t.result.axes.economic.name} help={t.result.axes.economic.help} axis={result.political.economic} />
      <Axis name={t.result.axes.social.name} help={t.result.axes.social.help} axis={result.political.social} />
    </section>
  );
}
