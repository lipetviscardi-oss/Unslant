"use client";

/**
 * Conta no topo do site: "Entrar" para quem não está logado; para quem está,
 * o e-mail com "Minhas análises" e "Sair". Some se o login não estiver configurado.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDict, useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function AccountMenu() {
  const t = useDict();
  const lang = useLang();
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined); // undefined = carregando
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user?.email ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  // Fecha o menu ao clicar fora.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  if (!supabase || email === undefined) return null;

  if (!email) {
    return (
      <Link href={`/${lang}/login`} className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper hover:bg-teal-deep">
        {t.nav.login}
      </Link>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="max-w-[12rem] truncate rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium hover:border-ink"
      >
        {t.nav.account}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 flex min-w-[14rem] flex-col rounded-xl border border-line bg-paper p-2 shadow-lg">
          <p className="truncate px-3 py-1.5 text-xs text-muted">{email}</p>
          <Link role="menuitem" href={`/${lang}/my-analyses`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-mist">
            {t.nav.myAnalyses}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setOpen(false);
              router.push(`/${lang}`);
              router.refresh();
            }}
            className="rounded-lg px-3 py-2 text-left text-sm hover:bg-mist"
          >
            {t.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}
