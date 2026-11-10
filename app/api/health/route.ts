/**
 * DIAGNÓSTICO: GET /api/health
 * Mostra se o servidor está de pé, qual versão do Node.js ele usa e se a
 * biblioteca de leitura de links (jsdom) carrega. Com ?ai=1, diz só se a
 * chave da IA é aceita pela Anthropic ("accepted", "rejected", "missing" ou
 * "unreachable"), sem nenhum detalhe da chave. O resultado fica guardado por
 * 1 minuto, para a rota não poder ser usada para gastar o limite da chave.
 */

let aiCheck: { at: number; status: string } | null = null;

async function checkAi(): Promise<string> {
  if (aiCheck && Date.now() - aiCheck.at < 60_000) return aiCheck.status;
  const key = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  let status: string;
  if (!/^sk-ant-[A-Za-z0-9_-]+$/.test(key)) status = key ? "rejected" : "missing";
  else {
    try {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
        cache: "no-store",
      });
      status = res.ok ? "accepted" : res.status === 401 || res.status === 403 ? "rejected" : `http_${res.status}`;
    } catch {
      status = "unreachable";
    }
  }
  aiCheck = { at: Date.now(), status };
  return status;
}

export async function GET(request: Request) {
  let jsdom = "ok";
  try {
    await import("jsdom");
  } catch {
    jsdom = "failed";
  }
  const ai = new URL(request.url).searchParams.get("ai") === "1" ? await checkAi() : undefined;
  return Response.json({ ok: true, node: process.version, jsdom, ai }, { headers: { "Cache-Control": "no-store" } });
}
