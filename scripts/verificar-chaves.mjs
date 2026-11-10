/**
 * CONFERIR AS CHAVES DO .env.local
 *
 * Uso:  npm run verificar
 *
 * Confere se as chaves estão no arquivo .env.local, no formato certo, e se o
 * Supabase as aceita. NUNCA mostra as chaves inteiras: só o começo, para você
 * reconhecer qual é. Não precisa do site ligado.
 */

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const file = path.join(process.cwd(), ".env.local");
let problems = 0;
const ok = (msg) => console.log(`✅ ${msg}`);
const bad = (msg) => {
  problems++;
  console.log(`❌ ${msg}`);
};
const mask = (v) => (v.length > 14 ? `${v.slice(0, 14)}…` : "…");

if (!existsSync(file)) {
  console.log("❌ Não encontrei o arquivo .env.local nesta pasta.");
  console.log("   Confira se o Terminal está na pasta do projeto (o comando pwd deve terminar em /Unslant).");
  process.exit(1);
}

console.log("Conferindo o .env.local (as chaves não são mostradas inteiras)\n");

// Lê o arquivo linha a linha (sem bibliotecas).
const env = {};
const counts = {};
readFileSync(file, "utf8")
  .split(/\r?\n/)
  .forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const eq = line.indexOf("=");
    if (eq === -1) {
      bad(`Linha ${i + 1} sem "=": confira se uma chave não foi quebrada em duas linhas.`);
      return;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1);
    if (key !== line.slice(0, eq)) bad(`Linha ${i + 1} (${key}): há espaço antes do "=". Apague o espaço.`);
    if (value !== value.trim()) bad(`Linha ${i + 1} (${key}): há espaço depois do "=" ou no fim da linha. Apague os espaços.`);
    value = value.trim();
    if (/^["'“”‘’]|["'“”‘’]$/.test(value)) bad(`Linha ${i + 1} (${key}): o valor está entre aspas. Apague as aspas.`);
    counts[key] = (counts[key] ?? 0) + 1;
    env[key] = value.replace(/^["'“”‘’]|["'“”‘’]$/g, "");
  });

for (const [k, n] of Object.entries(counts)) if (n > 1) bad(`${k} aparece ${n} vezes. Deixe só uma linha com ela.`);

function checkKey(name, test, hint) {
  const v = env[name];
  if (!v) return bad(`${name} não está no arquivo. ${hint}`);
  if (!test(v)) return bad(`${name} está num formato estranho (${mask(v)}). ${hint}`);
  ok(`${name} (${mask(v)})`);
}

checkKey("ANTHROPIC_API_KEY", (v) => v.startsWith("sk-ant-") && v.length > 40, "Ela começa com sk-ant-.");
checkKey(
  "NEXT_PUBLIC_SUPABASE_URL",
  (v) => /^https:\/\/[a-z0-9]{10,}\.supabase\.co\/?$/.test(v),
  "Deve ser algo como https://xxxx.supabase.co (Supabase → Connect).",
);
checkKey(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  (v) => v.startsWith("sb_publishable_") && v.length > 25,
  "Ela começa com sb_publishable_ (Supabase → Connect, aba .env.local).",
);
checkKey(
  "SUPABASE_SECRET_KEY",
  (v) => v.startsWith("sb_secret_") && v.length > 20,
  "Ela começa com sb_secret_ (Supabase → Project Settings → API Keys).",
);

// A chave secreta nunca pode ter o prefixo NEXT_PUBLIC_ (iria para o navegador).
for (const [k, v] of Object.entries(env)) {
  if (k.startsWith("NEXT_PUBLIC_") && (v.startsWith("sb_secret_") || v.startsWith("sk-ant-"))) {
    bad(`${k}: uma chave SECRETA está com o prefixo NEXT_PUBLIC_, que a deixaria visível no navegador. Troque o nome da linha.`);
  }
}

// O .env.local precisa estar fora do GitHub.
try {
  execFileSync("git", ["check-ignore", "-q", ".env.local"], { stdio: "ignore" });
  ok(".env.local está protegido: não vai para o GitHub");
} catch {
  bad(".env.local NÃO está protegido pelo .gitignore. Não faça commit e me avise.");
}

// Testa as chaves no Supabase de verdade.
const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
if (url && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } });
    if (r.ok) ok("O Supabase aceitou a chave publishable");
    else bad(`O Supabase recusou a chave publishable (resposta ${r.status}). Copie de novo, inteira.`);
  } catch {
    bad("Não consegui falar com o Supabase. Confira a internet e o endereço (NEXT_PUBLIC_SUPABASE_URL).");
  }
}
if (url && env.SUPABASE_SECRET_KEY) {
  try {
    const r = await fetch(`${url}/auth/v1/admin/users?per_page=1`, {
      headers: { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` },
    });
    if (r.ok) ok("O Supabase aceitou a chave secreta");
    else bad(`O Supabase recusou a chave secreta (resposta ${r.status}). Copie de novo, inteira, em Project Settings → API Keys.`);
  } catch {
    bad("Não consegui testar a chave secreta (sem conexão com o Supabase).");
  }
}

console.log(problems ? `\n${problems} problema(s) para corrigir. Depois rode de novo: npm run verificar` : "\nTudo certo! ✅");
process.exit(problems ? 1 : 0);
