/**
 * PROCURA CONTRADIÇÕES NAS ANÁLISES JÁ FEITAS (sem usar a IA)
 *
 * Uso:  npm run checar-contradicoes
 *       npm run checar-contradicoes -- arquivo.json   (um resultado específico)
 *
 * Lê as análises guardadas no seu computador (.cache/analyses, criadas pelo
 * npm run dev e pelo npm run teste) e confere:
 *  a) resumo × tipo de texto e rótulo de opinião;
 *  b) versão neutra repetindo como fato um número marcado "sem fonte";
 *  c) resumo × lado e intensidade da disputa;
 *  d) resumo × notas ("sem viés" ou "viés leve" com notas altas).
 * As análises novas já corrigem isso sozinhas antes de mostrar o resultado;
 * este comando serve para conferir as antigas e para pegar se o erro voltar.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { findContradictions } = await import(path.join(root, "lib", "analysis", "contradictions.ts"));
const { rewriteProblem } = await import(path.join(root, "lib", "analysis", "assemble.ts"));
const { getCategory } = await import(path.join(root, "lib", "taxonomy.ts"));

const args = process.argv.slice(2);
const dir = path.join(root, ".cache", "analyses");
const files = args.length ? args : existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f)) : [];
if (!files.length) {
  console.log("Nenhuma análise guardada em .cache/analyses. Rode algumas análises com npm run dev (ou npm run teste) e tente de novo.");
  process.exit(0);
}

let total = 0;
let withProblems = 0;
for (const file of files) {
  const r = JSON.parse(readFileSync(file, "utf8"));
  if (!r?.groups || r.demo) continue;
  total++;
  const found = r.groups.flatMap((g) => g.categories.filter((c) => c.status === "found"));
  const problems = findContradictions({
    summary: r.summary ?? "",
    summarySimple: r.summarySimple ?? "",
    contentType: r.context.contentType,
    contentTypeReason: r.context.contentTypeReason,
    dispute: r.political?.dispute,
    overallScore: r.overall.score,
    categories: found.map((c) => ({ name: getCategory(c.id)?.category.name.pt ?? c.id, score: c.score })),
  }).map((c) => `${c.note}\n      frase: «${c.sentence}»`);
  if (r.rewrite) {
    const rw = rewriteProblem({ groups: r.groups }, { summary: r.summary, summarySimple: r.summarySimple, rewrite: { evidenceId: r.rewrite.evidenceId, rewritten: r.rewrite.rewritten, explanation: r.rewrite.explanation } }, r.text);
    if (rw && /sem fonte/.test(rw)) problems.push(`versão neutra: ${rw}`);
  }
  const fixed = r.stats?.contradictions;
  const title = r.source?.title || r.source?.url || path.basename(file);
  console.log(`${problems.length ? "❌" : "✅"} ${title.slice(0, 90)} (${new Date(r.createdAt).toLocaleDateString("pt-BR")})`);
  if (fixed) console.log(`   corrigidas na hora da análise: ${fixed.fixed} de ${fixed.found}${fixed.removedSentences ? ` (${fixed.removedSentences} frase(s) retirada(s))` : ""}`);
  for (const p of problems) console.log(`   - ${p}`);
  if (problems.length) withProblems++;
}
console.log(`\nResumo: ${total} análises conferidas, ${withProblems} com contradição.`);
if (withProblems) process.exitCode = 1;
