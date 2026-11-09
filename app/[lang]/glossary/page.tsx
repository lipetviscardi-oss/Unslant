/**
 * Página "Tipos de viés": gerada automaticamente a partir de lib/taxonomy.ts.
 * Ao editar a taxonomia, esta página se atualiza sozinha.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { TAXONOMY, type ContentKind } from "@/lib/taxonomy";
import { ContentPage } from "@/components/ContentPage";

const TEXT = {
  pt: {
    title: "Tipos de viés",
    lede: "Todas as categorias que o unslant analisa, organizadas em grupos, com uma explicação curta de cada uma.",
    appliesTo: "Analisado em:",
    kinds: { article: "notícias e artigos", paper: "papers acadêmicos", claim: "afirmações" } as Record<ContentKind, string>,
    contents: "Grupos",
    methodology: (
      <>
        Para entender como essas categorias viram uma nota de 0 a 10, veja a <Link href="/pt/methodology">Metodologia</Link>.
      </>
    ),
  },
  en: {
    title: "Types of bias",
    lede: "Every category unslant analyzes, organized in groups, with a short explanation of each.",
    appliesTo: "Analyzed in:",
    kinds: { article: "news and articles", paper: "academic papers", claim: "claims" } as Record<ContentKind, string>,
    contents: "Groups",
    methodology: (
      <>
        To see how these categories become a 0–10 score, read the <Link href="/en/methodology">Methodology</Link>.
      </>
    ),
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/glossary">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${TEXT[lang].title} · unslant`, description: TEXT[lang].lede };
}

export default async function GlossaryPage({ params }: PageProps<"/[lang]/glossary">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = TEXT[lang];
  const listFormat = new Intl.ListFormat(lang === "pt" ? "pt-BR" : "en", { type: "conjunction" });

  return (
    <ContentPage title={t.title} lede={t.lede}>
      <p>{t.methodology}</p>
      <nav aria-label={t.contents}>
        <ul>
          {TAXONOMY.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`}>{g.name[lang]}</a>
            </li>
          ))}
        </ul>
      </nav>
      {TAXONOMY.map((g) => (
        <section key={g.id} id={g.id} className="scroll-mt-6">
          <h2>{g.name[lang]}</h2>
          <p>{g.description[lang]}</p>
          <p className="note">
            {t.appliesTo} {listFormat.format(g.appliesTo.map((k) => t.kinds[k]))}
          </p>
          <dl className="mt-4 grid gap-4">
            {g.categories.map((c) => (
              <div key={c.id} className="rounded-xl bg-paper px-4 py-3">
                <dt className="font-display font-medium">{c.name[lang]}</dt>
                <dd className="mt-1 text-[16px] text-muted">{c.description[lang]}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </ContentPage>
  );
}
