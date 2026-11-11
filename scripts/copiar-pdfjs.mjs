/**
 * Copia os arquivos auxiliares do leitor de PDF oficial (pdfjs-dist) para
 * public/pdfjs/, onde o navegador os encontra: o "ajudante" (worker) e os
 * decodificadores de imagem (JBIG2, JPEG 2000) usados nos PDFs escaneados.
 * Roda sozinho depois de cada "npm install" (inclusive na Vercel), para os
 * arquivos estarem sempre na mesma versão da biblioteca.
 */

import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "pdfjs-dist");
const dest = path.join(root, "public", "pdfjs");
if (!existsSync(src)) process.exit(0);
mkdirSync(path.join(dest, "wasm"), { recursive: true });
cpSync(path.join(src, "build", "pdf.worker.min.mjs"), path.join(dest, "pdf.worker.min.mjs"));
for (const f of ["jbig2.wasm", "openjpeg.wasm", "qcms_bg.wasm", "LICENSE_JBIG2", "LICENSE_OPENJPEG", "LICENSE_PDFJS_JBIG2", "LICENSE_PDFJS_OPENJPEG", "LICENSE_PDFJS_QCMS", "LICENSE_QCMS"]) {
  cpSync(path.join(src, "wasm", f), path.join(dest, "wasm", f));
}
console.log("pdf.js: arquivos auxiliares copiados para public/pdfjs/");
