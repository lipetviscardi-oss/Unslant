import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { ContentPage } from "@/components/ContentPage";
import { PrivacyEn, PrivacyPt } from "@/content/privacy";

const TEXT = {
  pt: {
    title: "Privacidade",
    lede: "O que acontece com os textos, links, PDFs e afirmações que você envia ao unslant.",
  },
  en: {
    title: "Privacy",
    lede: "What happens to the texts, links, PDFs and claims you send to unslant.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${TEXT[lang].title} · unslant`, description: TEXT[lang].lede };
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <ContentPage title={TEXT[lang].title} lede={TEXT[lang].lede}>
      {lang === "en" ? <PrivacyEn /> : <PrivacyPt />}
    </ContentPage>
  );
}
