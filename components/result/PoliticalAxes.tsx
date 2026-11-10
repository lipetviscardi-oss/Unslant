"use client";

/**
 * Inclinação política: eixos econômico e social + lado favorecido numa
 * disputa (governo × oposição, candidato A × B). Todos os lados usam a MESMA
 * cor, de propósito: a ferramenta não "torce" para nenhum.
 */

import type { AnalysisResult, AxisResult, DisputeResult } from "@/lib/analysis/types";
import { useDict } from "@/lib/i18n";

const OPTIONS = ["left", "unidentified", "right"] as const;

/** Faixa com três opções, uma delas destacada. */
function Pills({
  label,
  options,
  active,
  wrap = false,
}: {
  label: string;
  options: { id: string; text: string }[];
  active: string;
  wrap?: boolean;
}) {
  const shape = wrap ? "rounded-2xl" : "rounded-full";
  return (
    <div className={`flex w-full items-stretch ${shape} bg-mist p-1 text-center text-sm`} role="img" aria-label={label}>
      {options.map((o) => (
        <span
          key={o.id}
          className={`flex min-w-0 flex-1 basis-0 items-center justify-center ${wrap ? "break-words leading-snug" : ""} ${shape} px-2 py-1.5 ${active === o.id ? "bg-ink font-medium text-paper" : "text-muted"}`}
          title={o.text}
        >
          <span className={wrap ? "" : "truncate"}>{o.text}</span>
        </span>
      ))}
    </div>
  );
}

function Header({ name, help }: { name: string; help: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
      <h3 className="text-base font-medium">{name}</h3>
      <span className="text-sm text-muted">{help}</span>
    </div>
  );
}

function Quote({ text }: { text: string }) {
  if (!text) return null;
  return <blockquote className="m-0 border-l-[3px] border-line pl-3 text-[15px] italic text-muted">“{text}”</blockquote>;
}

function Axis({ name, help, axis }: { name: string; help: string; axis: AxisResult }) {
  const t = useDict();
  const L = t.labels.position;
  if (axis.position === "not_applicable") {
    return (
      <div className="flex flex-col gap-2">
        <Header name={name} help={help} />
        <p className="text-[15px] text-muted">
          <span className="font-medium text-ink">{L.not_applicable}.</span> {axis.justification}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Header name={name} help={help} />
      <Pills label={`${name}: ${L[axis.position]}`} options={OPTIONS.map((o) => ({ id: o, text: L[o] }))} active={axis.position} />
      <p className="text-[15px] leading-relaxed">
        {axis.justification}
        {(axis.position === "left" || axis.position === "right") && (
          <span className="text-muted"> ({t.labels.confidence[axis.confidence]})</span>
        )}
      </p>
      <Quote text={axis.quote} />
    </div>
  );
}

function Dispute({ dispute }: { dispute: DisputeResult }) {
  const t = useDict();
  const D = t.result.axes.dispute;
  if (dispute.status === "not_applicable") {
    return (
      <div className="flex flex-col gap-2">
        <Header name={D.name} help={D.help} />
        <p className="text-[15px] text-muted">{D.notApplicable}</p>
      </div>
    );
  }
  const active =
    dispute.status === "favors_a" ? "a" : dispute.status === "favors_b" ? "b" : dispute.status === "balanced" ? "mid" : "none";
  const middle = dispute.status === "unidentified" ? D.unidentified : D.balanced;
  const favoredSide = dispute.status === "favors_a" ? dispute.sideA : dispute.status === "favors_b" ? dispute.sideB : null;
  const favored = favoredSide ? `${favoredSide}${dispute.strength ? ` ${D.strength[dispute.strength]}` : ""}` : null;
  return (
    <div className="flex flex-col gap-3">
      <Header name={D.name} help={D.help} />
      <Pills
        label={favored ? D.favors(favored) : middle}
        /* o marcador fica sempre no lado favorecido, inclusive quando a inclinação é leve */
        options={[
          { id: "a", text: dispute.sideA || "A" },
          { id: dispute.status === "unidentified" ? "none" : "mid", text: middle },
          { id: "b", text: dispute.sideB || "B" },
        ]}
        active={active}
        wrap
      />
      <p className="text-[15px] leading-relaxed">
        {favored && <span className="font-medium">{D.favors(favored)}. </span>}
        {dispute.justification}
        {favored && <span className="text-muted"> ({t.labels.confidence[dispute.confidence]})</span>}
      </p>
      <Quote text={dispute.quote} />
    </div>
  );
}

export function PoliticalAxes({ result }: { result: AnalysisResult }) {
  const t = useDict();
  const country = result.context.country;
  const showCountry = country && !/^(não identificado|unidentified|not identified|internacional|international)$/i.test(country);
  return (
    <section aria-labelledby="axes-title" className="flex flex-col gap-6 self-start rounded-[20px] bg-paper p-6 sm:p-7">
      <div>
        <h2 id="axes-title" className="text-xl font-medium">
          {t.result.axes.title}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {showCountry ? t.result.axes.countryNote(country) : ""}
          {t.result.axes.unidentifiedNote}
        </p>
      </div>
      {result.political.dispute && <Dispute dispute={result.political.dispute} />}
      <Axis name={t.result.axes.economic.name} help={t.result.axes.economic.help} axis={result.political.economic} />
      <Axis name={t.result.axes.social.name} help={t.result.axes.social.help} axis={result.political.social} />
    </section>
  );
}
