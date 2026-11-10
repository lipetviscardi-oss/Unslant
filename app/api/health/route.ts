/**
 * DIAGNÓSTICO: GET /api/health
 * Mostra se o servidor está de pé e qual versão do Node.js ele usa
 * (útil para conferir a publicação na Vercel). Não mostra nenhum segredo.
 * Com ?url=1, testa a leitura de uma página simples (example.com), sem IA.
 */

import { extractFromUrl } from "@/lib/extract/url";

export async function GET(request: Request) {
  let jsdom = "ok";
  try {
    await import("jsdom");
  } catch (err) {
    jsdom = describe(err);
  }
  let url: string | undefined;
  if (new URL(request.url).searchParams.get("url") === "1") {
    try {
      const page = await extractFromUrl("https://example.com");
      url = `ok (${page.text.length} caracteres)`;
    } catch (err) {
      url = describe(err);
    }
  }
  return Response.json({ ok: true, node: process.version, jsdom, url }, { headers: { "Cache-Control": "no-store" } });
}

function describe(err: unknown): string {
  if (!(err instanceof Error)) return "erro";
  const detail = (err as { detail?: string; code?: string }).detail ?? "";
  const cause = err.cause instanceof Error ? ` | causa: ${err.cause.message}` : "";
  return `${err.name}: ${err.message} ${detail}${cause}`.slice(0, 600);
}
