/**
 * LEITURA DE LINKS (aba "Link")
 *
 * 1. Confere se o endereço é público (por segurança, nunca acessamos
 *    endereços internos/locais — proteção contra "SSRF").
 * 2. Baixa a página com limite de tempo e de tamanho.
 * 3. Extrai o texto principal com o Readability (o "modo leitura" do Firefox).
 * 4. Pega título, autor, veículo e data dos metadados da página.
 * 5. Detecta paywall, bloqueios e páginas sem artigo, com mensagens claras.
 */

import "server-only";
import { lookup as dnsLookup } from "node:dns/promises";
import type { LookupAddress, LookupOptions } from "node:dns";
import net from "node:net";
import { Agent, fetch as undiciFetch, type Response as UndiciResponse } from "undici";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";
import { config } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { countWords, normalizeText } from "@/lib/text";
import type { SourceInfo } from "@/lib/analysis/types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 unslant/0.1";

/* ------------------------------------------------ segurança dos endereços */

/**
 * Endereços IPv4 que NÃO são públicos (rede local, do próprio servidor,
 * reservados, de documentação etc.).
 */
const BLOCKED_V4 = new net.BlockList();
for (const [net4, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3], // multicast e reservados (224.0.0.0 a 255.255.255.255)
] as const) {
  BLOCKED_V4.addSubnet(net4, prefix, "ipv4");
}

/**
 * IPv6: só aceitamos endereços públicos ("global unicast", 2000::/3).
 * Isso já recusa formas disfarçadas de IPv4 (::ffff:…, 64:ff9b::…), o
 * próprio servidor (::1), rede local (fc00::, fe80::, fec0::) etc.
 * Dentro de 2000::/3, recusamos ainda os túneis que embutem IPv4
 * (6to4 e Teredo) e faixas de documentação.
 */
const ALLOWED_V6 = new net.BlockList();
ALLOWED_V6.addSubnet("2000::", 3, "ipv6");
const BLOCKED_V6 = new net.BlockList();
for (const [net6, prefix] of [
  ["2002::", 16], // 6to4
  ["2001::", 32], // Teredo
  ["2001:db8::", 32], // documentação
  ["2001:10::", 28], // ORCHID
  ["3fff::", 20], // documentação
] as const) {
  BLOCKED_V6.addSubnet(net6, prefix, "ipv6");
}

export function isPublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) return !BLOCKED_V4.check(ip, "ipv4");
  if (net.isIPv6(ip)) return ALLOWED_V6.check(ip, "ipv6") && !BLOCKED_V6.check(ip, "ipv6");
  return false;
}

class ForbiddenAddressError extends Error {
  constructor(host: string) {
    super(`endereço não público: ${host}`);
    this.name = "ForbiddenAddressError";
  }
}

/**
 * Resolve o nome do site E confere os endereços no momento exato da
 * conexão. Assim, um site não consegue mostrar um endereço público na
 * conferência e trocar por um interno na hora de conectar ("DNS rebinding").
 */
function safeLookup(
  hostname: string,
  options: LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) {
  dnsLookup(hostname, { all: true, family: options.family as number | undefined })
    .then((addresses) => {
      if (addresses.length === 0 || addresses.some((a) => !isPublicIp(a.address))) {
        callback(new ForbiddenAddressError(hostname), []);
        return;
      }
      if (options.all) callback(null, addresses);
      else callback(null, addresses[0].address, addresses[0].family);
    })
    .catch((err) => callback(err, []));
}

/** Conexões de saída sempre passam pela conferência acima. */
const safeAgent = new Agent({ connect: { lookup: safeLookup as never } });

function isForbiddenAddress(err: unknown): boolean {
  let e: unknown = err;
  for (let i = 0; i < 5 && e; i++) {
    if (e instanceof ForbiddenAddressError) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/** Só para testes locais: UNSLANT_ALLOW_LOCAL_URLS=true no .env.local. */
const allowLocal = () => process.env.UNSLANT_ALLOW_LOCAL_URLS === "true" && process.env.NODE_ENV === "development";

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new AppError("URL_INVALID");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new AppError("URL_INVALID");
  if (url.username || url.password) throw new AppError("URL_FORBIDDEN");
  if (allowLocal()) return url;

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new AppError("URL_FORBIDDEN");
  }
  // Conferência antecipada, só para dar uma mensagem clara ao usuário.
  // A conferência que garante a segurança acontece na conexão (safeLookup).
  let addresses: { address: string }[];
  try {
    addresses = net.isIP(host) ? [{ address: host }] : await dnsLookup(host, { all: true });
  } catch {
    throw new AppError("FETCH_FAILED", `DNS: ${host}`);
  }
  if (addresses.length === 0 || addresses.some((a) => !isPublicIp(a.address))) {
    throw new AppError("URL_FORBIDDEN", host);
  }
  return url;
}

