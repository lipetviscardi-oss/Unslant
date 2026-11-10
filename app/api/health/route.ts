/**
 * DIAGNÓSTICO: GET /api/health
 * Mostra se o servidor está de pé, qual versão do Node.js ele usa e se a
 * biblioteca de leitura de links (jsdom) carrega. Não mostra nenhum segredo.
 * Com ?ai=1, confere a chave da IA: formato (sem mostrar a chave) e se a
 * Anthropic a aceita (lista de modelos, que não tem custo).
 */

export async function GET(request: Request) {
  let jsdom = "ok";
  try {
    await import("jsdom");
  } catch (err) {
    jsdom = err instanceof Error ? `${err.name}: ${err.message.slice(0, 300)}` : "erro";
  }
  let ai: Record<string, unknown> | undefined;
  if (new URL(request.url).searchParams.get("ai") === "1") {
    const raw = process.env.ANTHROPIC_API_KEY ?? "";
    const key = raw.trim();
    ai = {
      present: raw.length > 0,
      length: raw.length,
      startsWithSkAnt: key.startsWith("sk-ant-"),
      hasSpacesOrNewlines: raw !== key || /\s/.test(key),
      hasQuotes: /["']/.test(raw),
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
        headers: { "x-api-key": raw, "anthropic-version": "2023-06-01" },
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as { error?: { type?: string; message?: string } } | null;
      ai.status = res.status;
      if (body?.error) ai.error = `${body.error.type}: ${(body.error.message ?? "").slice(0, 200)}`;
    } catch (err) {
      ai.status = "sem conexão";
      ai.error = err instanceof Error ? err.message.slice(0, 200) : "erro";
    }
  }
  return Response.json({ ok: true, node: process.version, jsdom, ai }, { headers: { "Cache-Control": "no-store" } });
}
