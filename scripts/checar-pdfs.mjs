/**
 * CONFERE A LEITURA DE PDFs: título, autores, revista e data (sem usar a IA).
 *
 * Uso:  npm run checar-pdfs
 *
 * Lê cada PDF de testes/pdfs/ como o site lê e compara com testes/pdfs/esperado.json.
 * PDFs com direitos autorais ficam em testes/pdfs/privados/ (fora do GitHub);
 * se não estiverem no seu computador, são pulados com aviso.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { extractFromPdf } = await import(path.join(root, "lib", "extract", "pdf-client.ts"));
const { pdfs } = JSON.parse(readFileSync(path.join(root, "testes", "pdfs", "esperado.json"), "utf8"));

let fails = 0;
let skipped = 0;
for (const exp of pdfs) {
  const file = path.join(root, "testes", "pdfs", exp.arquivo);
  if (!existsSync(file)) {
    console.log(`⚠️  ${exp.arquivo}: não está no seu computador (pulado)`);
    skipped++;
    continue;
  }
  const buf = readFileSync(file);
  // O nome do arquivo de propósito é "genérico": o título NÃO pode vir dele.
  const f = { name: "Teste unslant pdf.pdf", arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
  const checks = [];
  try {
    const { source } = await extractFromPdf(f);
    if (exp.escaneado) checks.push([source.scanned === true, `reconhecido como escaneado (deu: ${source.scanned ? "sim" : "não"})`]);
    if (exp.titulo) checks.push([source.title === exp.titulo, `título: ${source.title}`]);
    if (exp.autores) checks.push([(source.author ?? "").includes(exp.autores), `autores: ${source.author ?? "—"}`]);
    if (exp.revista) checks.push([source.outlet === exp.revista, `revista: ${source.outlet ?? "—"}`]);
    if (exp.data) checks.push([source.publishedAt === exp.data, `data: ${source.publishedAt ?? "—"}`]);
  } catch (err) {
    const scannedError = err.code === "PDF_SCANNED";
    checks.push([false, scannedError ? "o site recusou: PDF escaneado (sem texto selecionável)" : `erro: ${err.code ?? err.message}`]);
  }
  const ok = checks.every(([c]) => c);
  if (!ok) fails++;
  console.log(`${ok ? "✅" : "❌"} ${exp.arquivo}`);
  for (const [c, msg] of checks) console.log(`   ${c ? "✓" : "✗"} ${msg}`);
}
console.log(`\nResumo: ${pdfs.length - fails - skipped} ok, ${fails} com problema, ${skipped} pulados.`);
if (fails) process.exitCode = 1;
