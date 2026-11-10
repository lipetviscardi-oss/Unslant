/**
 * CONFERE O "LIXO" NO TEXTO ANALISADO (newsletter, apoio, tags, "leia
 * também", anúncios de editora, referências de papers, parágrafos repetidos)
 *
 * Uso:  npm run checar-lixo
 *
 * Para cada link já testado (testes/textos, testes/fixtures e os links de
 * testes/casos.json) e para os PDFs guardados, mostra:
 *  - ANTES: o lixo que havia no texto extraído da página;
 *  - DEPOIS: o que a limpeza removeu e se sobrou algum lixo;
 *  - se algum parágrafo removido parece conteúdo de verdade (para conferir).
 * Não usa a IA (custo zero). O relatório completo fica em
 * testes/resultados/lixo-AAAA-MM-DD.md (pode anexar no chat).
 *
 * Teste sem internet: npm run checar-lixo -- --html pagina.html --url https://site/...
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { extractFromUrl, extractFromHtml } = await import(path.join(root, "lib", "extract", "url.ts"));
const { cleanArticleText } = await import(path.join(root, "lib", "extract", "clean.ts"));
const { splitReferences } = await import(path.join(root, "lib", "extract", "references.ts"));

/** Sinais de lixo que NÃO deveriam sobrar no texto analisado. */
const JUNK = [
  ["newsletter", /\b(receba (por|no) e-?mail|newsletter|sign up for|subscribe to|inscreva-se|cadastre seu e-?mail|boletim\b)/i],
  ["apoio/doação", /\b(apoia\.se|catarse|patreon|seja (um[a]? )?apoiador|dependemos de voc|support (us|our)|donate|fa[çc]a parte do nosso grupo de apoiadores)/i],
  ["tags", /^(tags?|t[óo]picos|temas|palavras-chave|keywords)\s*[:|]?\s*$/i],
  ["leia também", /^(leia (tamb[ée]m|mais)|veja (tamb[ée]m|mais)|read (more|next)|related|saiba mais|mais lidas)\b/i],
  ["anúncio de editora", /(submit your (next )?manuscript|springeropen\.com|biomedcentral\.com|convenient online submission)/i],
  ["referências", /^(references|refer[êe]ncias( bibliogr[áa]ficas)?|bibliograf(y|ia)|works cited)\b/i],
];
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const paras = (t) => t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

function junkIn(text) {
  const out = [];
  const seen = new Set();
  for (const p of paras(text)) {
    for (const [kind, re] of JUNK) if (words(p) <= 60 && re.test(p)) out.push(`${kind}: «${p.slice(0, 90)}»`);
    if (words(p) >= 15) {
      const k = p.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(k)) out.push(`parágrafo repetido: «${p.slice(0, 90)}»`);
      seen.add(k);
    }
  }
  return out;
}

function report(label, rawText, domain) {
  const cleaned = cleanArticleText(rawText, domain);
  const split = splitReferences(cleaned.text);
  const finalText = split.body;
  const before = junkIn(rawText);
  const after = junkIn(finalText);
  // Parágrafo removido com cara de conteúdo: longo e terminado como frase.
  const suspicious = cleaned.removed.filter((r) => {
    const full = paras(rawText).find((p) => p.startsWith(r.slice(0, 60))) ?? r;
    return words(full) >= 40 && /[.!?]["”»]?$/.test(full) && !junkIn(full).length && !paras(rawText).filter((p) => p === full).slice(1).length;
  });
  const lines = [];
  lines.push(`\n## ${label}`);
  lines.push(`Palavras: ${words(rawText)} → ${words(finalText)} depois da limpeza${split.references ? ` (+ ${words(split.references)} palavras de referências separadas)` : ""}.`);
  lines.push(`ANTES (lixo encontrado no texto da página): ${before.length ? "" : "nenhum"}`);
  for (const b of before) lines.push(`  - ${b}`);
  lines.push(`REMOVIDO pela limpeza: ${cleaned.removed.length ? "" : "nada"}`);
  for (const r of cleaned.removed) lines.push(`  - «${r}»`);
  if (split.references) lines.push(`  - lista de referências (${words(split.references)} palavras), separada da análise`);
  lines.push(after.length ? `❌ DEPOIS: ainda sobrou lixo:` : `✅ DEPOIS: nenhum lixo sobrou.`);
  for (const a of after) lines.push(`  - ${a}`);
  if (suspicious.length) {
    lines.push(`⚠️ Conferir: parágrafos removidos que parecem conteúdo de verdade:`);
    for (const s of suspicious) lines.push(`  - «${s}»`);
  } else lines.push(`✅ Nenhum parágrafo de conteúdo foi removido.`);
  console.log(lines.join("\n"));
  return { ok: after.length === 0 && suspicious.length === 0, md: lines.join("\n") };
}

// --- quais links e PDFs conferir ---
const args = process.argv.slice(2);
const htmlIdx = args.indexOf("--html");
const items = [];
if (htmlIdx >= 0) {
  const url = args[args.indexOf("--url") + 1];
  items.push({ label: url, url, html: readFileSync(args[htmlIdx + 1], "utf8") });
} else {
  const seen = new Set();
  const add = (label, data) => {
    if (data.mode === "url" && data.url && !seen.has(data.url)) {
      seen.add(data.url);
      items.push({ label, url: data.url, savedText: data.text });
    } else if (data.mode === "pdf" && data.text) items.push({ label: `${label} (PDF)`, pdfText: data.text });
  };
  const manifest = JSON.parse(readFileSync(path.join(root, "testes", "casos.json"), "utf8"));
  for (const dir of ["textos", "fixtures"]) {
    const d = path.join(root, "testes", dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((x) => x.endsWith(".json"))) {
      const id = f.replace(/\.json$/, "");
      const c = manifest.casos.find((x) => x.id === id || x.arquivo === `${dir}/${f}`);
      add(c?.nome ?? id, JSON.parse(readFileSync(path.join(d, f), "utf8")));
    }
  }
  for (const c of manifest.casos) if (c.link && /^https?:/.test(c.link) && !/\.pdf($|\?)/i.test(c.link)) add(c.nome, { mode: "url", url: c.link });
}

console.log(`Conferindo ${items.length} links e PDFs (sem usar a IA)...`);
const results = [];
for (const it of items) {
  try {
    if (it.pdfText) {
      results.push(report(it.label, it.pdfText));
      continue;
    }
    const domain = new URL(it.url).hostname;
    const page = it.html ? await extractFromHtml(it.html, it.url) : await extractFromUrl(it.url);
    results.push(report(`${it.label} — ${it.url}`, page.text, domain));
  } catch (err) {
    console.log(`\n## ${it.label} — ${it.url}\n⚠️ Não consegui abrir agora (${err.code ?? err.message}).${it.savedText ? " Conferindo o texto guardado (pode já estar limpo)." : ""}`);
    if (it.savedText) results.push(report(`${it.label} (texto guardado)`, it.savedText, new URL(it.url).hostname));
  }
}

const ok = results.filter((r) => r.ok).length;
const summary = `\n# Resumo: ${ok} de ${results.length} sem lixo e sem conteúdo removido por engano.`;
console.log(summary);
mkdirSync(path.join(root, "testes", "resultados"), { recursive: true });
const file = path.join(root, "testes", "resultados", `lixo-${new Date().toISOString().slice(0, 10)}.md`);
writeFileSync(file, `# Conferência de lixo no texto analisado\n${results.map((r) => r.md).join("\n")}\n${summary}\n`);
console.log(`Relatório salvo em ${path.relative(root, file)} (pode anexar no chat).`);
if (ok < results.length) process.exitCode = 1;
