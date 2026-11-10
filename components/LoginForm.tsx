"use client";

/**
 * Formulário de login sem senha: a pessoa digita o e-mail e recebe um link.
 */

import { useId, useState, useSyncExternalStore } from "react";
import { useDict, useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/browser";

const noSubscribe = () => () => {};

export function LoginForm() {
  // "?erro=link" no endereço = o link do e-mail era inválido ou expirou (lido no navegador).
  const linkError = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get("erro") === "link", () => false);
  const t = useDict();
  const lang = useLang();
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const supabase = supabaseBrowser();

  if (!supabase) return <p className="text-muted">{t.login.unavailable}</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/${lang}` },
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return <p className="rounded-[16px] bg-teal-soft px-5 py-4 text-[16px] text-teal-deep">{t.login.sent(email.trim())}</p>;
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-3">
      {linkError && <p className="rounded-xl bg-ember-soft px-4 py-3 text-ember-ink">{t.login.linkError}</p>}
      <label htmlFor={id} className="text-[15px] font-medium">
        {t.login.email}
      </label>
      <input
        id={id}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-line bg-paper px-4 py-3 focus:border-teal focus:outline-none"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="self-start rounded-full bg-teal px-6 py-2.5 font-display font-medium text-paper hover:bg-teal-deep disabled:opacity-60"
      >
        {state === "sending" ? t.login.sending : t.login.submit}
      </button>
      {state === "error" && <p className="text-ember-ink">{t.login.error}</p>}
      <p className="text-sm text-muted">{t.login.why}</p>
    </form>
  );
}
