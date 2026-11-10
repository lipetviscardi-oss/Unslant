/**
 * Permite rodar o código do site (TypeScript, com atalhos "@/...") fora do
 * Next.js, nos comandos de conferência (npm run checar-lixo etc.).
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..") + path.sep;

export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const p = ROOT + spec.slice(2) + ext;
      if (existsSync(p)) return next(pathToFileURL(p).href, ctx);
    }
  }
  // "server-only" só faz sentido dentro do Next.js.
  if (spec === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\.[mc]?[jt]sx?$/.test(spec) && ctx.parentURL?.startsWith(pathToFileURL(ROOT).href)) {
    const u = new URL(spec, ctx.parentURL);
    for (const ext of [".ts", ".tsx"]) if (existsSync(fileURLToPath(u) + ext)) return next(u.href + ext, ctx);
  }
  return next(spec, ctx);
}
