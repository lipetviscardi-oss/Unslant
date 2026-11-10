/**
 * GUARDAR OS TEXTOS DO TESTE AUTOMÁTICO
 *
 * Uso:  npm run teste:salvar
 *
 * Procura, entre as análises guardadas em .cache/analyses (no seu
 * computador), as dos artigos listados em testes/casos.json e guarda o texto
 * de cada um em testes/textos/ (pasta que NÃO vai para o GitHub). Também
 * guarda junto o título e o link de cada artigo. O arquivo testes/casos.json
 * não é alterado (assim ele nunca entra em conflito com o GitHub).
 *
 * Antes, analise cada artigo uma vez no site (npm run dev).
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const casesPath = path.join(root, "testes", "casos.json");
const manifest = JSON.parse(readFileSync(casesPath, "utf8"));
const cacheDir = path.join(root, ".cache", "analyses");
const outDir = path.join(root, "testes", "textos");

let files = [];
try {
  files = readdirSync(cacheDir).filter((f) => f.endsWith(".json"));
} catch {
  console.log("Nenhuma análise guardada encontrada em .cache/analyses.");
  console.log("Ligue o site (npm run dev), analise os artigos do teste e rode este comando de novo.");
  process.exit(1);
}

const analyses = files
  .map((f) => {
    try {
      const full = path.join(cacheDir, f);
      const r = JSON.parse(readFileSync(full, "utf8"));
      return r && r.schemaVersion === 1 && !r.demo && r.source?.type !== "claim" ? { r, mtime: statSync(full).mtimeMs } : null;
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => b.mtime - a.mtime); // mais recentes primeiro

const norm = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** 2 = link/veículo/título batem; 1 = só o começo do texto bate; 0 = não bate. */
function match(r, words) {
  const strong = norm([r.source?.url, r.source?.outlet, r.source?.title].join(" "));
  const head = norm(r.text.slice(0, 1500));
  const ws = words.map(norm);
  if (ws.some((w) => strong.includes(w))) return 2;
  if (ws.some((w) => head.includes(w))) return 1;
  return 0;
}

mkdirSync(outDir, { recursive: true });
const used = new Set();
let missing = 0;

for (const c of manifest.casos) {
  if (c.arquivo) {
    console.log(`✅ ${c.nome}: já vem com o projeto (testes/${c.arquivo})`);
    continue;
  }
  const candidates = analyses.filter((a) => !used.has(a.r.id));
  const best =
    candidates.find((a) => match(a.r, c.procurar) === 2) ?? candidates.find((a) => match(a.r, c.procurar) === 1);
  if (!best) {
    if (c.opcional) {
      console.log(`➖ ${c.nome}: ainda não analisado (opcional). Veículos aceitos: ${c.procurar.join(", ")}.`);
      continue;
    }
    console.log(`❌ ${c.nome}: não achei uma análise deste artigo. Analise-o no site e rode o comando de novo.`);
    missing++;
    continue;
  }
  used.add(best.r.id);
  const r = best.r;
  const mode = r.source.type; // "url" | "text" | "pdf"
  const saved = {
    mode,
    lang: r.language ?? "pt",
    url: r.source.url ?? "",
    title: r.source.title ?? "",
    text: r.text,
    meta: mode === "pdf" ? { title: r.source.title ?? "", author: r.source.author ?? "" } : undefined,
    contentType: r.source.declaredType,
    salvoEm: new Date().toISOString(),
  };
  writeFileSync(path.join(outDir, `${c.id}.json`), JSON.stringify(saved, null, 2));
  const how = { url: "link", text: "texto colado", pdf: "PDF" }[mode] ?? mode;
  console.log(`✅ ${c.nome}: guardado (${how}, ${r.source.wordCount ?? "?"} palavras) — "${(r.source.title || r.text.slice(0, 60)).split("\n")[0].slice(0, 80)}"`);
}

console.log(
  missing
    ? `\nFaltam ${missing} artigo(s). Os que foram achados já estão guardados.`
    : "\nPronto! Agora, com o site ligado (npm run dev), rode: npm run teste",
);
process.exit(missing ? 1 : 0);
