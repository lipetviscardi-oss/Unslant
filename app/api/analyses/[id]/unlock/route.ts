/**
 * "USAR MINHA ANÁLISE DETALHADA DO DIA" numa análise simples.
 *
 * Confere se a análise é da pessoa e se ainda resta a detalhada de hoje,
 * registra o uso e libera o resultado completo (que estava só no servidor).
 * Não chama a IA de novo: a análise completa já tinha sido feita.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";
import { errorMessage } from "@/lib/errors";
import { readCache } from "@/lib/analysis/cache";
import { loadAnalysis, unlockAnalysis } from "@/lib/analysis/store";
import { identifyViewer, recordUsage, refundUsage, remainingToday } from "@/lib/analysis/usage";

const Body = z.object({ tz: z.string().max(64).optional(), lang: z.enum(["pt", "en"]).default("pt") });

export async function POST(request: NextRequest, ctx: RouteContext<"/api/analyses/[id]/unlock">) {
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  const { tz, lang } = parsed.success ? parsed.data : { tz: undefined, lang: "pt" as const };
  const fail = (code: Parameters<typeof errorMessage>[0], status: number) =>
    Response.json({ code, message: errorMessage(code, lang) }, { status });

  const { id } = await ctx.params;
  const viewer = await identifyViewer(tz);
  if (!viewer.userId) return fail("LOGIN_REQUIRED", 401);
  const row = await loadAnalysis(id);
  if (!row || row.user_id !== viewer.userId) return fail("NOT_FOUND", 404);

  // Já liberada (ou já era detalhada): só devolve.
  if (row.kind === "detailed" || row.detailed_unlocked) {
    return Response.json({ result: row.result, remaining: await remainingToday(viewer) });
  }
  const remaining = await remainingToday(viewer);
  if (!remaining || remaining.detailed <= 0) return fail("LIMIT_DETAILED", 429);

  const full = row.cache_key ? await readCache(row.cache_key) : null;
  if (!full) return fail("NOT_FOUND", 404);

  const usageId = await recordUsage(viewer, "detailed", row.id);
  try {
    await unlockAnalysis(row.id, full);
  } catch (err) {
    await refundUsage(usageId);
    console.warn("[unslant] não foi possível liberar a análise:", err);
    return fail("UNKNOWN", 500);
  }
  return Response.json({ result: full, remaining: await remainingToday(viewer) });
}
