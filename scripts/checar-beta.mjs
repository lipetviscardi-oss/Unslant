/**
 * TODAS AS CONFERÊNCIAS SEM IA (antes de cada nova versão do site)
 *
 * Uso:  npm run checar-beta
 *
 * Roda, uma depois da outra: checar-pdfs, checar-lixo, checar-contradicoes e
 * conferir-veiculos. Custo zero. No fim, mostra o resumo de cada uma.
 * (O teste com a IA de verdade é separado: npm run teste:beta.)
 */

import { spawnSync } from "node:child_process";

const steps = [
  ["checar-pdfs", "Título, autores, revista e data dos PDFs"],
  ["checar-lixo", "Lixo da página no texto analisado"],
  ["checar-contradicoes", "Contradições nas análises já feitas"],
  ["conferir-veiculos", "Classificação dos veículos × fontes (leva alguns minutos)"],
];
const results = [];
for (const [script, label] of steps) {
  console.log(`\n━━━━━━━━ ${label} (npm run ${script}) ━━━━━━━━`);
  const r = spawnSync("npm", ["run", "--silent", script], { stdio: "inherit", shell: process.platform === "win32" });
  results.push([label, r.status === 0]);
}
console.log("\n━━━━━━━━ RESUMO ━━━━━━━━");
for (const [label, ok] of results) console.log(`${ok ? "✅" : "❌"} ${label}`);
if (results.some(([, ok]) => !ok)) process.exitCode = 1;