/* ---------------------------------------------------------- download */

/** Lê o corpo da resposta, parando se passar de `maxBytes`. */
async function readBytes(res: UndiciResponse, maxBytes: number): Promise<Buffer> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new AppError("FETCH_TOO_LARGE");
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new AppError("FETCH_TOO_LARGE");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function readLimited(res: UndiciResponse, maxBytes: number): Promise<string> {
  const buf = await readBytes(res, maxBytes);
  // Detecta a codificação declarada (ex.: sites antigos em ISO-8859-1).
  const ctype = res.headers.get("content-type") ?? "";
  let charset = /charset=([\w-]+)/i.exec(ctype)?.[1];
  if (!charset) {
    const head = buf.subarray(0, 2048).toString("latin1");
    charset = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];
  }
  try {
    return new TextDecoder(charset ?? "utf-8").decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}

/**
 * Download seguro: só endereços públicos (conferidos também na conexão),
 * redirecionamentos seguidos à mão e conferidos um a um, com tempo limite.
 */
async function safeGet(rawUrl: string, accept: string, timeoutMs: number): Promise<{ res: UndiciResponse; finalUrl: string }> {
  let url = await assertPublicUrl(rawUrl);
  for (let hop = 0; hop <= config.fetch.maxRedirects; hop++) {
    let res: UndiciResponse;
    try {
      res = await undiciFetch(url, {
        redirect: "manual", // seguimos os redirecionamentos à mão, conferindo cada destino
        signal: AbortSignal.timeout(timeoutMs),
        // Em testes locais (UNSLANT_ALLOW_LOCAL_URLS) a conferência na conexão é desligada.
        dispatcher: allowLocal() ? undefined : safeAgent,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: accept,
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });
    } catch (err) {
      if (isForbiddenAddress(err)) throw new AppError("URL_FORBIDDEN", url.hostname);
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw new AppError("FETCH_TIMEOUT");
      }
      throw new AppError("FETCH_FAILED", err instanceof Error ? err.message : String(err));
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new AppError("FETCH_FAILED", `redirect sem destino (${res.status})`);
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    return { res, finalUrl: url.toString() };
  }
  throw new AppError("FETCH_FAILED", "redirecionamentos demais");
}

async function fetchPage(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  const { res, finalUrl } = await safeGet(rawUrl, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", config.fetch.timeoutMs);
  if (res.status === 401 || res.status === 402) throw new AppError("PAYWALL", `HTTP ${res.status}`);
  if (res.status === 403 || res.status === 429 || res.status === 451) {
    throw new AppError("FETCH_BLOCKED", `HTTP ${res.status}`);
  }
  if (!res.ok) throw new AppError("FETCH_FAILED", `HTTP ${res.status}`);

  const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
  if (ctype.includes("application/pdf")) throw new AppError("URL_IS_PDF");
  if (ctype && !ctype.includes("html") && !ctype.includes("xml") && !ctype.includes("text/plain")) {
    throw new AppError("NOT_HTML", ctype);
  }
  const html = await readLimited(res, config.fetch.maxBytes);
  return { html, finalUrl };
}

/* ---------------------------------------------------------- imagens */

export interface ArticleImage {
  url: string;
  alt?: string;
  caption?: string;
}

/**
 * Imagens dentro do texto principal da matéria (já sem menus e anúncios,
 * graças ao Readability). Ignora ícones, imagens pequenas e formatos que a IA
 * não lê (ex.: SVG). Gráficos interativos (iframes) não são imagens e ficam de fora.
 */
export function collectArticleImages(articleHtml: string, baseUrl: string, max: number): ArticleImage[] {
  const dom = new JSDOM(`<body>${articleHtml}</body>`);
  const out: ArticleImage[] = [];
  const seen = new Set<string>();
  for (const img of Array.from(dom.window.document.querySelectorAll("img"))) {
    // srcset: pega a maior versão; data-src: imagens carregadas sob demanda
    const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
    const fromSet = srcset
      .split(",")
      .map((s) => s.trim().split(/\s+/))
      .filter((p) => p[0])
      .sort((a, b) => (parseInt(b[1] ?? "0") || 0) - (parseInt(a[1] ?? "0") || 0))[0]?.[0];
    const raw = fromSet || img.getAttribute("data-src") || img.getAttribute("src") || "";
    let url: string;
    try {
      url = new URL(raw, baseUrl).toString();
    } catch {
      continue;
    }
    if (!/^https?:/i.test(url) || /\.svg(\?|$)/i.test(url) || seen.has(url)) continue;
    const w = Number(img.getAttribute("width") ?? 0);
    const h = Number(img.getAttribute("height") ?? 0);
    if ((w && w < 200) || (h && h < 120)) continue; // ícones, avatares, pixels de rastreamento
    seen.add(url);
    const caption = img.closest("figure")?.querySelector("figcaption")?.textContent?.replace(/\s+/g, " ").trim();
    const alt = img.getAttribute("alt")?.replace(/\s+/g, " ").trim();
    out.push({ url, alt: alt || undefined, caption: caption?.slice(0, 300) || undefined });
    if (out.length >= max) break;
  }
  return out;
}

const IMAGE_TYPES = {
  "image/jpeg": (b: Buffer) => b[0] === 0xff && b[1] === 0xd8,
  "image/png": (b: Buffer) => b.subarray(0, 4).toString("hex") === "89504e47",
  "image/gif": (b: Buffer) => b.subarray(0, 4).toString("latin1") === "GIF8",
  "image/webp": (b: Buffer) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
} as const;
type ImageType = keyof typeof IMAGE_TYPES;

/**
 * Baixa uma imagem com as mesmas proteções das páginas. Confere o tipo pelo
 * conteúdo do arquivo (não só pelo que o site declara). Devolve null se falhar.
 */
export async function fetchImage(rawUrl: string): Promise<{ mediaType: ImageType; data: string } | null> {
  try {
    const { res } = await safeGet(rawUrl, "image/avif;q=0,image/webp,image/png,image/jpeg,image/gif;q=0.8", config.fetch.imageTimeoutMs);
    if (!res.ok) return null;
    const buf = await readBytes(res, config.fetch.maxImageBytes);
    const type = (Object.keys(IMAGE_TYPES) as ImageType[]).find((t) => IMAGE_TYPES[t](buf));
    return type ? { mediaType: type, data: buf.toString("base64") } : null;
  } catch {
    return null; // imagem é complemento: se não baixar, a análise segue sem ela
  }
}

/* ---------------------------------------------------------- extração */

const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "PRE", "FIGCAPTION", "DT", "DD"]);
/** Caixas genéricas: viram parágrafo só quando têm texto e nenhum bloco dentro. */
const CONTAINER_TAGS = new Set(["DIV", "SECTION", "ARTICLE", "MAIN", "ASIDE"]);

