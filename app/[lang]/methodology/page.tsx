import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { ContentPage } from "@/components/ContentPage";
import { MethodologyEn, MethodologyPt } from "@/content/methodology";

const TEXT = {
  pt: {
    title: "Metodologia",
    lede: "Como o unslant analisa um texto, como a nota é calculada, como buscamos imparcialidade e quais são os limites da ferramenta.",
  },
  en: {
    title: "Methodology",
    lede: "How unslant analyzes a text, how the score is calculated, how we pursue impartiality and where the tool falls short.",
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/methodology">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${TEXT[lang].title} · unslant`, description: TEXT[lang].lede };
}

export default async function MethodologyPage({ params }: PageProps<"/[lang]/methodology">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <ContentPage title={TEXT[lang].title} lede={TEXT[lang].lede}>
      {lang === "en" ? <MethodologyEn /> : <MethodologyPt />}
    </ContentPage>
  );
}
