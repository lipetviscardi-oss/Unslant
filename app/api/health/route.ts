/**
 * DIAGNÓSTICO: GET /api/health
 * Mostra se o servidor está de pé, qual versão do Node.js ele usa e se a
 * biblioteca de leitura de links (jsdom) carrega. Não mostra nenhum segredo.
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