/** Uma linha de tabela vira "célula | célula | célula". */
function tableToParagraphs(table: Element): string[] {
  const out: string[] = [];
  const caption = table.querySelector("caption")?.textContent?.replace(/\s+/g, " ").trim();
  if (caption) out.push(`Tabela: ${caption}`);
  for (const row of Array.from(table.querySelectorAll("tr"))) {
    const cells = Array.from(row.children)
      .filter((c) => c.tagName === "TD" || c.tagName === "TH")
      .map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim());
    if (cells.some(Boolean)) out.push(cells.join(" | "));
  }
  return out;
}

/** Converte o HTML do artigo em texto, mantendo a separação de parágrafos e as linhas de tabela. */
export function htmlToParagraphs(html: string): string {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;
  const paragraphs: string[] = [];
  const walk = (el: Element) => {
    for (const node of Array.from(el.children)) {
      const isLeaf = !Array.from(node.querySelectorAll("*")).some((c) => BLOCK_TAGS.has(c.tagName) || c.tagName === "TABLE");
      if (node.tagName === "TABLE") {
        paragraphs.push(...tableToParagraphs(node));
      } else if (isLeaf && (BLOCK_TAGS.has(node.tagName) || CONTAINER_TAGS.has(node.tagName))) {
        // bloco "folha" (sem outros blocos dentro): vira um parágrafo
        const t = (node.textContent ?? "").replace(/\s+/g, " ").trim();
        if (t) paragraphs.push(t);
      } else {
        walk(node);
      }
    }
  };
  walk(body);
  if (paragraphs.length === 0) return (body.textContent ?? "").trim();
  return paragraphs.join("\n\n");
}

function meta(doc: Document, ...selectors: string[]): string | undefined {
  for (const sel of selectors) {
    const v = doc.querySelector(sel)?.getAttribute("content")?.trim();
    if (v) return v;
  }
  return undefined;
}

interface JsonLdInfo {
  section?: string;
  author?: string;
  publisher?: string;
  datePublished?: string;
  headline?: string;
  isAccessibleForFree?: boolean;
}

