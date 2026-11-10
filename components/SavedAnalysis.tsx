"use client";

/**
 * Abre uma análise de "Minhas análises" (sem chamar a IA de novo).
 * O id vem do endereço (?id=…), lido no navegador.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { AnalysisResult, ResultAccess } from "@/lib/analysis/types";
import { browserTimeZone } from "@/lib/client/analyze";
import { useDict, useLang } from "@/lib/i18n";
import { ResultView } from "@/components/result/ResultView";

const noSubscribe = () => () => {};

export function SavedAnalysis() {
  const t = useDict();
  const lang = useLang();
  const router = useRouter();
  const id = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get("id") ?? "", () => "");
  const [data, setData] = useState<{ result: AnalysisResult; access: ResultAccess } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const tz = browserTimeZone();
    fetch(`/api/analyses/${encodeURIComponent(id)}?lang=${lang}${tz ? `&tz=${encodeURIComponent(tz)}` : ""}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) setError(body?.message ?? t.home.unexpectedError);
        else setData(body);
      })
      .catch(() => setError(t.home.unexpectedError));
  }, [id, lang, t.home.unexpectedError]);

  if (error) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <p className="text-ember-ink">{error}</p>
        <Link href={`/${lang}/my-analyses`} className="text-teal-deep underline underline-offset-4">
          {t.nav.myAnalyses}
        </Link>
      </div>
    );
  }
  if (!data) return <p className="text-center text-muted">{t.myAnalyses.loading}</p>;
  return (
    <ResultView
      result={data.result}
      access={data.access}
      initialMode={data.access.unlocked ? "detailed" : "simple"}
      onReset={() => router.push(`/${lang}`)}
    />
  );
}
