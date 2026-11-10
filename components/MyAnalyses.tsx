"use client";

/**
 * "MINHAS ANÁLISES": lista as análises da pessoa logada, com abrir e apagar.
 * As regras do banco garantem que cada pessoa só vê (e só apaga) as próprias.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDict, useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { formatScore, severity, SEVERITY_SOFT, SEVERITY_TEXT } from "@/lib/client/format";
import { scoreLabel } from "@/lib/taxonomy";

interface Row {
  id: string;
  created_at: string;
  title: string | null;
  source_url: string | null;
  score: number | null;
  kind: "simple" | "detailed";
  detailed_unlocked: boolean;
  status: "running" | "done" | "error";
}

export function MyAnalyses() {
  const t = useDict();
  const lang = useLang();
  const tm = t.myAnalyses;
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      setLoggedIn(Boolean(data.user));
      if (!data.user) return;
      const { data: list, error } = await supabase
        .from("analyses")
        .select("id, created_at, title, source_url, score, kind, detailed_unlocked, status")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) setFailed(true);
      else setRows(list as Row[]);
    });
  }, [supabase]);

  async function remove(id: string) {
    if (!supabase || !window.confirm(tm.confirmDelete)) return;
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) window.alert(tm.deleteError);
    else setRows((r) => r?.filter((x) => x.id !== id) ?? null);
  }

  if (!supabase) return <p className="text-muted">{t.login.unavailable}</p>;
  if (loggedIn === false) {
    return (
      <p>
        {tm.needLogin}{" "}
        <Link href={`/${lang}/login`} className="text-teal-deep underline underline-offset-4">
          {t.nav.login}
        </Link>
      </p>
    );
  }
  if (failed) return <p className="text-ember-ink">{tm.loadError}</p>;
  if (!rows) return <p className="text-muted">{tm.loading}</p>;
  if (rows.length === 0) return <p className="text-muted">{tm.empty}</p>;

  const date = (iso: string) =>
    new Date(iso).toLocaleString(lang === "pt" ? "pt-BR" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{tm.deleteNote}</p>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const sev = r.score != null ? severity(r.score) : null;
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] bg-paper p-4">
              {r.score != null && sev && (
                <span className={`rounded-full px-2.5 py-0.5 font-display tabular-nums ${SEVERITY_SOFT[sev]} ${SEVERITY_TEXT[sev]}`} title={scoreLabel(r.score)[lang]}>
                  {formatScore(r.score, lang)}
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{r.title || r.source_url || tm.untitled}</span>
                <span className="text-sm text-muted">
                  {date(r.created_at)} · {r.kind === "detailed" || r.detailed_unlocked ? tm.detailed : tm.simple}
                  {r.status === "running" ? ` · ${tm.running}` : r.status === "error" ? ` · ${tm.failed}` : ""}
                </span>
              </div>
              <div className="flex gap-2">
                {r.status === "done" && (
                  <Link href={`/${lang}/analysis?id=${r.id}`} className="rounded-full border border-ink px-3 py-1 text-sm font-medium hover:bg-ink hover:text-paper">
                    {tm.open}
                  </Link>
                )}
                <button type="button" onClick={() => remove(r.id)} className="rounded-full px-3 py-1 text-sm text-muted hover:text-ember-ink">
                  {tm.delete}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