/** Lê os dados estruturados (JSON-LD) que muitos sites de notícia publicam. */
function readJsonLd(doc: Document): JsonLdInfo {
  const info: JsonLdInfo = {};
  const nameOf = (v: unknown): string | undefined => {
    if (!v) return undefined;
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.map(nameOf).filter(Boolean).join(", ") || undefined;
    if (typeof v === "object" && v && "name" in v) return String((v as { name: unknown }).name);
    return undefined;
  };
  for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const data = JSON.parse(script.textContent ?? "");
      const items: unknown[] = Array.isArray(data) ? data : data?.["@graph"] ?? [data];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const o = item as Record<string, unknown>;
        const type = String(o["@type"] ?? "");
        if (!/Article|NewsArticle|Report|BlogPosting|ScholarlyArticle|WebPage/i.test(type)) continue;
        info.author ??= nameOf(o.author);
        info.publisher ??= nameOf(o.publisher);
        info.datePublished ??= typeof o.datePublished === "string" ? o.datePublished : undefined;
        info.headline ??= typeof o.headline === "string" ? o.headline : undefined;
        if (!info.section) {
          const sec = Array.isArray(o.articleSection) ? o.articleSection[0] : o.articleSection;
          if (typeof sec === "string" && sec.trim()) info.section = sec.trim();
          else if (typeof o.genre === "string" && o.genre.trim()) info.section = o.genre.trim();
        }
        if (o.isAccessibleForFree === false || o.isAccessibleForFree === "False" || o.isAccessibleForFree === "false") {
          info.isAccessibleForFree = false;
        }
      }
    } catch {
      /* JSON-LD inválido: ignora */
    }
  }
  return info;
}

const PAYWALL_HINTS =
  /(assine para (ler|continuar)|conteúdo exclusivo para assinantes|já é assinante|subscribe to (read|continue)|subscribers only|this article is for subscribers|paywall)/i;

function formatDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 40);
  return d.toISOString().slice(0, 10);
}

export async function extractFromUrl(rawUrl: string): Promise<{ text: string; source: SourceInfo; images: ArticleImage[] }> {
  const { html, finalUrl } = await fetchPage(rawUrl);

  // Scripts e recursos externos ficam desligados (padrão do jsdom): só lemos o HTML.
  const virtualConsole = new VirtualConsole(); // silencia avisos de CSS inválido
  const dom = new JSDOM(html, { url: finalUrl, virtualConsole });
  const doc = dom.window.document;
  const ld = readJsonLd(doc);

  const article = new Readability(doc.cloneNode(true) as Document, { charThreshold: 300 }).parse();
  const body = normalizeText(article?.content ? htmlToParagraphs(article.content) : article?.textContent ?? "");
  const words = countWords(body);

  if (words < config.text.minWords) {
    if (ld.isAccessibleForFree === false || PAYWALL_HINTS.test(html)) throw new AppError("PAYWALL");
    throw new AppError("NO_ARTICLE", `${words} palavras`);
  }
  if (ld.isAccessibleForFree === false && words < 250) throw new AppError("PAYWALL");

  const title =
    article?.title?.trim() ||
    ld.headline ||
    meta(doc, 'meta[property="og:title"]', 'meta[name="twitter:title"]') ||
    doc.title?.trim() ||
    undefined;

  // O título entra no texto analisado (para a categoria "título vs. corpo"
  // e para que trechos do título possam ser destacados).
  let text = body;
  if (title && !body.slice(0, title.length + 20).includes(title)) {
    text = `${title}\n\n${body}`;
  }

  // Seção/editoria: metadados da página ou trechos típicos do endereço (/opiniao/, /colunas/...).
  const pathSection = /\/(opiniao|opinion|colunas?|columns?|colunistas|editorial|editoriais|analise|analysis|blogs?)\b/i.exec(
    new URL(finalUrl).pathname,
  )?.[1];
  const section =
    meta(doc, 'meta[property="article:section"]', 'meta[name="section"]', 'meta[name="article:section"]') ||
    ld.section ||
    (pathSection ? `${pathSection} (pelo endereço da página)` : undefined);

  const source: SourceInfo = {
    type: "url",
    url: finalUrl,
    title,
    section,
    author:
      article?.byline?.trim() ||
      ld.author ||
      meta(doc, 'meta[name="author"]', 'meta[property="article:author"]') ||
      undefined,
    outlet:
      article?.siteName?.trim() ||
      ld.publisher ||
      meta(doc, 'meta[property="og:site_name"]', 'meta[name="application-name"]') ||
      new URL(finalUrl).hostname.replace(/^www\./, ""),
    publishedAt: formatDate(
      article?.publishedTime ||
        ld.datePublished ||
        meta(doc, 'meta[property="article:published_time"]', 'meta[name="date"]', 'meta[itemprop="datePublished"]'),
    ),
  };

  dom.window.close();
  // Imagens dentro da matéria (para a etapa "Imagens e gráficos").
  const images = article?.content ? collectArticleImages(article.content, finalUrl, config.visual.maxUrlImages) : [];
  return { text, source, images };
}
