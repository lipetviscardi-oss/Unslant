/**
 * TESTE AUTOMÁTICO DA ANÁLISE
 *
 * Uso (com o site ligado em outra janela do Terminal: npm run dev):
 *   npm run teste              → analisa os artigos de testes/casos.json do zero
 *   npm run teste -- --baixo   → o mesmo, com "esforço baixo" nos especialistas
 *                                (experimento para baratear; não muda o site)
 *   npm run teste -- --porta 3001   → se o site estiver em outra porta
 *
 * Confere as regras (faixa de nota de cada artigo, simetria entre os dois
 * lados, lados opostos na disputa) e mostra ✅ ou ❌. Custa cerca de
 * US$ 0,40 por rodada (3 análises completas).
 *
 * Antes da primeira vez: npm run teste:salvar
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const low = args.includes("--baixo");
const portIndex = args.indexOf("--porta");
const port = portIndex !== -1 ? Number(args[portIndex + 1]) : 3000;
const base = `http://localhost:${port}`;

const root = process.cwd();
const manifest = JSON.parse(readFileSync(path.join(root, "testes", "casos.json"), "utf8"));
const textsDir = path.join(root, "testes", "textos");
const resultsDir = path.join(root, "testes", "resultados");

const GENRE = {
  news: "Notícia",
  feature: "Reportagem",
  analysis: "Análise",
  opinion: "Opinião",
  editorial: "Editorial",
  academic_paper: "Artigo acadêmico",
  press_release: "Comunicado",
  blog: "Blog",
  other: "Outro",
};

/** Número no formato brasileiro (vírgula decimal). */
const n = (x, digits = 1) => x.toFixed(digits).replace(".", ",");

function disputeText(d) {
  if (!d) return "—";
  const s = { slight: "leve", clear: "clara", strong: "forte" }[d.strength] ?? "";
  if (d.status === "favors_a") return `Favorece ${d.sideA} (${s})`;
  if (d.status === "favors_b") return `Favorece ${d.sideB} (${s})`;
  return { balanced: "Equilibrado", unidentified: "Não identificada", not_applicable: "Não se aplica" }[d.status] ?? d.status;
}

/** Envia um artigo para análise e devolve o resultado (lê o progresso em tempo real). */
async function analyze(body) {
  const res = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, devOptions: { noCache: true, ...(low ? { specialistEffort: "low" } : {}) } }),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw Object.assign(new Error(data?.message ?? `HTTP ${res.status}`), { code: data?.code ?? "HTTP" });
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const ev = JSON.parse(line);
      if (ev.type === "error") throw Object.assign(new Error(ev.message), { code: ev.code });
      if (ev.type === "stage") process.stdout.write(".");
      if (ev.type === "result") result = ev.result;
    }
    if (done) break;
  }
  if (!result) throw Object.assign(new Error("a análise terminou sem resultado"), { code: "UNKNOWN" });
  return result;
}

function requestFor(saved, useUrl) {
  const common = { lang: saved.lang ?? "pt", ...(saved.contentType ? { contentType: saved.contentType } : {}) };
  if (saved.mode === "url" && useUrl) return { mode: "url", url: saved.url, ...common };
  if (saved.mode === "pdf") return { mode: "pdf", text: saved.text, meta: saved.meta ?? {}, ...common };
  return { mode: "text", text: saved.text, ...common };
}

// 0. O site está ligado?
try {
  await fetch(base, { method: "HEAD" });
} catch {
  console.log(`Não consegui falar com o site em ${base}.`);
  console.log("Abra outra janela do Terminal, entre na pasta do projeto e rode: npm run dev");
  console.log("Depois rode este teste de novo.");
  process.exit(1);
}

// 1. Os textos estão guardados?
const missing = manifest.casos.filter((c) => !existsSync(path.join(textsDir, `${c.id}.json`)));
if (missing.length) {
  console.log(`Faltam os textos de: ${missing.map((c) => c.nome).join(", ")}.`);
  console.log("Rode antes: npm run teste:salvar");
  process.exit(1);
}

console.log(`Teste automático — ${manifest.casos.length} artigos${low ? ' — EXPERIMENTO: esforço "baixo" nos especialistas' : ""}`);
console.log("Cada análise leva cerca de 30 segundos. Custo estimado: US$ 0,40 no total.\n");

// 2. Analisa cada artigo do zero (um de cada vez, para não estourar o limite da IA)
const runs = {};
for (const c of manifest.casos) {
  const saved = JSON.parse(readFileSync(path.join(textsDir, `${c.id}.json`), "utf8"));
  process.stdout.write(`Analisando ${c.nome} `);
  const t0 = Date.now();
  try {
    let r;
    try {
      r = await analyze(requestFor(saved, true));
    } catch (err) {
      // Se o link não abrir mais (site fora do ar, mudou etc.), usa o texto guardado.
      const linkProblem = /^(URL_|FETCH_|NOT_HTML|PAYWALL|NO_ARTICLE)/.test(err.code ?? "");
      if (saved.mode !== "url" || !linkProblem) throw err;
      process.stdout.write(" (link não abriu; usando o texto guardado) ");
      r = await analyze(requestFor(saved, false));
    }
    runs[c.id] = r;
    console.log(` ok (${Math.round((Date.now() - t0) / 1000)} s)`);
  } catch (err) {
    console.log(` ERRO: ${err.message} (${err.code})`);
    runs[c.id] = null;
    // Sem chave ou sem crédito, os outros artigos também falhariam: para aqui.
    if (["MISSING_API_KEY", "AI_AUTH", "AI_NO_CREDIT", "DAILY_LIMIT"].includes(err.code)) break;
  }
}

