"use client";

/**
 * Formulário da página inicial: abas Link / Texto / PDF / Afirmação e
 * exemplos para testar. O relatório sai no idioma do site.
 */

import { useId, useRef, useState, useSyncExternalStore } from "react";
import type { AnalyzeRequest, DeclaredType } from "@/lib/client/analyze";
import type { PdfPageImage } from "@/lib/extract/pdf-client";
import { readMode, saveMode, subscribeMode, type ResultMode } from "@/lib/client/mode";
import { CLAIM_EXAMPLES, EXAMPLES } from "@/lib/examples";
import { AppError, errorMessage } from "@/lib/errors";
import { countWords } from "@/lib/text";
import { useDict, useLang } from "@/lib/i18n";

type Tab = "url" | "text" | "pdf" | "claim";
const TAB_IDS: Tab[] = ["url", "text", "pdf", "claim"];
const GENRES: DeclaredType[] = ["news", "feature", "analysis", "opinion", "editorial", "academic_paper", "press_release", "blog", "other"];

interface PdfState {
  status: "idle" | "reading" | "ready" | "error";
  fileName?: string;
  text?: string;
  title?: string;
  author?: string;
  error?: string;
  /** Páginas com figura/tabela, já como imagem (vão para a etapa "Imagens e gráficos"). */
  images?: PdfPageImage[];
}

const inputClass =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 placeholder:text-muted/60 focus:border-teal focus:outline-none";

