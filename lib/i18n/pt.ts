/**
 * ============================================================================
 *  TEXTOS DO SITE EM PORTUGUÊS
 * ============================================================================
 *  Todos os textos da interface ficam aqui (o equivalente em inglês está em
 *  en.ts). Para mudar uma frase, edite o texto entre aspas.
 *  Alguns itens são pequenas funções, como (n) => `${n} palavras`: edite só
 *  o texto entre as crases (`), sem mexer no ${n}.
 * ============================================================================
 */

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const num = (n: number) => n.toLocaleString("pt-BR");

export const pt = {
  meta: {
    title: "unslant: descubra os vieses de um texto",
    description:
      "Envie um link, texto, PDF ou afirmação e veja os vieses que ele contém, com trechos do próprio texto como evidência.",
  },

  nav: {
    home: "unslant, página inicial",
    methodology: "Metodologia",
    glossary: "Tipos de viés",
    privacy: "Privacidade",
    about: "Quem somos",
    menu: "Menu do site",
    otherLanguage: "English",
    otherLanguageAria: "Read this site in English",
    login: "Entrar",
    account: "Minha conta",
    myAnalyses: "Minhas análises",
    logout: "Sair",
  },

  login: {
    title: "Entrar",
    lede: "Sem senha: digite seu e-mail e enviamos um link de acesso. Na primeira vez, sua conta é criada automaticamente.",
    email: "Seu e-mail",
    submit: "Enviar link de acesso",
    sending: "Enviando…",
    sent: (email: string) => `Pronto! Enviamos um link para ${email}. Abra o e-mail e clique no link para entrar, neste mesmo navegador (confira também a caixa de spam).`,
    error: "Não foi possível enviar o link agora. Confira o e-mail digitado e tente de novo em alguns minutos.",
    linkError: "O link de acesso é inválido, já expirou ou foi aberto em outro navegador. Peça um novo abaixo e abra o link neste mesmo navegador.",
    unavailable: "O login ainda não está disponível neste site.",
    why: "Com uma conta, você tem 3 análises simples e 1 detalhada por dia, e suas análises ficam guardadas em \"Minhas análises\".",
  },

  footer: {
    disclaimer:
      "O unslant usa inteligência artificial, que também pode ter vieses e errar. Leia a análise como um ponto de partida para pensar, não como veredito.",
  },

  home: {
    title: "Veja como um texto tenta convencer você.",
    intro:
      "Envie uma notícia, um artigo de opinião, um paper ou uma afirmação que você ouviu por aí. O unslant aponta vieses de linguagem, fontes, dados e lógica, sempre com o trecho exato como prova, e mostra a inclinação política quando ela existe.",
    tabsLabel: "Tipo de conteúdo",
    tabs: { url: "Link", text: "Texto", pdf: "PDF", claim: "Afirmação" },
    url: {
      label: "Link da matéria ou artigo",
      help: "Alguns sites bloqueiam leitura automática ou têm paywall. Nesses casos, copie o texto e use a aba Texto.",
    },
    text: {
      label: "Texto para analisar",
      placeholder: "Cole aqui o texto completo, de preferência com o título na primeira linha.",
      empty: "Mínimo de 80 palavras.",
      count: (n: number, min: number) =>
        `${num(n)} ${plural(n, "palavra", "palavras")}${n < min ? ` (mínimo de ${min})` : ""}`,
    },
    pdf: {
      label: "Arquivo PDF (artigos e papers)",
      choose: "Escolher arquivo",
      dropHelp: "ou arraste o PDF para cá. O arquivo é lido no seu navegador.",
      reading: (name: string) => `Lendo ${name}…`,
      extracted: (n: number) => `(${num(n)} palavras extraídas)`,
      figures: (n: number) => `${n === 1 ? "1 página com figura ou tabela será analisada" : `${n} páginas com figuras ou tabelas serão analisadas`} também como imagem.`,
      notPdf: "Esse arquivo não é um PDF.",
    },
    claim: {
      label: "Afirmação para analisar",
      placeholder: "Ex.: Os jovens de hoje não querem mais trabalhar.",
      help: "Uma frase ou um parágrafo curto: algo que você ouviu, leu num grupo ou viu nas redes.",
      contextLabel: "Onde você viu ou ouviu isso? (opcional)",
      contextPlaceholder: "Ex.: grupo de família, vídeo nas redes, fala de um político",
      examplesLabel: "Experimente:",
      count: (n: number) => `${num(n)} ${plural(n, "palavra", "palavras")} (de 3 a 300)`,
    },
    submit: "Analisar",
    view: {
      label: "Tipo de análise",
      simple: { title: "Simples", desc: "O essencial: nota, inclinação e os 3 principais problemas, em linguagem do dia a dia." },
      detailed: { title: "Detalhada", desc: "Tudo: todas as categorias, o texto com os trechos destacados, imagens e fontes." },
      help: "As duas usam a mesma análise completa; muda o que você vê.",
      needsLogin: "Para a detalhada, entre com seu e-mail (sem senha).",
      remaining: (s: number, d: number) => `Hoje você ainda tem ${s} ${s === 1 ? "análise simples" : "análises simples"} e ${d} ${d === 1 ? "detalhada" : "detalhadas"}.`,
      remainingAnon: (s: number): string => (s > 0 ? "Sem conta: 1 análise simples a cada 24 horas. Entre (sem senha) para ter 3 simples e 1 detalhada por dia." : "Você já usou a análise grátis das últimas 24 horas. Entre (sem senha) para ter 3 simples e 1 detalhada por dia."),
    },
    genre: {
      label: "Tipo de texto",
      auto: "Detectar automaticamente",
      help: "Se você souber, escolha. Senão, a IA identifica e explica o motivo.",
    },
    reportLanguage: "O relatório sai em português. Para receber em inglês, mude o idioma no topo da página.",
    examples: {
      title: "Sem um texto em mãos?",
      demoTitle: "Ver uma análise pronta",
      demoDesc: "Notícia fictícia sobre corte na saúde. Grátis, sem usar a IA.",
      demoClaimTitle: "Ver uma afirmação analisada",
      demoClaimDesc: "\"Os jovens de hoje não querem mais trabalhar…\" Grátis, sem usar a IA.",
      hint: "Ou carregue um texto de exemplo (fictício) na aba Texto. Analisar esses textos usa a IA normalmente.",
      downloadPdf: "Baixar o paper em PDF",
    },
    unexpectedError: "Ocorreu um erro inesperado. Tente de novo.",
    networkError: "Sem conexão com o servidor. Confira sua internet e tente de novo.",
  },

  progress: {
    title: "Analisando",
    duration: "Costuma levar entre 30 segundos e 2 minutos.",
    steps: {
      extracting: { label: "Extraindo o texto", detail: "Separando o texto principal de menus e anúncios." },
      context: { label: "Identificando o contexto", detail: "Tipo de texto, país e cenário político." },
      analyzing: { label: "Analisando os vieses", detail: "Linguagem, fontes, dados, falácias e mais, ao mesmo tempo." },
      synthesizing: { label: "Escrevendo o resumo", detail: "Juntando os achados e conferindo cada trecho citado." },
      balancing: {
        label: "Buscando textos para equilibrar",
        detail: "Procurando outras coberturas do assunto na web e escrevendo o resumo.",
      },
    },
    doneCount: (done: number, total: number) => `${done} de ${total} aspectos concluídos`,
    note: {
      long: "Texto longo: a análise é feita em etapas para respeitar o limite de uso da IA. Pode levar alguns minutos.",
      waiting: "Aguardando o limite de uso por minuto da IA liberar. A análise continua sozinha em instantes.",
    },
    state: { done: "concluído", active: "em andamento", pending: "aguardando" },
    cancel: "Cancelar análise",
  },

  result: {
    newAnalysis: "Nova análise",
    demoNote: "Exemplo pronto: resultado preparado à mão, sem usar a IA.",
    cacheNote: "Este texto já tinha sido analisado com a mesma versão. Mostrando o resultado guardado.",
    reanalyze: "Analisar de novo",
    reanalyzeCost: "(custa como uma análise nova)",
    openOriginal: "Abrir a página original",
    untitled: "Texto analisado",
    claimHeading: "Afirmação analisada",
    typeReason: (type: string) => `Por que "${type}": `,
    typeByUser: "Tipo informado por você.",
    claimSeenAt: "Vista ou ouvida em:",
    summaryTitle: "Resumo da análise",
    contextConsidered: "Contexto considerado: ",
    languageNote: (lang: string) => `Este resultado foi gerado em ${lang}.`,

    score: {
      srTitle: "Nota geral de viés",
      outOf: "de 10",
      naNote: (n: number) =>
        `${n} ${plural(n, "categoria não se aplica", "categorias não se aplicam")} a este texto e ${plural(n, "ficou", "ficaram")} fora da nota.`,
      explanation:
        "A nota mede o quanto o texto é enviesado de forma geral (linguagem, fontes, dados, lógica…), não só politicamente. 0 é um texto equilibrado; 10, uma distorção grave.",
    },

    mode: { label: "Modo de exibição", simple: "Simples", detailed: "Detalhado" },
    unlock: {
      use: "Usar minha análise detalhada de hoje",
      working: "Liberando…",
      useHelp: (n: number) => `A análise completa já foi feita: não chama a IA de novo. ${n === 1 ? "Resta 1 análise detalhada" : `Restam ${n} análises detalhadas`} hoje.`,
      usedUp: "Você já usou a análise detalhada de hoje. Ela volta amanhã, à meia-noite no seu horário.",
      signIn: "Entrar para ver a análise completa",
      signInWhy: "Sem senha: é só o seu e-mail. Com conta, você tem 3 análises simples e 1 detalhada por dia.",
    },
    simple: {
      politicalTitle: "Inclinação política",
      favors: (side: string, how: string) => `Favorece ${how} ${side}`,
      strength: { slight: "levemente", moderate: "moderadamente", strong: "fortemente" },
      balanced: "Trata os lados da disputa de forma equilibrada",
      axis: (axis: string, pos: string) => `${axis}: ${pos.toLowerCase()}`,
      noLeaning: "Nenhuma inclinação política identificada.",
      problemsTitle: "Principais problemas",
      noProblems: "Nenhum problema relevante encontrado.",
      seeAll: "Ver análise completa",
      seeAllHelp: "Todas as categorias, o texto inteiro com os trechos destacados, imagens e fontes.",
    },
    axes: {
      title: "Inclinação política",
      countryNote: (country: string) => `Avaliada segundo o espectro político do país do texto (${country}). `,
      unidentifiedNote: "“Não identificado” significa que o texto não dá evidência suficiente.",
      economic: { name: "Econômico", help: "Estado e mercado" },
      social: { name: "Social", help: "Costumes e valores" },
      dispute: {
        name: "Favorece qual lado da disputa",
        help: "Governo × oposição, candidatos",
        favors: (side: string) => `Favorece ${side}`,
        strength: { slight: "(levemente)", moderate: "(moderadamente)", strong: "(fortemente)" },
        balanced: "Equilibrado",
        unidentified: "Não identificado",
        notApplicable: "Não se aplica: o texto não trata de uma disputa entre lados políticos.",
      },
    },

    factOpinion: {
      title: "Fato e opinião",
      aria: (fact: number) => `Cerca de ${fact}% de fatos e ${100 - fact}% de opinião`,
      facts: "fatos verificáveis",
      opinion: "opinião e interpretação",
    },

    groups: {
      title: "Onde o texto pesa",
      description: "Nota de cada aspecto, de 0 (sem problema) a 10. Clique num aspecto para ver os detalhes.",
      notApplicable: "não se aplica",
      radarAria: "Gráfico de radar com a nota de cada aspecto",
    },

    text: {
      title: "O texto, com os trechos destacados",
      titleClaim: "A afirmação, com os trechos destacados",
      count: (n: number) =>
        `${n} ${plural(n, "trecho foi apontado", "trechos foram apontados")}. Clique num destaque para ver o motivo.`,
      none: "Nenhum trecho foi apontado como problemático.",
      countFiltered: (shown: number, total: number) =>
        `Mostrando ${shown} ${plural(shown, "trecho moderado ou forte", "trechos moderados ou fortes")} de ${total}. Clique num destaque para ver o motivo.`,
      showAll: (n: number) => `Mostrar todos os trechos (${n})`,
      showStrong: "Mostrar só moderados e fortes",
      legendAria: "Legenda das cores",
      legend: { low: "leve", mid: "moderado ou acentuado", high: "forte ou muito forte" },
      asideHint: "Clique num trecho destacado para ver que tipo de viés ele indica e por quê.",
      detailsOne: "O que este trecho indica",
      detailsMany: (n: number) => `Este trecho aparece em ${n} categorias`,
      close: "Fechar",
      dialogAria: "Detalhes do trecho",
      markAria: (slice: string, names: string) => `${slice}. Trecho destacado: ${names}`,
    },

    omissions: {
      title: "O que o texto pode estar omitindo",
      titleClaim: "O que essa afirmação deixa de fora",
      none: "Nenhuma omissão relevante foi identificada.",
    },

    figures: {
      title: "Imagens e gráficos",
      intro: (n: number) =>
        `A IA examinou ${n === 1 ? "1 imagem" : `${n} imagens`} do conteúdo (gráficos, tabelas, fotos) e comparou com o que o texto diz.`,
      noIssues: "Nenhum problema encontrado nesta imagem.",
      hidden: (n: number) => `${n === 1 ? "1 imagem decorativa ou sem relação com o assunto foi omitida" : `${n} imagens decorativas ou sem relação com o assunto foram omitidas`}.`,
    },

    rewrite: {
      title: "Como ficaria mais neutro",
      original: "Trecho original",
      suggested: "Versão neutra sugerida",
      show: "Ver o trecho no texto",
      none: "Nenhum trecho precisa de reescrita: os problemas encontrados estão em falas citadas ou são leves.",
    },

    claim: {
      title: "Verificação da afirmação",
      type: "Tipo",
      verifiability: "Dá para verificar?",
      assessment: "O que as evidências indicam",
      whatIsKnown: "O que se sabe",
      origins: "Por que essa ideia circula",
      howToVerify: "Como conferir",
      moreAccurate: "Uma versão mais precisa",
      disclaimer:
        "Esta verificação usa o conhecimento geral da IA, que tem data de corte e pode errar. Ela não consulta fontes em tempo real. Confira nas fontes sugeridas antes de compartilhar.",
    },

    balance: {
      title: "Para equilibrar sua leitura",
      titleClaim: "Onde conferir essa afirmação",
      intro: "Textos reais encontrados na web, de outros veículos e perspectivas. Conferimos que cada link veio de fato da busca.",
      introClaim: "Fontes reais encontradas na web para você conferir a afirmação. Conferimos que cada link veio de fato da busca.",
      perspective: "Perspectiva",
      opensNewTab: "(abre em nova aba)",
      line: "Linha editorial",
      estimated: "estimativa",
      lineSource: "fonte",
      suggestionsTitle: "Outras sugestões",
      none: "A busca não encontrou textos confiáveis sobre o assunto. Veja as sugestões abaixo.",
      unavailable: "Não foi possível fazer a busca na web desta vez. O restante da análise não foi afetado.",
      demo: "Nos exemplos prontos a busca na web não é feita. Numa análise real, aqui aparecem textos de outros veículos e perspectivas sobre o mesmo assunto, com links.",
    },

    details: {
      title: "Todas as categorias",
      description: "Cada categoria com nota, nível de confiança e os trechos que sustentam o apontamento.",
      groupNotApplicable: "Não se aplica a este texto",
      groupNoProblems: "Nenhum problema encontrado",
      groupFound: (found: number, total: number) => `${found} de ${total} categorias com problemas`,
      status: {
        none_found: "Sem problemas encontrados",
        not_applicable: "Não se aplica a este texto",
      },
      showInText: "Ver no texto",
      showFigure: "Ver a imagem",
      discarded: (n: number) =>
        `${n === 1 ? "1 trecho citado pela IA foi descartado" : `${n} trechos citados pela IA foram descartados`} por não existir no texto original.`,
    },

    stats: {
      aria: "Informações técnicas da análise",
      model: "Modelos: ",
      cost: "Custo estimado: ",
      costCached: (cost: string) => `US$ 0 (resultado guardado · a análise original custou US$ ${cost})`,
      version: "Versão da análise: ",
      time: "Tempo: ",
      discarded: "Trechos descartados: ",
      searches: "Buscas na web: ",
      parts: (n: number) => `O texto foi dividido em ${n} partes e os resultados foram consolidados.`,
      demoModel: "exemplo pronto (sem IA)",
    },
  },

  labels: {
    contentType: {
      news: "Notícia",
      feature: "Reportagem",
      editorial: "Editorial",
      opinion: "Opinião",
      analysis: "Análise",
      academic_paper: "Artigo acadêmico",
      press_release: "Comunicado de imprensa",
      blog: "Blog",
      other: "Outro tipo de texto",
      claim: "Afirmação",
    },
    confidence: { low: "confiança baixa", medium: "confiança média", high: "confiança alta" },
    position: { left: "Esquerda", right: "Direita", unidentified: "Não identificado", not_applicable: "Não se aplica" },
    claimType: {
      factual: "Afirmação de fato",
      opinion: "Opinião",
      prediction: "Previsão",
      value_judgment: "Juízo de valor",
      mixed: "Mistura de fato e opinião",
    },
    verifiability: {
      verifiable: "Sim",
      partially_verifiable: "Em parte",
      not_verifiable: "Não",
    },
    assessment: {
      consistent: "Bate com as evidências",
      partially_consistent: "Tem fundo de verdade, mas exagera ou simplifica",
      inconsistent: "Contradiz as evidências",
      insufficient_evidence: "Evidência insuficiente para afirmar",
      not_applicable: "É opinião: não se verifica como verdadeiro ou falso",
    },
    languageName: { pt: "português", en: "inglês" },
    figureKind: {
      chart: "gráfico",
      table: "tabela",
      photo: "foto",
      illustration: "ilustração",
      diagram: "diagrama",
      map: "mapa",
      infographic: "infográfico",
      other: "imagem",
    },
    stage: {
      identificação: "identificação",
      especialistas: "especialistas",
      "visão geral": "visão geral",
      verificação: "verificação",
      imagens: "imagens",
      síntese: "síntese",
      busca: "busca",
      "formatar busca": "busca",
    } as Record<string, string>,
    editorialLine: {
      left: "esquerda",
      center_left: "centro-esquerda",
      center: "centro",
      center_right: "centro-direita",
      right: "direita",
      institutional: "oficial",
      legal: "jurídico",
      fact_check: "checagem",
      academic: "acadêmico",
      wire: "agência de notícias",
      international: "internacional",
      unknown: "não classificada",
    },
  },
};

export type Dict = typeof pt;
