/**
 * DIAGNÓSTICO: GET /api/health
 * Mostra se o servidor está de pé e qual versão do Node.js ele usa
 * (útil para conferir a publicação na Vercel). Não mostra nenhum segredo.
 */

export async function GET() {
  let jsdom = "ok";
  try {
    await import("jsdom");
  } catch (err) {
    jsdom = err instanceof Error ? `${err.name}: ${err.message.slice(0, 300)}` : "erro";
  }
  return Response.json({ ok: true, node: process.version, jsdom }, { headers: { "Cache-Control": "no-store" } });
}
