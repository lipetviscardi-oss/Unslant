import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/server";
import { ContentPage } from "@/components/ContentPage";
import { MyAnalyses } from "@/components/MyAnalyses";

export async function generateMetadata({ params }: PageProps<"/[lang]/my-analyses">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${getDict(lang).myAnalyses.title} · unslant`, robots: { index: false } };
}

export default async function MyAnalysesPage({ params }: PageProps<"/[lang]/my-analyses">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  return (
    <ContentPage title={t.myAnalyses.title} lede={t.myAnalyses.lede}>
      <MyAnalyses />
    </ContentPage>
  );
}
