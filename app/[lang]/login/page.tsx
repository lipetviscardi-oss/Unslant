import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n/config";
import { getDict } from "@/lib/i18n/server";
import { ContentPage } from "@/components/ContentPage";
import { LoginForm } from "@/components/LoginForm";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${getDict(lang).login.title} · unslant`, robots: { index: false } };
}

export default async function LoginPage({ params }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  return (
    <ContentPage title={t.login.title} lede={t.login.lede}>
      <LoginForm />
    </ContentPage>
  );
}
