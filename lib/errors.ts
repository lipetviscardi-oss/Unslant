/**
 * Erros conhecidos do unslant, com mensagens claras para o usuário.
 * Para mudar o texto de uma mensagem, edite ERROR_MESSAGES abaixo.
 */

import type { Lang } from "@/lib/taxonomy";

export type ErrorCode =
  | "INVALID_INPUT"
  | "URL_INVALID"
  | "URL_FORBIDDEN"
  | "FETCH_BLOCKED"
  | "FETCH_FAILED"
  | "FETCH_TIMEOUT"
  | "FETCH_TOO_LARGE"
  | "NOT_HTML"
  | "URL_IS_PDF"
  | "PAYWALL"
  | "NO_ARTICLE"
  | "TEXT_TOO_SHORT"
  | "TEXT_TOO_LONG"
  | "PDF_INVALID"
  | "PDF_SCANNED"
  | "MISSING_API_KEY"
  | "AI_AUTH"
  | "AI_NO_CREDIT"
  | "AI_RATE_LIMIT"
  | "AI_OVERLOADED"
  | "AI_REFUSAL"
  | "AI_BAD_RESPONSE"
  | "AI_ERROR"
  | "DAILY_LIMIT"
  | "UNKNOWN";

export const ERROR_MESSAGES: Record<ErrorCode, Record<Lang, string>> = {
  INVALID_INPUT: {
    pt: "Não entendi o que foi enviado. Tente novamente.",
    en: "We couldn't understand the request. Please try again.",
  },
  URL_INVALID: {
    pt: "Esse link não parece válido. Ele deve começar com http:// ou https://.",
    en: "That link doesn't look valid. It should start with http:// or https://.",
  },
  URL_FORBIDDEN: {
    pt: "Por segurança, não acessamos endereços internos ou locais. Use um link público.",
    en: "For security reasons we don't access internal or local addresses. Please use a public link.",
  },
  FETCH_BLOCKED: {
    pt: "O site bloqueou o acesso automático à página. Copie o texto da matéria e cole na aba \"Texto\".",
    en: "The website blocked automated access. Copy the article text and paste it in the \"Text\" tab.",
  },
  FETCH_FAILED: {
    pt: "Não conseguimos abrir essa página. Confira o link ou cole o texto na aba \"Texto\".",
    en: "We couldn't open that page. Check the link or paste the text in the \"Text\" tab.",
  },
  FETCH_TIMEOUT: {
    pt: "A página demorou demais para responder. Tente de novo ou cole o texto na aba \"Texto\".",
    en: "The page took too long to respond. Try again or paste the text in the \"Text\" tab.",
  },
  FETCH_TOO_LARGE: {
    pt: "Essa página é grande demais para ser baixada. Cole só o texto da matéria na aba \"Texto\".",
    en: "That page is too large to download. Paste just the article text in the \"Text\" tab.",
  },
  NOT_HTML: {
    pt: "Esse link não leva a uma página de texto. Use o link de uma matéria ou artigo.",
    en: "That link doesn't lead to a text page. Use the link to an article.",
  },
  URL_IS_PDF: {
    pt: "Esse link é de um arquivo PDF. Baixe o arquivo e envie pela aba \"PDF\".",
    en: "That link points to a PDF. Download it and upload it in the \"PDF\" tab.",
  },
  PAYWALL: {
    pt: "A matéria parece estar atrás de um paywall (conteúdo para assinantes). Se você tem acesso, copie o texto e cole na aba \"Texto\".",
    en: "The article seems to be behind a paywall. If you have access, copy the text and paste it in the \"Text\" tab.",
  },
  NO_ARTICLE: {
    pt: "Não encontramos o texto principal nessa página. Ela pode ser uma página inicial ou carregar o texto de um jeito que não conseguimos ler. Cole o texto na aba \"Texto\".",
    en: "We couldn't find the main text on that page. Paste the text in the \"Text\" tab instead.",
  },
  TEXT_TOO_SHORT: {
    pt: "O texto é curto demais para uma análise útil. Envie pelo menos um parágrafo completo (cerca de 80 palavras).",
    en: "The text is too short for a useful analysis. Please send at least a full paragraph (about 80 words).",
  },
  TEXT_TOO_LONG: {
    pt: "O texto é longo demais para uma análise. Envie uma parte menor (o limite atual está em lib/config.ts).",
    en: "The text is too long to analyze. Please send a shorter part.",
  },
  PDF_INVALID: {
    pt: "Não conseguimos abrir esse PDF. Ele pode estar corrompido ou protegido por senha.",
    en: "We couldn't open that PDF. It may be corrupted or password-protected.",
  },
  PDF_SCANNED: {
    pt: "Esse PDF parece ser uma imagem escaneada, sem texto selecionável. Tente um PDF com texto ou cole o texto na aba \"Texto\".",
    en: "This PDF looks like a scanned image with no selectable text. Try a text-based PDF or paste the text.",
  },
  MISSING_API_KEY: {
    pt: "A chave da Anthropic não está configurada. Siga a seção \"Chave da Anthropic\" do README, ou experimente o exemplo pronto, que não precisa de chave.",
    en: "The Anthropic API key is not configured. See the README, or try the ready-made example, which needs no key.",
  },
  AI_AUTH: {
    pt: "A chave da Anthropic foi recusada. Confira se ela foi copiada inteira para o arquivo .env.local.",
    en: "The Anthropic API key was rejected. Check that it was copied completely into .env.local.",
  },
  AI_NO_CREDIT: {
    pt: "A conta da Anthropic está sem créditos. Adicione créditos em console.anthropic.com (Billing).",
    en: "The Anthropic account is out of credits. Add credits at console.anthropic.com (Billing).",
  },
  AI_RATE_LIMIT: {
    pt: "Muitas análises ao mesmo tempo. Espere um minuto e tente de novo.",
    en: "Too many analyses at once. Wait a minute and try again.",
  },
  AI_OVERLOADED: {
    pt: "O serviço de IA está sobrecarregado no momento. Tente de novo em alguns minutos.",
    en: "The AI service is overloaded right now. Please try again in a few minutes.",
  },
  AI_REFUSAL: {
    pt: "A IA se recusou a analisar este texto por regras de segurança. Isso é raro; tente outro texto.",
    en: "The AI declined to analyze this text due to safety rules. This is rare; try another text.",
  },
  AI_BAD_RESPONSE: {
    pt: "A IA respondeu num formato inesperado, mesmo depois de uma nova tentativa. Tente de novo.",
    en: "The AI responded in an unexpected format, even after retrying. Please try again.",
  },
  AI_ERROR: {
    pt: "Algo deu errado ao falar com a IA. Tente de novo em instantes.",
    en: "Something went wrong talking to the AI. Please try again shortly.",
  },
  DAILY_LIMIT: {
    pt: "O limite diário de análises do site foi atingido (proteção contra gastos). Tente amanhã ou aumente o limite em lib/config.ts.",
    en: "The site's daily analysis limit was reached. Try again tomorrow.",
  },
  UNKNOWN: {
    pt: "Ocorreu um erro inesperado. Tente de novo.",
    en: "An unexpected error occurred. Please try again.",
  },
};

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    /** Detalhe técnico (só aparece no terminal, nunca na tela). */
    public detail?: string,
  ) {
    super(`${code}${detail ? `: ${detail}` : ""}`);
    this.name = "AppError";
  }
}

export function errorMessage(code: string, lang: Lang = "pt") {
  const entry = ERROR_MESSAGES[code as ErrorCode] ?? ERROR_MESSAGES.UNKNOWN;
  return entry[lang];
}
