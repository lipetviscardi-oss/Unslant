/**
 * ============================================================================
 *  CONFIGURAÇÕES GERAIS DO UNSLANT
 * ============================================================================
 *  Este arquivo reúne os números que você pode ajustar sem mexer no resto do
 *  código: modelo de IA, limites de uso, tamanhos de texto e preços.
 *
 *  Dica: depois de alterar algo aqui, salve o arquivo. Se o site estiver
 *  rodando no seu computador (npm run dev), ele recarrega sozinho.
 * ============================================================================
 */

export const config = {
  /** Configurações da IA. */
  ai: {
    /**
     * QUAL IA USAR:
     *   "gemini"    = Google Gemini, plano GRÁTIS. Só para testes: o Google pode
     *                 usar os textos enviados para melhorar os modelos dele.
     *   "anthropic" = Claude (versão final do site). Precisa de créditos.
     * Para trocar, mude a palavra abaixo e coloque a chave correspondente no
     * .env.local (GEMINI_API_KEY ou ANTHROPIC_API_KEY). Veja o README.
     */
    provider: "anthropic" as AiProvider,

    /** Modelo usado por cada IA (o principal faz a análise em si). */
    models: {
      anthropic: "claude-sonnet-5-5",
      gemini: "gemini-3.8-flash",
    },

    /**
     * Só Anthropic: modelo mais barato para tarefas simples (resumo final e
     * organização da busca). ~20x mais barato que o principal.
     * A identificação fica no modelo principal de propósito: ela é a primeira
     * chamada e "aquece" o cache do texto para os especialistas.
     */
    lightModel: "claude-haiku-5-5",

    /**
     * Especialistas agrupados: cada linha vira UMA chamada à IA que analisa
     * vários grupos da taxonomia de uma vez (mais barato e mais rápido do que
     * uma chamada por grupo). Grupos que não se aplicam ao texto são pulados.
     */
    specialistBundles: [
      ["language", "framing", "emotional"],
      ["sources", "omission", "fact_opinion"],
      ["data", "fallacies", "interests"],
      ["representation", "cognitive", "academic"],
    ],

    /**
     * "Esforço" de raciocínio de cada etapa: "low" | "medium" | "high".
     * Mais esforço = análise mais cuidadosa, porém mais lenta e mais cara.
     */
    effort: {
      triage: "low", // identificar tipo de texto, país e contexto
      specialist: "medium", // cada "especialista" (linguagem, fontes, dados...)
      overview: "medium", // inclinação política, fato x opinião, omissões
      synthesis: "low", // resumo final e sugestão de reescrita
      claimCheck: "medium", // verificação de afirmações
    },

    /** Limite de tamanho da resposta de cada etapa (em "tokens"; 1 token ≈ 3/4 de palavra). */
    maxTokens: {
      triage: 4_000,
      specialist: 20_000,
      overview: 12_000,
      synthesis: 8_000,
      claimCheck: 8_000,
    },

    /**
     * Quantas chamadas à IA podem acontecer ao mesmo tempo.
     * Anthropic: 8 permite rodar todas as etapas de uma vez (se a sua conta
     * receber erros de limite, diminua para 4).
     * Gemini grátis: aceita poucas chamadas por minuto; 1 evita bloqueios.
     */
    maxParallelRequests: { anthropic: 8, gemini: 1 },

    /**
     * Só Anthropic: se a IA recusar um texto por motivo de segurança, tenta
     * automaticamente com outro modelo (recurso "fallback"). Recomendado: true.
     */
    useRefusalFallback: true,

    /** Máximo de trechos de evidência por categoria (os mais representativos). */
    maxEvidencePerCategory: 2,
  },

  /** Limites de tamanho dos textos analisados (em palavras). */
  text: {
    /** Abaixo disso, o texto é curto demais para uma análise útil. */
    minWords: 80,
    /** Acima disso, o texto é recusado (protege contra custos altos). */
    maxWords: 60_000,
    /**
     * Textos maiores que isso são divididos em partes, analisados parte a
     * parte e depois consolidados. Quase todo artigo e paper cabe em uma parte.
     */
    maxWordsPerPart: 30_000,
    /** Limites para a aba "Afirmação" (frases curtas). */
    claimMinWords: 3,
    claimMaxWords: 300,
  },

  /** Busca na web: seção "Para equilibrar sua leitura". */
  balance: {
    /** Liga ou desliga a busca (false = a seção não aparece e não há custo de busca). */
    enabled: true,
    /** Máximo de buscas na web por análise (cada busca custa cerca de US$ 0,01). */
    maxSearches: 3,
    /** Máximo de textos recomendados. */
    maxArticles: 5,
    effort: "medium" as const,
    maxTokens: 12_000,
    /**
     * true = a busca usa o modelo mais barato (config.ai.lightModel, Haiku).
     * Se a conta não aceitar, o site volta sozinho para o modelo principal.
     */
    useLightModel: true,
  },

  /** Download de páginas (aba "Link"). */
  fetch: {
    timeoutMs: 15_000,
    maxBytes: 5 * 1024 * 1024, // 5 MB
    maxRedirects: 5,
  },

  /** Proteções contra gastos inesperados. */
  limits: {
    /**
     * Máximo de análises novas por dia no site inteiro (todos os usuários
     * somados). Análises repetidas que vêm do cache não contam.
     * Na Fase 4 isso passa a ser controlado pelo banco de dados.
     */
    globalDailyAnalyses: 30,
  },

  /**
   * Cache: guarda o resultado de textos já analisados para não pagar duas
   * vezes pela mesma análise. Durante o desenvolvimento, fica na pasta .cache/.
   */
  cache: {
    enabled: true,
  },

  /**
   * Preços da Anthropic em dólares por 1 milhão de tokens.
   * Usados só para ESTIMAR o custo de cada análise e mostrar na tela.
   * Confira os valores atuais em https://www.anthropic.com/pricing
   */
  pricing: {
    "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
    "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01 },
  } as Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }>,
  /** Preço de cada busca na web, em dólares (US$ 10 a cada 1.000 buscas). */
  webSearchPrice: 0.01,
} as const;

export type Effort = "low" | "medium" | "high";
export type AiProvider = "anthropic" | "gemini";

/** Modelo da IA escolhida em config.ai.provider. */
export function activeModel(): string {
  return config.ai.models[config.ai.provider];
}

/** Nome legível do modelo, para mostrar no site. */
export function activeModelName(): string {
  const names: Record<string, string> = {
    "claude-sonnet-5-5": "Claude Sonnet 5.5 (Anthropic)",
    "gemini-3.8-flash": "Gemini 3.8 Flash (Google)",
  };
  return names[activeModel()] ?? activeModel();
}
