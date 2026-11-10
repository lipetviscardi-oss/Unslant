import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/server";
import { SavedAnalysis } from "@/components/SavedAnalysis";

export async function generateMetadata({ params }: PageProps<"/[lang]/analysis">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${getDict(lang).myAnalyses.title} · unslant`, robots: { index: false } };
}

export default async function SavedAnalysisPage({ params }: PageProps<"/[lang]/analysis">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <div className="px-4 py-8 sm:px-6">
      <SavedAnalysis />
    </div>
  );
}
