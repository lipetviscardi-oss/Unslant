"use client";

/**
 * Lista de referências do paper: fica fora da análise e aparece recolhida,
 * logo abaixo do texto, no botão "Mostrar referências".
 */

import { useDict } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/analysis/types";

export function References({ result }: { result: AnalysisResult }) {
  const t = useDict().result.references;
  const refs = result.source.references;
  if (!refs) return null;
  const items = refs.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <details className="group rounded-[16px] bg-paper p-4 sm:p-5">
      <summary className="cursor-pointer list-none font-medium text-teal-deep underline-offset-4 hover:underline">
        <span className="group-open:hidden">{t.show}</span>
        <span className="hidden group-open:inline">{t.hide}</span>
      </summary>
      <p className="mt-3 text-sm text-muted">{t.note}</p>
      <div className="mt-3 grid gap-2 text-sm leading-relaxed text-ink">
        {items.map((p, i) => (
          <p key={i} className="break-words">
            {p}
          </p>
        ))}
      </div>
    </details>
  );
}
