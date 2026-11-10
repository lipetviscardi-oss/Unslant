/**
 * Abre uma análise salva em "Minhas análises" (só a própria pessoa).
 */

import type { NextRequest } from "next/server";
import { errorMessage } from "@/lib/errors";
import { currentUser } from "@/lib/supabase/server";
import { loadAnalysis } from "@/lib/analysis/store";
import { identifyViewer, remainingToday } from "@/lib/analysis/usage";
import type { ResultAccess } from "@/lib/analysis/types";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/analyses/[id]">) {
  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "pt";
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return Response.json({ code: "LOGIN_REQUIRED", message: errorMessage("LOGIN_REQUIRED", lang) }, { status: 401 });
  const row = await loadAnalysis(id);
  // Análise de outra pessoa responde igual a "não existe" (não revela que existe).
  if (!row || row.user_id !== user.id || !row.result) {
    return Response.json({ code: "NOT_FOUND", message: errorMessage("NOT_FOUND", lang) }, { status: 404 });
  }
  const viewer = await identifyViewer(request.nextUrl.searchParams.get("tz") ?? undefined);
  const access: ResultAccess = {
    limitsOn: true,
    loggedIn: true,
    analysisId: row.id,
    kind: row.kind,
    unlocked: row.kind === "detailed" || row.detailed_unlocked,
    remaining: await remainingToday(viewer),
  };
  return Response.json({ result: row.result, access }, { headers: { "Cache-Control": "no-store" } });
}
