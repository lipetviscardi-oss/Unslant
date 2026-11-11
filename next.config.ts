import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // O jsdom (leitura de links) vem empacotado junto com o site. Carregado à parte,
  // ele quebrava na Vercel: partes dele são ESM e lá o Node não as aceita via require().
  transpilePackages: ["jsdom"],
  partialPrefetching: true,
  turbopack: {
    // Ver lib/vazio/sem-canvas.js.
    resolveAlias: { "@napi-rs/canvas": "./lib/vazio/sem-canvas.js" },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
