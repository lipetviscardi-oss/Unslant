"use client";

/**
 * "Para equilibrar sua leitura": textos reais encontrados na web (com links
 * conferidos) e outras sugestões de fontes e perspectivas.
 */

import type { AnalysisResult } from "@/lib/analysis/types";
import { lookupOutlet } from "@/lib/veiculos";
import { useDict, useLang } from "@/lib/i18n";

/** limit = quantos textos mostrar (modo simples); compact = sem "Outras sugestões". */
export function Balance({ result, limit, compact }: { result: AnalysisResult; limit?: number; compact?: boolean }) {
  const t = useDict();
  const b = result.balance;
  if (!b || b.status === "disabled") return null;
  const isClaim = result.context.contentType === "claim";
  const tb = t.result.balance;

  return (
    <section aria-labelledby="balance-title" className="flex flex-col gap-5">
      <div>
        <h2 id="balance-title" className="text-2xl font-medium">
          {isClaim ? tb.titleClaim : tb.title}
        </h2>
        {b.status === "ok" && <p className="mt-1 max-w-[70ch] text-muted">{isClaim ? tb.introClaim : tb.intro}</p>}
      </div>

      {b.status === "demo" && <p className="max-w-[70ch] rounded-2xl bg-paper px-5 py-4 text-[15px] text-muted">{tb.demo}</p>}
      {b.status === "unavailable" && (
        <p className="max-w-[70ch] rounded-2xl bg-paper px-5 py-4 text-[15px] text-muted">{tb.unavailable}</p>
      )}

      {b.status === "ok" && b.data && (
        <>
          {b.data.articles.length === 0 ? (
            <p className="text-muted">{tb.none}</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {b.data.articles.slice(0, limit).map((a, i) => (
                <li key={a.url} className="flex flex-col gap-2 rounded-[16px] bg-paper p-5">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
                    <span>{a.outlet}</span>
                    {a.editorialLine && (
                      <span className="rounded-full border border-line px-2 py-0.5 text-xs">
                        {tb.line}: {t.labels.editorialLine[a.editorialLine]}
                        {b.lineSource?.[i] !== "table" && a.editorialLine !== "unknown" ? ` (${tb.estimated})` : ""}
                      </span>
                    )}
                    {b.lineSource?.[i] === "table" && <LineSource url={a.url} label={tb.lineSource} />}
                  </p>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-display text-[17px] leading-snug font-medium text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-teal"
                  >
                    {a.title}
                    <span className="sr-only"> {tb.opensNewTab}</span>
                  </a>
                  {a.perspective && (
                    <p>
                      <span className="inline-block rounded-full bg-teal-soft px-2.5 py-0.5 text-sm text-teal-deep">
                        <span className="sr-only">{tb.perspective}: </span>
                        {a.perspective}
                      </span>
                    </p>
                  )}
                  <p className="text-[15px] leading-relaxed">{a.why}</p>
                </li>
              ))}
            </ul>
          )}

          {b.data.articles.slice(0, limit).some((a, i) => b.lineSource?.[i] !== "table" && a.editorialLine && a.editorialLine !== "unknown") && (
            <p className="max-w-[70ch] text-sm text-muted">⚠️ {tb.estimatedNote}</p>
          )}

          {!compact && b.data.suggestions.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-medium">{tb.suggestionsTitle}</h3>
              {/* flex (e não grid): o Safari calculava errado a altura dos itens e sobrepunha o texto */}
              <ul className="flex flex-col gap-4">
                {b.data.suggestions.map((s) => (
                  <li key={s.title} className="flex flex-col gap-1 border-l-[3px] border-teal pl-4">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-[15px] leading-relaxed text-muted">{s.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Link "fonte" da classificação, quando o veículo está na lista lib/veiculos.ts. */
function LineSource({ url, label }: { url: string; label: string }) {
  const lang = useLang();
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  const info = lookupOutlet(host);
  if (!info) return null;
  // Mês da avaliação na fonte (ex.: "abr. de 2026"), para o leitor saber de quando é.
  const when = info.source.updated
    ? new Date(`${info.source.updated}-15T12:00:00Z`).toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", { month: "short", year: "numeric" })
    : "";
  const title = [info.source.label, info.source.note, when].filter(Boolean).join(" · ");
  return info.source.url ? (
    <a href={info.source.url} target="_blank" rel="noopener noreferrer nofollow" title={title} className="text-xs underline underline-offset-2">
      {label}: {info.source.label}
      {when ? `, ${when}` : ""}
    </a>
  ) : (
    <span className="text-xs" title={title}>
      {label}: {title}
    </span>
  );
}