// 3. Confere as regras
const checks = [];
const check = (ok, text) => checks.push({ ok, text });
console.log("\nRESULTADOS");
for (const c of manifest.casos) {
  const r = runs[c.id];
  if (!r) {
    check(false, `${c.nome}: a análise falhou`);
    continue;
  }
  const score = r.overall.score;
  const [min, max] = c.faixa;
  const genre = `${GENRE[r.context.contentType] ?? r.context.contentType}${r.context.contentTypeSource === "user" ? " (informado)" : ""}`;
  console.log(`\n• ${c.nome}`);
  console.log(`  Nota: ${n(score, 1)} (${r.overall.label}) — esperado entre ${min} e ${max}`);
  console.log(`  Gênero: ${genre}${r.context.contentTypeReason ? ` — ${r.context.contentTypeReason}` : ""}`);
  console.log(`  Disputa: ${disputeText(r.political.dispute)}`);
  console.log(`  Custo: US$ ${n(r.stats.estimatedCostUsd, 3)} · ${Math.round(r.stats.durationMs / 1000)} s`);
  check(score >= min && score <= max, `${c.nome}: nota ${n(score, 1)} dentro da faixa ${min}–${max}`);
}

const sim = manifest.simetria;
if (sim) {
  const [a, b] = sim.entre.map((id) => ({ c: manifest.casos.find((x) => x.id === id), r: runs[id] }));
  if (a.r && b.r) {
    const diff = Math.abs(a.r.overall.score - b.r.overall.score);
    check(
      diff <= sim.diferencaMaxima,
      `Simetria: diferença de ${n(diff, 1)} ponto(s) entre ${a.c.nome} e ${b.c.nome} (máximo ${n(sim.diferencaMaxima)})`,
    );
    if (sim.ladosOpostos) {
      const fav = (r) => r.political.dispute?.status;
      const opposite =
        (fav(a.r) === "favors_a" && fav(b.r) === "favors_b") || (fav(a.r) === "favors_b" && fav(b.r) === "favors_a");
      check(
        opposite,
        `Lados opostos: ${a.c.nome} → ${disputeText(a.r.political.dispute)}; ${b.c.nome} → ${disputeText(b.r.political.dispute)}`,
      );
    }
  }
}

const done = Object.values(runs).filter(Boolean);
const avgCost = done.length ? done.reduce((s, r) => s + r.stats.estimatedCostUsd, 0) / done.length : 0;

console.log("\nREGRAS");
for (const x of checks) console.log(`${x.ok ? "✅" : "❌"} ${x.text}`);
if (done.length) {
  const target = manifest.custoAlvoUsd ?? 0.1;
  console.log(
    `${avgCost <= target ? "✅" : "⚠️ "} Custo médio: US$ ${n(avgCost, 3)} por análise (meta: até US$ ${n(target, 2)}; só informativo)`,
  );
}

// 4. Compara com a rodada anterior e guarda esta (testes/resultados, só no seu computador)
mkdirSync(resultsDir, { recursive: true });
const summary = {
  data: new Date().toISOString(),
  esforcoEspecialistas: low ? "baixo" : "padrão",
  casos: Object.fromEntries(
    manifest.casos.map((c) => {
      const r = runs[c.id];
      return [
        c.id,
        r
          ? {
              nota: r.overall.score,
              genero: r.context.contentType,
              disputa: disputeText(r.political.dispute),
              custo: r.stats.estimatedCostUsd,
              segundos: Math.round(r.stats.durationMs / 1000),
            }
          : null,
      ];
    }),
  ),
  aprovado: checks.every((x) => x.ok),
};
const previous = readdirSync(resultsDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .pop();
if (previous) {
  const prev = JSON.parse(readFileSync(path.join(resultsDir, previous), "utf8"));
  console.log(`\nCOMPARAÇÃO com a rodada anterior (${new Date(prev.data).toLocaleString("pt-BR")}, esforço ${prev.esforcoEspecialistas})`);
  for (const c of manifest.casos) {
    const p = prev.casos[c.id];
    const cur = summary.casos[c.id];
    if (!p || !cur) continue;
    console.log(`  ${c.nome}: nota ${n(p.nota, 1)} → ${n(cur.nota, 1)} · custo US$ ${n(p.custo, 3)} → ${n(cur.custo, 3)}`);
  }
}
writeFileSync(path.join(resultsDir, `${summary.data.replace(/[:.]/g, "-")}.json`), JSON.stringify(summary, null, 2));

console.log(summary.aprovado ? "\nTESTE APROVADO ✅" : "\nTESTE REPROVADO ❌ (veja as regras acima)");
process.exit(summary.aprovado ? 0 : 1);
