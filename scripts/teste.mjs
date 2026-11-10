/**
 * TESTE AUTOMÁTICO DA ANÁLISE
 *
 * Uso (com o site ligado em outra janela do Terminal: npm run dev):
 *   npm run teste              → analisa os artigos de testes/casos.json do zero
 *   npm run teste -- --baixo   → o mesmo, com "esforço baixo" nos especialistas
 *   npm run teste -- --haiku   → especialistas no Claude Haiku (mais barato)
 *   npm run teste -- --misto   → Haiku nos especialistas, menos no que avalia
 *                                a inclinação política (continua no Sonnet)
 *                                (experimento para baratear; não muda o site)
 *   npm run teste -- --porta 3001   → se o site estiver em outra porta
 *   npm run teste -- --so cnn       → roda só um caso (o id está em testes/casos.json)
 *
 * Confere as regras (faixa de nota de cada artigo, simetria entre os dois
 * lados, lados opostos na disputa) e mostra ✅ ou ❌. Custa cerca de
 * cerca de US$ 0,15 por artigo analisado.
 *
 * Antes da primeira vez: npm run teste:salvar
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const low = args.includes("--baixo");
// --so <id>: roda só um caso (ex.: npm run teste -- --so paper-grafico)
const onlyIndex = args.indexOf("--so");
const only = onlyIndex !== -1 ? args[onlyIndex + 1] : undefined;
const specialistModel = args.includes("--haiku") ? "haiku" : args.includes("--misto") ? "mixed" : undefined;
const experiment =
  [low ? 'esforço "baixo"' : "", specialistModel === "haiku" ? "Haiku nos especialistas" : "", specialistModel === "mixed" ? "misto (Haiku + Sonnet na inclinação)" : ""]
    .filter(Boolean)
    .join(" + ") || "padrão";
const portIndex = args.indexOf("--porta");
const port = portIndex !== -1 ? Number(args[portIndex + 1]) : 3000;
const base = `http://localhost:${port}`;

const root = process.cwd();
const manifest = JSON.parse(readFileSync(path.join(root, "testes", "casos.json"), "utf8"));
if (only) {
  manifest.casos = manifest.casos.filter((c) => c.id === only);
  if (!manifest.casos.length) {
    console.log(`Não existe caso com id "${only}" em testes/casos.json.`);
    process.exit(1);
  }
  delete manifest.simetria; // simetria só faz sentido com os dois lados juntos
}
const textsDir = path.join(root, "testes", "textos");
/** Onde fica o texto de cada caso: um arquivo do próprio projeto (caso.arquivo) ou o guardado pelo teste:salvar. */
const caseFile = (c) => (c.arquivo ? path.join(root, "testes", c.arquivo) : path.join(textsDir, `${c.id}.json`));
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
  const s = { slight: "leve", moderate: "moderada", clear: "moderada", strong: "forte" }[d.strength] ?? "";
  if (d.status === "favors_a") return `Favorece ${d.sideA} (${s})`;
  if (d.status === "favors_b") return `Favorece ${d.sideB} (${s})`;
  return { balanced: "Equilibrado", unidentified: "Não identificada", not_applicable: "Não se aplica" }[d.status] ?? d.status;
}

/** Envia um artigo para análise e devolve o resultado (lê o progresso em tempo real). */
async function analyze(body) {
  const res = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, devOptions: { noCache: true, ...(low ? { specialistEffort: "low" } : {}), ...(specialistModel ? { specialistModel } : {}) } }),
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
  if (saved.mode === "pdf")
    return { mode: "pdf", text: saved.text, meta: saved.meta ?? {}, ...(saved.images?.length ? { images: saved.images } : {}), ...common };
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
// Casos opcionais (ex.: EUA e Reino Unido) ainda não salvos ficam de fora, com aviso.
const skipped = manifest.casos.filter((c) => c.opcional && !existsSync(caseFile(c)));
if (skipped.length) {
  console.log(`Fora desta rodada (ainda não salvos com npm run teste:salvar): ${skipped.map((c) => c.nome).join(", ")}.\n`);
  manifest.casos = manifest.casos.filter((c) => !skipped.includes(c));
}
const missing = manifest.casos.filter((c) => !existsSync(caseFile(c)));
if (missing.length) {
  console.log(`Faltam os textos de: ${missing.map((c) => c.nome).join(", ")}.`);
  console.log("Rode antes: npm run teste:salvar");
  process.exit(1);
}

