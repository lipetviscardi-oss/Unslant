import type { Metadata } from "next";
import { notFound } from "next/navigation";
// Fontes guardadas no próprio projeto (não dependem do Google Fonts)
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/400-italic.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "../globals.css";
import { HTML_LANG, LOCALES, hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/server";
import { LangProvider } from "@/lib/i18n";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FeedbackButton } from "@/components/FeedbackButton";

/** Gera as páginas nos dois idiomas: /pt e /en. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { languages: { "pt-BR": "/pt", en: "/en" } },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={HTML_LANG[lang]} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <LangProvider lang={lang}>
          <SiteHeader />
          <main className="flex-1 px-4 pb-16 sm:px-6">{children}</main>
          <SiteFooter />
          <FeedbackButton />
        </LangProvider>
      </body>
    </html>
  );
}
