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

async function readLimited(res: UndiciResponse, maxBytes: number): Promise<string> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new AppError("FETCH_TOO_LARGE");
  if (!res.body) return "";
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
  const buf = Buffer.concat(chunks);
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

async function fetchPage(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  let url = await assertPublicUrl(rawUrl);
  for (let hop = 0; hop <= config.fetch.maxRedirects; hop++) {
    let res: UndiciResponse;
    try {
      res = await undiciFetch(url, {
        redirect: "manual", // seguimos os redirecionamentos à mão, conferindo cada destino
        signal: AbortSignal.timeout(config.fetch.timeoutMs),
        // Em testes locais (UNSLANT_ALLOW_LOCAL_URLS) a conferência na conexão é desligada.
        dispatcher: allowLocal() ? undefined : safeAgent,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
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
    return { html, finalUrl: url.toString() };
  }
  throw new AppError("FETCH_FAILED", "redirecionamentos demais");
}

/* ---------------------------------------------------------- extração */

const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "PRE", "FIGCAPTION", "TD", "DT", "DD"]);

/** Converte o HTML do artigo em texto, mantendo a separação de parágrafos. */
function htmlToParagraphs(html: string): string {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;
  const paragraphs: string[] = [];
  const walker = dom.window.document.createTreeWalker(body, dom.window.NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as Element | null;
  while (node) {
    if (BLOCK_TAGS.has(node.tagName)) {
      // evita duplicar parágrafos aninhados (ex.: <li><p>…</p></li>)
      const hasBlockChild = Array.from(node.querySelectorAll("*")).some((c) => BLOCK_TAGS.has(c.tagName));
      if (!hasBlockChild) {
        const t = (node.textContent ?? "").replace(/\s+/g, " ").trim();
        if (t) paragraphs.push(t);
      }
    }
    node = walker.nextNode() as Element | null;
  }
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

export async function extractFromUrl(rawUrl: string): Promise<{ text: string; source: SourceInfo }> {
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
  return { text, source };
}
