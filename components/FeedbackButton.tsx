"use client";

/**
 * Botão "Enviar sugestão" (fase de testes): fica no canto da tela, em todas
 * as páginas. Abre uma janela com um campo de texto; a sugestão vai para o
 * banco (tabela feedback). Só aparece com o Supabase configurado.
 */

import { useRef, useState } from "react";
import { useDict, useLang } from "@/lib/i18n";
import { supabaseConfigured } from "@/lib/supabase/config";

type State = "idle" | "sending" | "sent" | "error" | "rateLimited";

export function FeedbackButton() {
  const t = useDict().feedback;
  const lang = useLang();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<State>("idle");

  if (!supabaseConfigured()) return null;

  function open() {
    if (state === "sent") {
      setState("idle");
      setMessage("");
    }
    dialogRef.current?.showModal();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 3) return;
    setState("sending");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, contact: contact || undefined, page: window.location.pathname + window.location.search, lang }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : res?.status === 429 ? "rateLimited" : "error");
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="fixed right-4 bottom-4 z-40 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper shadow-lg hover:bg-teal-deep focus-visible:outline-2 focus-visible:outline-offset-2 print:hidden"
      >
        {t.button}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="feedback-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[20px] bg-paper p-6 text-ink backdrop:bg-ink/40"
      >
        <h2 id="feedback-title" className="mb-1 text-xl font-medium">
          {t.title}
        </h2>
        {state === "sent" ? (
          <p role="status" className="mt-4">
            {t.thanks}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-2 grid gap-4">
            <p className="text-sm text-muted">{t.lede}</p>
            <label className="grid gap-1">
              <span className="text-sm font-medium">{t.message}</span>
              <textarea
                required
                minLength={3}
                maxLength={3000}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">{t.contact}</span>
              <input
                type="text"
                maxLength={200}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                autoComplete="email"
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
              <span className="text-sm text-muted">{t.contactHelp}</span>
            </label>
            {(state === "error" || state === "rateLimited") && (
              <p role="alert" className="text-sm text-ember-ink">
                {state === "error" ? t.error : t.rateLimited}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-full px-4 py-2 text-sm text-muted hover:text-ink">
                {t.close}
              </button>
              <button
                type="submit"
                disabled={state === "sending"}
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-teal-deep disabled:opacity-50"
              >
                {state === "sending" ? t.sending : t.send}
              </button>
            </div>
          </form>
        )}
        {state === "sent" && (
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper">
              {t.close}
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
