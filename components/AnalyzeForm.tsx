"use client";

/**
 * Formulário da página inicial: abas Link / Texto / PDF, idioma do
 * relatório e exemplos para testar.
 */

import { useId, useRef, useState } from "react";
import type { AnalyzeRequest } from "@/lib/client/analyze";
import { EXAMPLES } from "@/lib/examples";
import { AppError, errorMessage } from "@/lib/errors";
import { countWords } from "@/lib/text";
import type { Lang } from "@/lib/taxonomy";

type Tab = "url" | "text" | "pdf";

const TABS: { id: Tab; label: string }[] = [
  { id: "url", label: "Link" },
  { id: "text", label: "Texto" },
  { id: "pdf", label: "PDF" },
];

interface PdfState {
  status: "idle" | "reading" | "ready" | "error";
  fileName?: string;
  text?: string;
  title?: string;
  author?: string;
  error?: string;
}

export function AnalyzeForm({ onSubmit }: { onSubmit: (req: AnalyzeRequest) => void }) {
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [pdf, setPdf] = useState<PdfState>({ status: "idle" });
  const [lang, setLang] = useState<Lang>("pt");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const words = countWords(text);

  async function readPdf(file: File) {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setPdf({ status: "error", fileName: file.name, error: "Esse arquivo não é um PDF." });
      return;
    }
    setPdf({ status: "reading", fileName: file.name });
    try {
      const { extractFromPdf } = await import("@/lib/extract/pdf-client");
      const out = await extractFromPdf(file);
      setPdf({
        status: "ready",
        fileName: file.name,
        text: out.text,
        title: out.source.title,
        author: out.source.author,
      });
    } catch (err) {
      const code = err instanceof AppError ? err.code : "PDF_INVALID";
      setPdf({ status: "error", fileName: file.name, error: errorMessage(code, "pt") });
    }
  }

  const canSubmit =
    (tab === "url" && url.trim().length > 0) ||
    (tab === "text" && words > 0) ||
    (tab === "pdf" && pdf.status === "ready");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (tab === "url") onSubmit({ mode: "url", url: url.trim(), lang });
    else if (tab === "text") onSubmit({ mode: "text", text, lang });
    else if (pdf.text) onSubmit({ mode: "pdf", text: pdf.text, meta: { title: pdf.title, author: pdf.author }, lang });
  }

  function loadExample(id: string) {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (!ex) return;
    setText(ex.text);
    setTab("text");
  }

  function onTabKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next].id);
    document.getElementById(`${baseId}-tab-${TABS[next].id}`)?.focus();
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={submit} className="rounded-[20px] bg-paper p-5 shadow-[0_1px_0_var(--color-line)] sm:p-7">
        <div role="tablist" aria-label="Tipo de conteúdo" className="mb-5 inline-flex rounded-full bg-mist p-1">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`${baseId}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`${baseId}-panel`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`rounded-full px-5 py-2 font-display text-[15px] font-medium transition-colors ${
                tab === t.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`}>
          {tab === "url" && (
            <div className="grid gap-2">
              <label htmlFor={`${baseId}-url`} className="font-medium">
                Link da matéria ou artigo
              </label>
              <input
                id={`${baseId}-url`}
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[17px] placeholder:text-muted/60 focus:border-teal focus:outline-none"
              />
              <p className="text-sm text-muted">
                Alguns sites bloqueiam leitura automática ou têm paywall. Nesses casos, copie o texto e use a aba Texto.
              </p>
            </div>
          )}

          {tab === "text" && (
            <div className="grid gap-2">
              <label htmlFor={`${baseId}-text`} className="font-medium">
                Texto para analisar
              </label>
              <textarea
                id={`${baseId}-text`}
                rows={10}
                placeholder="Cole aqui o texto completo, de preferência com o título na primeira linha."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full resize-y rounded-xl border border-line bg-paper px-4 py-3 text-[16px] leading-relaxed placeholder:text-muted/60 focus:border-teal focus:outline-none"
              />
              <p className="text-sm text-muted" aria-live="polite">
                {words === 0
                  ? "Mínimo de 80 palavras."
                  : `${words.toLocaleString("pt-BR")} ${words === 1 ? "palavra" : "palavras"}${words < 80 ? " (mínimo de 80)" : ""}`}
              </p>
            </div>
          )}

          {tab === "pdf" && (
            <div className="grid gap-2">
              <span className="font-medium" id={`${baseId}-pdf-label`}>
                Arquivo PDF (artigos e papers)
              </span>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void readPdf(f);
                }}
                className={`grid place-items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  dragging ? "border-teal bg-teal-soft/50" : "border-line"
                }`}
              >
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  aria-labelledby={`${baseId}-pdf-label`}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void readPdf(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-full border border-ink px-5 py-2 font-display text-[15px] font-medium hover:bg-ink hover:text-paper"
                >
                  Escolher arquivo
                </button>
                <p className="text-sm text-muted">ou arraste o PDF para cá. O arquivo é lido no seu navegador.</p>
              </div>
              <div aria-live="polite" className="text-sm">
                {pdf.status === "reading" && <p className="text-muted">Lendo {pdf.fileName}…</p>}
                {pdf.status === "ready" && (
                  <p>
                    <strong>{pdf.title || pdf.fileName}</strong>
                    <span className="text-muted">
                      {" "}
                      ({countWords(pdf.text ?? "").toLocaleString("pt-BR")} palavras extraídas)
                    </span>
                  </p>
                )}
                {pdf.status === "error" && <p className="text-ember-ink">{pdf.error}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <fieldset className="flex items-center gap-3">
            <legend className="sr-only">Idioma do relatório</legend>
            <span className="text-sm text-muted">Relatório em</span>
            {(["pt", "en"] as const).map((l) => (
              <label
                key={l}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal ${
                  lang === l ? "bg-teal-soft text-teal-deep" : "text-muted hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name={`${baseId}-lang`}
                  value={l}
                  checked={lang === l}
                  onChange={() => setLang(l)}
                  className="sr-only"
                />
                {l === "pt" ? "Português" : "English"}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-teal px-7 py-3 font-display text-[16px] font-medium text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:bg-mist-deep disabled:text-muted"
          >
            Analisar texto
          </button>
        </div>
      </form>

      <section aria-labelledby={`${baseId}-examples`} className="grid gap-3">
        <h2 id={`${baseId}-examples`} className="text-lg font-medium">
          Sem um texto em mãos?
        </h2>
        <button
          type="button"
          onClick={() => onSubmit({ mode: "demo", demoId: "noticia-pt", lang: "pt" })}
          className="flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border border-teal bg-teal-soft/60 px-5 py-4 text-left hover:bg-teal-soft"
        >
          <span>
            <span className="block font-display font-medium text-teal-deep">Ver uma análise pronta</span>
            <span className="text-sm text-muted">Notícia fictícia sobre corte na saúde. Grátis, sem usar a IA.</span>
          </span>
        </button>
        <p className="text-sm text-muted">
          Ou carregue um texto de exemplo (fictício) na aba Texto. Analisar esses textos usa a IA normalmente.
        </p>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                title={ex.description}
                onClick={() => loadExample(ex.id)}
                className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm hover:border-ink"
              >
                {ex.label}
              </button>
            </li>
          ))}
          <li>
            <a
              href="/exemplos/paper-exemplo.pdf"
              download
              className="inline-block rounded-full border border-line bg-paper px-4 py-1.5 text-sm hover:border-ink"
            >
              Baixar o paper em PDF
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
