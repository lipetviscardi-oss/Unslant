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
  /** Configurações da IA (Anthropic). */
  ai: {
    /** Modelo usado em todas as etapas da análise. */
    model: "claude-sonnet-5-5",

    /**
     * "Esforço" de raciocínio de cada etapa: "low" | "medium" | "high".
     * Mais esforço = análise mais cuidadosa, porém mais lenta e mais cara.
     */
    effort: {
      triage: "low", // identificar tipo de texto, país e contexto
      specialist: "medium", // cada "especialista" (linguagem, fontes, dados...)
      overview: "medium", // inclinação política, fato x opinião, omissões
      synthesis: "low", // resumo final e sugestão de reescrita
    },

    /** Limite de tamanho da resposta de cada etapa (em "tokens"; 1 token ≈ 3/4 de palavra). */
    maxTokens: {
      triage: 4_000,
      specialist: 16_000,
      overview: 12_000,
      synthesis: 8_000,
    },

    /**
     * Quantas chamadas à IA podem acontecer ao mesmo tempo.
     * Contas novas da Anthropic têm limites baixos; 4 é um valor seguro.
     */
    maxParallelRequests: 4,

    /**
     * Se a IA recusar um texto por motivo de segurança, tenta automaticamente
     * com outro modelo da Anthropic (recurso "fallback"). Recomendado: true.
     */
    useRefusalFallback: true,

    /** Máximo de trechos de evidência por categoria (os mais representativos). */
    maxEvidencePerCategory: 4,
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
  } as Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }>,
} as const;

export type Effort = "low" | "medium" | "high";
