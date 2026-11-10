/**
 * Quantas análises restam hoje para quem está usando o site (mostrado no formulário).
 */

import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { identifyViewer, limitsFor, remainingToday } from "@/lib/analysis/usage";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin()) return Response.json({ limitsOn: false }, { headers: { "Cache-Control": "no-store" } });
  try {
    const viewer = await identifyViewer(request.nextUrl.searchParams.get("tz") ?? undefined);
    return Response.json(
      { limitsOn: true, loggedIn: Boolean(viewer.userId), limits: limitsFor(viewer), remaining: await remainingToday(viewer) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.warn("[unslant] uso diário indisponível:", err);
    return Response.json({ limitsOn: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
