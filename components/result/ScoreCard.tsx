"use client";

/**
 * Nota geral com a "gangorra": a barra se inclina conforme a nota.
 * 0 = nivelada (texto equilibrado); 10 = bem inclinada.
 */

import { useEffect, useState } from "react";
import type { AnalysisResult } from "@/lib/analysis/types";
import { formatScore, severity, SEVERITY_TEXT } from "@/lib/client/format";
import { useDict, useLang } from "@/lib/i18n";
import { scoreLabel } from "@/lib/taxonomy";

const BEAM_COLOR = { low: "var(--color-teal)", mid: "var(--color-amber)", high: "var(--color-ember)" } as const;

export function TiltMeter({ score }: { score: number }) {
  const target = -(Math.min(10, Math.max(0, score)) / 10) * 20;
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    // Inclina depois de aparecer: é o único movimento automático do site.
    const id = requestAnimationFrame(() => setAngle(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <svg viewBox="0 0 160 104" className="w-[132px] shrink-0 sm:w-[156px]" aria-hidden="true">
      {/* linha de nível (como seria um texto sem viés) */}
      <line x1="10" y1="52" x2="150" y2="52" stroke="var(--color-line)" strokeWidth="2" strokeDasharray="5 5" />
      <g className="tilt-beam" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "80px 52px" }}>
        <rect x="10" y="47" width="140" height="10" rx="5" fill={BEAM_COLOR[severity(score)]} />
        <circle cx="18" cy="40" r="7" fill="var(--color-ink)" opacity="0.18" />
        <circle cx="142" cy="40" r="7" fill="var(--color-ink)" opacity="0.18" />
      </g>
      <path d="M80 56 L66 92 L94 92 Z" fill="var(--color-ink)" />
      <rect x="56" y="92" width="48" height="5" rx="2.5" fill="var(--color-ink)" />
    </svg>
  );
}

export function ScoreCard({ result }: { result: AnalysisResult }) {
  const t = useDict();
  const lang = useLang();
  const sev = severity(result.overall.score);
  return (
    <section aria-labelledby="score-title" className="rounded-[20px] bg-paper p-6 sm:p-7">
      <h2 id="score-title" className="sr-only">
        {t.result.score.srTitle}
      </h2>
      <div className="flex items-center gap-5 sm:gap-7">
        <TiltMeter score={result.overall.score} />
        <div className="min-w-0">
          <p className="font-display leading-none">
            <span className="text-[3.25rem] font-semibold tracking-tight">{formatScore(result.overall.score, lang)}</span>
            <span className="ml-1.5 text-lg text-muted">{t.result.score.outOf}</span>
          </p>
          <p className={`mt-2 font-display text-lg font-medium ${SEVERITY_TEXT[sev]}`}>{scoreLabel(result.overall.score)[lang]}</p>
        </div>
      </div>
      <p className="mt-5 text-[17px] leading-relaxed">{result.summarySimple}</p>
      <p className="mt-4 text-sm text-muted">{t.result.score.explanation}</p>
    </section>
  );
}
