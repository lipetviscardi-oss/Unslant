import type { Metadata } from "next";
import Link from "next/link";
// Fontes guardadas no próprio projeto (não dependem do Google Fonts)
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/400-italic.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "unslant: descubra os vieses de um texto",
  description:
    "Envie um link, texto ou PDF e veja os vieses do texto, com trechos do próprio texto como evidência.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="px-4 pt-5 pb-2 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" aria-label="unslant, página inicial" className="rounded-lg">
              <Logo />
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 pb-16 sm:px-6">{children}</main>
        <footer className="border-t border-line px-4 py-6 text-sm text-muted sm:px-6">
          <div className="mx-auto max-w-6xl">
            O unslant usa inteligência artificial, que também pode ter vieses e errar. Leia a análise como um ponto de
            partida para pensar, não como veredito.
          </div>
        </footer>
      </body>
    </html>
  );
}
