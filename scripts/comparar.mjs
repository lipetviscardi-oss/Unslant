/**
 * COMPARAR ANTES E DEPOIS
 *
 * Uso:  npm run comparar
 *
 * Lê as análises guardadas em .cache/analyses (no seu computador) e, para cada
 * texto analisado mais de uma vez, mostra a análise mais antiga ("antes") ao
 * lado da mais recente ("depois"): nota, inclinações, número de destaques,
 * custo e tempo.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), ".cache", "analyses");
let files = [];
try {
  files = readdirSync(dir).filter((f) => f.endsWith(".json"));
} catch {
  console.log("Nenhuma análise guardada encontrada em .cache/analyses.");
  console.log("Analise alguns textos com o site ligado (npm run dev) e rode este comando de novo.");
  process.exit(0);
}

const results = files
  .map((f) => {
    try {
      return JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    } catch {
      return null;
    }
  })
  .filter((r) => r && r.schemaVersion === 1 && !r.demo);

// Agrupa as análises do mesmo conteúdo (mesmo link ou mesmo começo de texto).
const groups = new Map();
for (const r of results) {
  const key = r.source?.url || r.text.slice(0, 300);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const pos = { left: "Esquerda", right: "Direita", unidentified: "Não identif.", not_applicable: "Não se aplica" };
function disputeText(d) {
  if (!d) return "(não existia)";
  const s = { slight: " (leve)", clear: " (clara)", strong: " (forte)" }[d.strength] ?? "";
  if (d.status === "favors_a") return `Favorece ${d.sideA}${s}`;
  if (d.status === "favors_b") return `Favorece ${d.sideB}${s}`;
  return { balanced: "Equilibrado", unidentified: "Não identif.", not_applicable: "Não se aplica" }[d.status] ?? d.status;
}

/** Destaques únicos (trechos sobrepostos contam como um só), total e moderados/fortes. */
function highlights(r) {
  const evs = r.groups
    .flatMap((g) => g.categories.flatMap((c) => c.evidence.map((e) => ({ s: e.start, e: e.end, score: c.score }))))
    .sort((a, b) => a.s - b.s);
  const clusters = [];
  for (const x of evs) {
    const last = clusters[clusters.length - 1];
    if (last && x.s < last.e) {
      last.e = Math.max(last.e, x.e);
      last.score = Math.max(last.score, x.score);
    } else clusters.push({ ...x });
  }
  return { total: clusters.length, strong: clusters.filter((c) => c.score >= 3.5).length, raw: evs.length };
}

function row(r) {
  const h = highlights(r);
  const na = r.groups.flatMap((g) => g.categories).filter((c) => c.status === "not_applicable").length;
  return {
    "Data": new Date(r.createdAt).toLocaleString("pt-BR"),
    "Nota geral": `${r.overall.score.toFixed(1)} (${r.overall.label})`,
    "Econômico": pos[r.political.economic.position] ?? r.political.economic.position,
    "Social": pos[r.political.social.position] ?? r.political.social.position,
    "Disputa": disputeText(r.political.dispute),
    "Destaques (únicos)": `${h.total} (${h.strong} moderados/fortes; ${h.raw} evidências)`,
    "Categorias 'não se aplica'": na,
    "Versão neutra": r.rewrite ? `"${r.rewrite.rewritten.slice(0, 70)}${r.rewrite.rewritten.length > 70 ? "…" : ""}"` : "—",
    "Textos p/ equilibrar": r.balance?.data ? r.balance.data.articles.length : "—",
    "Custo (US$)": r.stats.estimatedCostUsd.toFixed(3),
    "Tempo (s)": Math.round(r.stats.durationMs / 1000),
    "Modelo": r.stats.model,
  };
}

let compared = 0;
for (const [, list] of groups) {
  if (list.length < 2) continue;
  list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const before = list[0];
  const after = list[list.length - 1];
  compared++;
  const title = after.source?.title || after.context?.topic || after.text.slice(0, 60);
  console.log(`\n=== ${title} ===`);
  const a = row(before);
  const b = row(after);
  console.table(Object.keys(a).map((k) => ({ Item: k, Antes: a[k], Depois: b[k] })));
  for (const [label, r] of [["antes", before], ["depois", after]]) {
    if (!r.stats.stages) continue;
    console.log(`Custo por etapa (${label}):`);
    for (const [k, v] of Object.entries(r.stats.stages)) {
      const cache = v.cacheReadTokens || v.cacheWriteTokens ? `, cache lido ${v.cacheReadTokens} / gravado ${v.cacheWriteTokens} tokens` : "";
      const searches = v.webSearches ? `, ${v.webSearches} busca(s)` : "";
      console.log(`  - ${k}: US$ ${v.costUsd.toFixed(4)} (${v.calls} chamada(s), ${v.model}${cache}${searches})`);
    }
  }
  const d = after.balance?.diagnostics;
  if (d) {
    console.log("Busca para equilibrar (depois):");
    console.log(`  - rodadas: ${d.rounds}; resultados encontrados: ${d.resultsFound}; links sugeridos: ${d.proposed}; descartados: ${d.discarded.length}; modelo(s): ${d.models.join(", ") || "—"}`);
    if (d.queries.length) console.log(`  - termos buscados: ${d.queries.map((q) => `"${q}"`).join("; ")}`);
    for (const x of d.discarded) console.log(`  - descartado (${x.reason}): ${x.url}`);
    for (const n of d.notes) console.log(`  - obs.: ${n}`);
  }
}

if (compared === 0) {
  console.log("Ainda não há textos analisados duas vezes (antes e depois das mudanças).");
  console.log(`Análises guardadas: ${results.length}. Analise de novo os mesmos textos e rode este comando outra vez.`);
} else {
  console.log(`\n${compared} texto(s) comparado(s).`);
}
