"use client";

/**
 * Numa análise simples (com limites ligados): como ver a análise completa.
 *  - Com conta e detalhada disponível hoje: "Usar minha análise detalhada de hoje".
 *  - Com conta, mas a detalhada de hoje já foi usada: aviso de que volta amanhã.
 *  - Sem conta: convite para entrar.
 */

import Link from "next/link";
import type { ResultAccess } from "@/lib/analysis/types";
import { useDict, useLang } from "@/lib/i18n";

export function UnlockPanel({
  access,
  state,
  error,
  onUnlock,
}: {
  access: ResultAccess;
  state: "idle" | "working" | "error";
  error: string;
  onUnlock: () => void;
}) {
  const t = useDict();
  const lang = useLang();
  const tu = t.result.unlock;
  const left = access.remaining?.detailed ?? 0;
  return (
    <section id="unlock" aria-labelledby="unlock-title" className="flex flex-col items-start gap-3 rounded-[20px] border border-line bg-paper p-5 sm:p-6">
      <h2 id="unlock-title" className="text-xl font-medium">
        {t.result.simple.seeAll}
      </h2>
      <p className="max-w-[60ch] text-[15px] text-muted">{t.result.simple.seeAllHelp}</p>
      {!access.loggedIn ? (
        <>
          <Link href={`/${lang}/login`} className="rounded-full bg-ink px-5 py-2.5 font-display text-[16px] font-medium text-paper hover:bg-teal-deep">
            {tu.signIn}
          </Link>
          <p className="text-sm text-muted">{tu.signInWhy}</p>
        </>
      ) : left > 0 && access.analysisId ? (
        <>
          <button
            type="button"
            onClick={onUnlock}
            disabled={state === "working"}
            className="rounded-full bg-ink px-5 py-2.5 font-display text-[16px] font-medium text-paper hover:bg-teal-deep disabled:opacity-60"
          >
            {state === "working" ? tu.working : tu.use}
          </button>
          <p className="text-sm text-muted">{tu.useHelp(left)}</p>
        </>
      ) : (
        <p className="text-[15px]">{tu.usedUp}</p>
      )}
      {state === "error" && <p className="text-ember-ink">{error || t.home.unexpectedError}</p>}
    </section>
  );
}
