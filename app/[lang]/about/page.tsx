import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { ContentPage } from "@/components/ContentPage";
import { AboutEn, AboutPt } from "@/content/about";

const TEXT = {
  pt: { title: "Quem somos", lede: "Um projeto independente para ajudar qualquer pessoa a enxergar os vieses do que lê e ouve." },
  en: { title: "About us", lede: "An independent project to help anyone see the biases in what they read and hear." },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${TEXT[lang].title} · unslant`, description: TEXT[lang].lede };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <ContentPage title={TEXT[lang].title} lede={TEXT[lang].lede}>
      {lang === "en" ? <AboutEn /> : <AboutPt />}
    </ContentPage>
  );
}
