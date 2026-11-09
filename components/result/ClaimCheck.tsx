"use client";

/**
 * Verificação de uma afirmação: tipo, se dá para verificar, o que as
 * evidências indicam, o que se sabe, por que a ideia circula e como conferir.
 */

import type { ClaimCheckOutput } from "@/lib/analysis/schemas";
import { useDict } from "@/lib/i18n";

const ASSESSMENT_STYLE: Record<ClaimCheckOutput["assessment"], string> = {
  consistent: "bg-teal-soft text-teal-deep",
  partially_consistent: "bg-amber-soft text-amber-ink",
  inconsistent: "bg-ember-soft text-ember-ink",
  insufficient_evidence: "bg-mist-deep text-ink",
  not_applicable: "bg-mist-deep text-ink",
};

export function ClaimCheck({ check }: { check: ClaimCheckOutput }) {
  const t = useDict();
  const L = t.labels;
  return (
    <section aria-labelledby="claim-title" className="grid gap-6 rounded-[20px] bg-paper p-6 sm:p-7">
      <h2 id="claim-title" className="text-2xl font-medium">
        {t.result.claim.title}
      </h2>

      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[auto_auto_minmax(0,1fr)]">
        <div>
          <p className="text-sm text-muted">{t.result.claim.type}</p>
          <p className="font-medium">{L.claimType[check.claimType]}</p>
        </div>
        <div>
          <p className="text-sm text-muted">{t.result.claim.verifiability}</p>
          <p className="font-medium">{L.verifiability[check.verifiability]}</p>
        </div>
        <div>
          <p className="text-sm text-muted">{t.result.claim.assessment}</p>
          <p className="mt-0.5">
            <span className={`inline-block rounded-lg px-2.5 py-1 font-medium ${ASSESSMENT_STYLE[check.assessment]}`}>
              {L.assessment[check.assessment]}
            </span>
            <span className="ml-2 text-sm text-muted">({L.confidence[check.confidence]})</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <h3 className="text-base font-medium">{t.result.claim.whatIsKnown}</h3>
          <p className="text-[15px] leading-relaxed">{check.whatIsKnown}</p>
        </div>
        <div className="grid content-start gap-1.5">
          <h3 className="text-base font-medium">{t.result.claim.origins}</h3>
          <p className="text-[15px] leading-relaxed">{check.possibleOrigins}</p>
        </div>
        <div className="grid content-start gap-1.5">
          <h3 className="text-base font-medium">{t.result.claim.moreAccurate}</h3>
          <p className="text-[16px] leading-relaxed">
            <span className="rounded bg-teal-soft px-1">{check.moreAccurateVersion}</span>
          </p>
        </div>
        {check.howToVerify.length > 0 && (
          <div className="grid content-start gap-1.5">
            <h3 className="text-base font-medium">{t.result.claim.howToVerify}</h3>
            <ul className="grid list-disc gap-1 pl-5 text-[15px] leading-relaxed">
              {check.howToVerify.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="border-t border-line pt-4 text-sm text-muted">{t.result.claim.disclaimer}</p>
    </section>
  );
}
