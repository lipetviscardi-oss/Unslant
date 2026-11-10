/**
 * CONFERE A LISTA DE VEÍCULOS (lib/veiculos.ts) COM AS FONTES
 *
 * Uso:  npm run conferir-veiculos
 *
 * Abre a página de cada fonte (Media Bias/Fact Check, Wikipédia, site do
 * veículo) e confere se a classificação da lista bate com o que a página diz
 * hoje. No fim, grava a tabela em docs/veiculos-conferidos.md.
 * Não usa a IA (custo zero). Leva alguns minutos: as páginas são abertas
 * devagar, para o site da fonte não bloquear por excesso de acessos.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { OUTLETS } = await import(path.join(root, "lib", "veiculos.ts"));

const LINE2MBFC = { left: "LEFT", center_left: "LEFT-CENTER", center: "LEAST BIASED", center_right: "RIGHT-CENTER", right: "RIGHT" };
const LINE_PT = {
  left: "esquerda",
  center_left: "centro-esquerda",
  center: "centro",
  center_right: "centro-direita",
  right: "direita",
  institutional: "oficial",
  legal: "jurídico",
  fact_check: "checagem",
  academic: "acadêmico",
  wire: "agência de notícias",
  international: "internacional",
  specialized: "especializado",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pageText(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(2000 * attempt);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (unslant: conferência de fontes)" }, redirect: "follow" });
      if (res.status === 429) continue; // muitos acessos: espera mais e tenta de novo
      if (!res.ok) return { error: `a página não abriu (${res.status})` };
      const html = await res.text();
      const text = html
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#8217;|&rsquo;/g, "'")
        .replace(/\s+/g, " ")
        .replace(/\s+([.,;:])/g, "$1");
      return { text };
    } catch (err) {
      if (attempt === 3) return { error: `a página não abriu (${err.message})` };
    }
  }
  return { error: "a página não abriu (muitos acessos)" };
}

async function check(domain, o) {
  const src = o.source;
  if (src.label === "Media Bias/Fact Check") {
    const p = await pageText(src.url);
    if (p.error) return { ok: null, detail: p.error };
    const rating = (p.text.match(/Bias Rating:\s*([A-Z][A-Z -]+?)\s*(?:\(|Factual)/)?.[1] ?? "?").replace(/\s*-\s*/g, "-").trim();
    const updated = p.text.match(/Last Updated on ([A-Z][a-z]+ \d{1,2}, \d{4})/)?.[1] ?? "?";
    const noted = src.note?.match(/(?:Avaliação:|viés como)\s*([A-Z][A-Z -]+[A-Z])/)?.[1]?.trim();
    const problems = [];
    if (noted && rating !== noted) problems.push(`a nota diz ${noted}, a página diz ${rating}`);
    if (LINE2MBFC[o.line] && rating !== LINE2MBFC[o.line]) problems.push(`a linha "${LINE_PT[o.line]}" pede ${LINE2MBFC[o.line]}, a página diz ${rating}`);
    return { ok: problems.length === 0, detail: `${rating} (atualizado em ${updated})${problems.length ? " — " + problems.join("; ") : ""}` };
  }
  if (src.label === "Wikipédia") {
    const p = await pageText(src.url);
    if (p.error) return { ok: null, detail: p.error };
    const quotes = [...(src.note ?? "").matchAll(/"([^"]{3,})"/g)].map((m) => m[1]);
    const missing = quotes.filter((q) => !p.text.toLowerCase().includes(q.toLowerCase()));
    return { ok: missing.length === 0, detail: missing.length ? `não achei na página: ${missing.join(" | ")}` : "trechos encontrados na página" };
  }
  if (src.label === "Site do veículo") {
    const p = await pageText(src.url);
    return { ok: p.error ? null : true, detail: p.error ?? "o site abriu" };
  }
  return { ok: "na", detail: "tipo de veículo ou órgão oficial (sem classificação política)" };
}

console.log(`Conferindo ${Object.keys(OUTLETS).length} domínios. Isso leva alguns minutos...\n`);
const rows = [];
for (const [domain, o] of Object.entries(OUTLETS)) {
  const r = await check(domain, o);
  rows.push({ domain, o, ...r });
  const icon = r.ok === true ? "✅" : r.ok === false ? "❌" : r.ok === "na" ? "➖" : "⚠️ ";
  console.log(`${icon} ${o.name} (${domain}) — ${LINE_PT[o.line] ?? o.line} — ${o.source.label}: ${r.detail}`);
}

const date = new Date().toLocaleDateString("pt-BR");
const md = [
  "# Veículos da lista fixa: conferência das fontes",
  "",
  `Gerado por \`npm run conferir-veiculos\` em ${date}. ✅ = a classificação bate com a fonte hoje; ❌ = não bate (corrigir ou trocar por estimativa); ⚠️ = a página não abriu (rodar de novo); ➖ = sem classificação política.`,
  "",
  "| Veículo | Domínio | Classificação | Fonte | Conferido | O que a fonte diz |",
  "|---|---|---|---|---|---|",
  ...rows.map(
    (r) =>
      `| ${r.o.name} | ${r.domain} | ${LINE_PT[r.o.line] ?? r.o.line} | ${r.o.source.url ? `[${r.o.source.label}](${r.o.source.url})` : r.o.source.label} | ${r.ok === true ? "✅ sim" : r.ok === false ? "❌ não bate" : r.ok === "na" ? "➖ não se aplica" : "⚠️ não abriu"} | ${r.detail.replace(/\|/g, "/")} |`,
  ),
  "",
];
writeFileSync(path.join(root, "docs", "veiculos-conferidos.md"), md.join("\n"));

const bad = rows.filter((r) => r.ok === false);
const failed = rows.filter((r) => r.ok === null);
console.log(`\nResumo: ${rows.filter((r) => r.ok === true).length} conferidos ✅ · ${bad.length} não batem ❌ · ${failed.length} não abriram ⚠️ · ${rows.filter((r) => r.ok === "na").length} sem classificação política ➖`);
console.log("Tabela salva em docs/veiculos-conferidos.md");
if (bad.length) {
  console.log("\n❌ ATENÇÃO: corrija estes em lib/veiculos.ts (ou troque por estimativa):");
  for (const r of bad) console.log(`   - ${r.o.name}: ${r.detail}`);
  process.exitCode = 1;
}