console.log(`Teste automático — ${manifest.casos.length} artigos${experiment !== "padrão" ? ` — EXPERIMENTO: ${experiment}` : ""}`);
console.log("Cada análise leva cerca de 30 segundos. Custo estimado: cerca de US$ 0,15 por artigo.\n");

// 2. Analisa cada artigo do zero (um de cada vez, para não estourar o limite da IA)
const runs = {};
for (const c of manifest.casos) {
  const saved = JSON.parse(readFileSync(caseFile(c), "utf8"));
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
  const [min, max] = c.faixa ?? [0, 10];
  const genre = `${GENRE[r.context.contentType] ?? r.context.contentType}${r.context.contentTypeSource === "user" ? " (informado)" : ""}`;
  console.log(`\n• ${c.nome}`);
  console.log(`  Nota: ${n(score, 1)} (${r.overall.label})${c.faixa ? ` — esperado entre ${min} e ${max}` : ""}`);
  console.log(`  Gênero: ${genre}${r.context.contentTypeReason ? ` — ${r.context.contentTypeReason}` : ""}`);
  console.log(`  Disputa: ${disputeText(r.political.dispute)}`);
  console.log(`  Custo: US$ ${n(r.stats.estimatedCostUsd, 3)} · ${Math.round(r.stats.durationMs / 1000)} s`);
  const stages = Object.entries(r.stats.stages ?? {});
  if (stages.length) {
    console.log(`  Por etapa: ${stages.map(([k, v]) => `${k} ${n(v.costUsd, 3)}${/ \+ /.test(v.model) ? ` (${v.model.replace(/claude-|-5-5/g, "")})` : /haiku/.test(v.model) ? " (Haiku)" : ""}`).join(" · ")}`);
  }
  if (c.faixa) check(score >= min && score <= max, `${c.nome}: nota ${n(score, 1)} dentro da faixa ${min}–${max}`);

  // Imagens e gráficos: quantas figuras a IA viu e se apontou o gráfico enganoso.
  if (r.figures?.length) {
    console.log(`  Imagens: ${r.figures.map((f) => `${f.label} (${f.kind}): ${f.description.slice(0, 90)}`).join(" | ")}`);
  }
  if (c.graficoEnganoso) {
    const mc = r.groups.flatMap((g) => g.categories).find((x) => x.id === "misleading_chart");
    const onFigure = mc?.evidence?.some((e) => e.figureId);
    console.log(`  Gráfico enganoso: ${mc ? `${mc.status}, nota ${n(mc.score, 1)}` : "categoria ausente"}${mc?.summary ? ` — ${mc.summary.slice(0, 140)}` : ""}`);
    check(!!r.figures?.length, `${c.nome}: a IA recebeu e descreveu as imagens (${r.figures?.length ?? 0})`);
    check(mc?.status === "found" && mc.score >= 3.5 && onFigure, `${c.nome}: gráfico enganoso apontado na figura, com nota pelo menos moderada`);
  }
}

// Simetria: um par (formato antigo) ou vários pares (Brasil, EUA, Reino Unido...).
const pairs = [manifest.simetria ?? []].flat();
for (const sim of pairs) {
  const [a, b] = sim.entre.map((id) => ({ c: manifest.casos.find((x) => x.id === id), r: runs[id] }));
  if (!a.c || !b.c) continue; // par com caso opcional ainda não salvo
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
  esforcoEspecialistas: experiment,
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
  console.log(`\nCOMPARAÇÃO com a rodada anterior (${new Date(prev.data).toLocaleString("pt-BR")}, ${prev.esforcoEspecialistas})`);
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