export function AnalyzeForm({ onSubmit }: { onSubmit: (req: AnalyzeRequest) => void }) {
  const t = useDict();
  const lang = useLang();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [claim, setClaim] = useState("");
  const [claimContext, setClaimContext] = useState("");
  const [pdf, setPdf] = useState<PdfState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [genre, setGenre] = useState<DeclaredType | "">("");
  // Tipo de análise: a última escolha do leitor (no servidor, "simples").
  const storedMode = useSyncExternalStore(subscribeMode, readMode, () => "simple" as ResultMode);
  const [chosenMode, setChosenMode] = useState<ResultMode | null>(null);
  const view = chosenMode ?? storedMode;
  const send = (req: AnalyzeRequest) => {
    saveMode(view);
    onSubmit({ ...req, view });
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const words = countWords(text);
  const claimWords = countWords(claim);

  async function readPdf(file: File) {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setPdf({ status: "error", fileName: file.name, error: t.home.pdf.notPdf });
      return;
    }
    setPdf({ status: "reading", fileName: file.name });
    try {
      const { extractFromPdf } = await import("@/lib/extract/pdf-client");
      const out = await extractFromPdf(file);
      setPdf({ status: "ready", fileName: file.name, text: out.text, title: out.source.title, author: out.source.author, images: out.images });
    } catch (err) {
      const code = err instanceof AppError ? err.code : "PDF_INVALID";
      setPdf({ status: "error", fileName: file.name, error: errorMessage(code, lang) });
    }
  }

  const canSubmit =
    (tab === "url" && url.trim().length > 0) ||
    (tab === "text" && words > 0) ||
    (tab === "pdf" && pdf.status === "ready") ||
    (tab === "claim" && claimWords > 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const contentType = genre || undefined;
    if (tab === "url") send({ mode: "url", url: url.trim(), lang, contentType });
    else if (tab === "text") send({ mode: "text", text, lang, contentType });
    else if (tab === "claim") send({ mode: "claim", text: claim, meta: { context: claimContext.trim() || undefined }, lang });
    else if (pdf.text)
      send({
        mode: "pdf",
        text: pdf.text,
        meta: { title: pdf.title, author: pdf.author },
        images: pdf.images?.length ? pdf.images : undefined,
        lang,
        contentType,
      });
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
    const next = (index + (e.key === "ArrowRight" ? 1 : TAB_IDS.length - 1)) % TAB_IDS.length;
    setTab(TAB_IDS[next]);
    document.getElementById(`${baseId}-tab-${TAB_IDS[next]}`)?.focus();
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={submit} className="rounded-[20px] bg-paper p-5 shadow-[0_1px_0_var(--color-line)] sm:p-7">
        <div role="tablist" aria-label={t.home.tabsLabel} className="mb-5 flex max-w-full overflow-x-auto rounded-full bg-mist p-1 sm:inline-flex">
          {TAB_IDS.map((id, i) => (
            <button
              key={id}
              id={`${baseId}-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`${baseId}-panel`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`shrink-0 rounded-full px-4 py-2 font-display text-[15px] font-medium transition-colors sm:px-5 ${
                tab === id ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {t.home.tabs[id]}
            </button>
          ))}
        </div>

        <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`}>
          {tab === "url" && (
            <div className="grid gap-2">
              <label htmlFor={`${baseId}-url`} className="font-medium">
                {t.home.url.label}
              </label>
              <input
                id={`${baseId}-url`}
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`${inputClass} text-[17px]`}
              />
              <p className="text-sm text-muted">{t.home.url.help}</p>
            </div>
          )}

          {tab === "text" && (
            <div className="grid gap-2">
              <label htmlFor={`${baseId}-text`} className="font-medium">
                {t.home.text.label}
              </label>
              <textarea
                id={`${baseId}-text`}
                rows={10}
                placeholder={t.home.text.placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`${inputClass} resize-y text-[16px] leading-relaxed`}
              />
              <p className="text-sm text-muted" aria-live="polite">
                {words === 0 ? t.home.text.empty : t.home.text.count(words, 80)}
              </p>
            </div>
          )}

          {tab === "pdf" && (
            <div className="grid gap-2">
              <span className="font-medium" id={`${baseId}-pdf-label`}>
                {t.home.pdf.label}
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
                  {t.home.pdf.choose}
                </button>
                <p className="text-sm text-muted">{t.home.pdf.dropHelp}</p>
              </div>
              <div aria-live="polite" className="text-sm">
                {pdf.status === "reading" && <p className="text-muted">{t.home.pdf.reading(pdf.fileName ?? "")}</p>}
                {pdf.status === "ready" && (
                  <p>
                    <strong>{pdf.title || pdf.fileName}</strong>
                    <span className="text-muted"> {t.home.pdf.extracted(countWords(pdf.text ?? ""))}</span>
                    {pdf.images?.length ? <span className="block text-muted">{t.home.pdf.figures(pdf.images.length)}</span> : null}
                  </p>
                )}
                {pdf.status === "error" && <p className="text-ember-ink">{pdf.error}</p>}
              </div>
            </div>
          )}

          {tab === "claim" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor={`${baseId}-claim`} className="font-medium">
                  {t.home.claim.label}
                </label>
                <textarea
                  id={`${baseId}-claim`}
                  rows={3}
                  placeholder={t.home.claim.placeholder}
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  className={`${inputClass} resize-y text-[17px] leading-relaxed`}
                />
                <p className="text-sm text-muted" aria-live="polite">
                  {claimWords === 0 ? t.home.claim.help : t.home.claim.count(claimWords)}
                </p>
              </div>
              <div className="grid gap-2">
                <label htmlFor={`${baseId}-claim-ctx`} className="text-[15px] font-medium">
                  {t.home.claim.contextLabel}
                </label>
                <input
                  id={`${baseId}-claim-ctx`}
                  type="text"
                  maxLength={300}
                  placeholder={t.home.claim.contextPlaceholder}
                  value={claimContext}
                  onChange={(e) => setClaimContext(e.target.value)}
                  className={`${inputClass} text-[15px]`}
                />
              </div>
              <div className="grid gap-2">
                <p className="text-sm text-muted">{t.home.claim.examplesLabel}</p>
                <ul className="grid gap-2">
                  {CLAIM_EXAMPLES[lang].map((ex) => (
                    <li key={ex}>
                      <button
                        type="button"
                        onClick={() => setClaim(ex)}
                        className="w-full rounded-xl border border-line px-4 py-2 text-left text-[15px] hover:border-ink"
                      >
                        {ex}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {tab !== "claim" && (
          <div className="mt-5 grid gap-1.5">
            <label htmlFor={`${baseId}-genre`} className="text-[15px] font-medium">
              {t.home.genre.label}
            </label>
            <select
              id={`${baseId}-genre`}
              value={genre}
              onChange={(e) => setGenre(e.target.value as DeclaredType | "")}
              className="w-full max-w-sm rounded-xl border border-line bg-paper px-3 py-2.5 text-[15px] focus:border-teal focus:outline-none"
            >
              <option value="">{t.home.genre.auto}</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {t.labels.contentType[g]}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted">{t.home.genre.help}</p>
          </div>
        )}

        <fieldset className="mt-5 grid gap-2">
          <legend className="mb-1.5 text-[15px] font-medium">{t.home.view.label}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["simple", "detailed"] as const).map((m) => (
              <label
                key={m}
                className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 ${view === m ? "border-teal bg-teal-soft/50" : "border-line hover:border-teal"}`}
              >
                <input
                  type="radio"
                  name={`${baseId}-view`}
                  value={m}
                  checked={view === m}
                  onChange={() => setChosenMode(m)}
                  className="mt-1 accent-[var(--color-teal)]"
                />
                <span>
                  <span className="block font-medium">{t.home.view[m].title}</span>
                  <span className="block text-sm text-muted">{t.home.view[m].desc}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-sm text-muted">{t.home.view.help}</p>
        </fieldset>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[44ch] text-sm text-muted">{t.home.reportLanguage}</p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-teal px-7 py-3 font-display text-[16px] font-medium text-paper transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:bg-mist-deep disabled:text-muted"
          >
            {t.home.submit}
          </button>
        </div>
      </form>

      <section aria-labelledby={`${baseId}-examples`} className="grid gap-3">
        <h2 id={`${baseId}-examples`} className="text-lg font-medium">
          {t.home.examples.title}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            lang === "en"
              ? { id: "news-en", title: t.home.examples.demoTitle, desc: t.home.examples.demoDesc }
              : { id: "noticia-pt", title: t.home.examples.demoTitle, desc: t.home.examples.demoDesc },
            { id: "afirmacao-pt", title: t.home.examples.demoClaimTitle, desc: t.home.examples.demoClaimDesc },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => send({ mode: "demo", demoId: d.id, lang })}
              className="rounded-2xl border border-teal bg-teal-soft/60 px-5 py-4 text-left hover:bg-teal-soft"
            >
              <span className="block font-display font-medium text-teal-deep">{d.title}</span>
              <span className="text-sm text-muted">{d.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{t.home.examples.hint}</p>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                title={ex.description[lang]}
                onClick={() => loadExample(ex.id)}
                className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm hover:border-ink"
              >
                {ex.label[lang]}
              </button>
            </li>
          ))}
          <li>
            <a
              href="/exemplos/paper-exemplo.pdf"
              download
              className="inline-block rounded-full border border-line bg-paper px-4 py-1.5 text-sm hover:border-ink"
            >
              {t.home.examples.downloadPdf}
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
