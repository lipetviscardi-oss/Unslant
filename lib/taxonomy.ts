/**
 * ============================================================================
 *  TAXONOMIA DE VIESES DO UNSLANT
 * ============================================================================
 *  Aqui ficam TODAS as categorias de viés que a IA analisa, organizadas em
 *  grupos. Você pode editar, adicionar ou remover categorias livremente.
 *
 *  COMO ADICIONAR UMA CATEGORIA:
 *    1. Escolha o grupo (ex.: "language").
 *    2. Copie um bloco { id: ..., name: ..., ... } de dentro de "categories".
 *    3. Troque o "id" por um nome único, só com letras minúsculas e "_"
 *       (ex.: "jargao_tecnico"). Nunca repita um id.
 *    4. Escreva o nome e a descrição em português (pt) e inglês (en).
 *    5. Em "aiHint", explique para a IA o que procurar, com exemplos.
 *
 *  COMO REMOVER: apague o bloco da categoria (ou do grupo inteiro).
 *
 *  PESOS (weight): definem quanto cada grupo pesa na NOTA GERAL.
 *    1 = peso normal; 2 = conta o dobro; 0.5 = conta a metade.
 *    Categorias também podem ter "weight" próprio dentro do grupo.
 *
 *  Sempre que a taxonomia muda, o cache de análises antigas é ignorado
 *  automaticamente (para não misturar resultados de versões diferentes).
 * ============================================================================
 */

export type Lang = "pt" | "en";
export type Localized = Record<Lang, string>;

/** Tipos de conteúdo analisados. */
export type ContentKind = "article" | "paper" | "claim";

export interface BiasCategory {
  /** Identificador único (só letras minúsculas, números e "_"). */
  id: string;
  name: Localized;
  /** Nome em linguagem do dia a dia, usado no modo simples (o que o texto faz). */
  simpleName: Localized;
  /** Explicação curta para o leitor do site. */
  description: Localized;
  /** Orientação para a IA: o que procurar e como julgar. */
  aiHint: string;
  /** Peso dentro do grupo (padrão: 1). */
  weight?: number;
  /**
   * true = só pode ser avaliada olhando imagens (gráficos, fotos). Fica fora
   * dos especialistas de texto e é avaliada pela etapa "Imagens e gráficos".
   * Sem imagens no conteúdo, aparece como "não se aplica".
   */
  visualOnly?: boolean;
}

export interface BiasGroup {
  id: string;
  name: Localized;
  /** Nome curto, usado no gráfico de radar. */
  shortName: Localized;
  description: Localized;
  /** Peso do grupo na nota geral. */
  weight: number;
  /**
   * Para quais tipos de conteúdo o grupo é analisado:
   *   "article" = notícias, artigos de opinião, posts etc.
   *   "paper"   = artigos acadêmicos (papers)
   *   "claim"   = afirmações curtas (aba "Afirmação")
   */
  appliesTo: readonly ContentKind[];
  categories: BiasCategory[];
}

export const TAXONOMY: BiasGroup[] = [
  // ---------------------------------------------------------------- LINGUAGEM
  {
    id: "language",
    name: { pt: "Linguagem", en: "Language" },
    shortName: { pt: "Linguagem", en: "Language" },
    description: {
      pt: "Escolha de palavras que empurra o leitor para uma conclusão.",
      en: "Word choices that push the reader toward a conclusion.",
    },
    weight: 1,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "loaded_language",
        name: { pt: "Linguagem carregada / emocional", en: "Loaded / emotional language" },
        simpleName: { pt: "Usa palavras carregadas de emoção", en: "Uses emotionally loaded words" },
        description: {
          pt: "Palavras com forte carga emocional ou de julgamento no lugar de termos neutros.",
          en: "Words with strong emotional or judgmental weight instead of neutral terms.",
        },
        aiHint:
          "Adjetivos, advérbios e verbos com carga emocional ou moral usados pelo próprio autor (não em citações): 'brutal', 'escandaloso', 'heroico', 'desastroso', 'massacre'. Compare com o termo neutro possível.",
      },
      {
        id: "labeling",
        name: { pt: "Rótulos e adjetivação", en: "Labels and characterization" },
        simpleName: { pt: "Usa rótulos que já julgam", en: "Uses labels that already judge" },
        description: {
          pt: "Rótulos que já carregam um julgamento (ex.: 'regime' em vez de 'governo').",
          en: "Labels that carry a built-in judgment (e.g., 'regime' instead of 'government').",
        },
        aiHint:
          "Rótulos aplicados a pessoas, grupos ou instituições que embutem juízo: 'regime' vs 'governo', 'extremista', 'radical', 'militante', 'negacionista', 'terrorista', 'invasão' vs 'ocupação'. Verifique se rótulos equivalentes são aplicados de forma desigual a lados diferentes.",
      },
      {
        id: "euphemism_dysphemism",
        name: { pt: "Eufemismos e disfemismos", en: "Euphemisms and dysphemisms" },
        simpleName: { pt: "Suaviza um lado e piora o outro", en: "Softens one side and worsens the other" },
        description: {
          pt: "Suavizar algo para um lado (eufemismo) ou piorar algo para o outro (disfemismo).",
          en: "Softening something for one side (euphemism) or harshening it for another (dysphemism).",
        },
        aiHint:
          "Termos que suavizam ('ajuste fiscal' para corte, 'efeitos colaterais' para mortes, 'reestruturação' para demissões) ou que agravam ('farra', 'gastança', 'rombo') a depender de quem é o sujeito.",
      },
      {
        id: "attribution_verbs",
        name: { pt: "Verbos de atribuição assimétricos", en: "Asymmetric attribution verbs" },
        simpleName: { pt: "Descreve as falas de cada lado de forma desigual", en: "Describes each side's statements unequally" },
        description: {
          pt: "'Afirmou' para um lado e 'alegou' ou 'admitiu' para o outro.",
          en: "'Stated' for one side and 'claimed' or 'admitted' for the other.",
        },
        aiHint:
          "Compare os verbos usados para introduzir falas de cada lado. Verbos como 'disse', 'afirmou', 'declarou' e 'alegou' não são viés por si sós e nunca devem ser marcados isoladamente. Aponte só quando houver assimetria clara entre os lados (ex.: um lado 'afirmou', o outro 'admitiu', 'confessou' ou 'tentou justificar'), citando no máximo um exemplo de cada lado. Se o texto não cita falas, use not_applicable.",
      },
      {
        id: "generalizations",
        name: { pt: "Intensificadores e generalizações", en: "Intensifiers and generalizations" },
        simpleName: { pt: "Generaliza com \"todos\", \"sempre\", \"nunca\"", en: "Generalizes with \"all\", \"always\", \"never\"" },
        description: {
          pt: "'Todos', 'sempre', 'nunca', 'ninguém' usados sem base.",
          en: "'All', 'always', 'never', 'no one' used without support.",
        },
        aiHint:
          "Generalizações absolutas ou exageros sem dados ('todos sabem', 'nunca antes', 'a população inteira', 'sem precedentes', 'cada vez mais') usados pelo autor para reforçar uma tese.",
      },
    ],
  },

  // ------------------------------------------------- ENQUADRAMENTO E ESTRUTURA
  {
    id: "framing",
    name: { pt: "Enquadramento e estrutura", en: "Framing and structure" },
    shortName: { pt: "Enquadramento", en: "Framing" },
    description: {
      pt: "Como a história é montada: quem é vítima, quem é culpado, o que vem primeiro.",
      en: "How the story is built: who is the victim, who is to blame, what comes first.",
    },
    weight: 1,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "framing",
        name: { pt: "Framing (moldura da história)", en: "Framing (story frame)" },
        simpleName: { pt: "Conta a história já com culpados definidos", en: "Tells the story with culprits already chosen" },
        description: {
          pt: "A narrativa escolhida define vítimas, culpados e o 'problema' antes dos fatos.",
          en: "The chosen narrative defines victims, culprits and 'the problem' before the facts do.",
        },
        aiHint:
          "Identifique a moldura dominante (conflito, vítima/vilão, crise, progresso, ameaça, responsabilidade individual vs. sistêmica). Aponte quando a moldura é apresentada como única leitura possível e há molduras alternativas razoáveis ignoradas.",
      },
      {
        id: "headline_body",
        name: { pt: "Título vs. corpo", en: "Headline vs. body" },
        simpleName: { pt: "O título promete algo que o texto não mostra", en: "The headline promises what the text doesn't show" },
        description: {
          pt: "Título sensacionalista ou que não corresponde ao conteúdo do texto.",
          en: "A sensational headline, or one that the body does not support.",
        },
        aiHint:
          "Compare o título (primeira linha, quando houver) com o corpo. Aponte exageros, conclusões que o corpo não sustenta, ou ênfase diferente. Se não houver título identificável, use not_applicable.",
      },
      {
        id: "emphasis_placement",
        name: { pt: "Ênfase e posicionamento", en: "Emphasis and placement" },
        simpleName: { pt: "Destaca um lado e deixa o outro para o fim", en: "Highlights one side and leaves the other for last" },
        description: {
          pt: "O que aparece no início ganha destaque; o que vai para o final some.",
          en: "What appears first gets attention; what is pushed to the end disappears.",
        },
        aiHint:
          "Informações relevantes para o outro lado (contrapontos, ressalvas, dados que contradizem a tese) relegadas aos últimos parágrafos, enquanto o lado favorecido abre o texto.",
      },
      {
        id: "spin",
        name: { pt: "Spin", en: "Spin" },
        simpleName: { pt: "Dá aos fatos uma interpretação embutida", en: "Gives the facts a built-in interpretation" },
        description: {
          pt: "Fatos neutros apresentados de forma favorável ou desfavorável.",
          en: "Neutral facts presented in a favorable or unfavorable light.",
        },
        aiHint:
          "O mesmo dado poderia ser descrito de forma neutra, mas é apresentado com interpretação embutida ('apenas 40% aprovam' vs '40% aprovam'; 'mesmo com a alta' vs 'com a alta').",
      },
      {
        id: "visual_framing",
        name: { pt: "Enquadramento por imagem", en: "Visual framing" },
        simpleName: { pt: "Usa fotos ou legendas que induzem a leitura", en: "Uses photos or captions that steer the reading" },
        description: {
          pt: "Fotos, ilustrações ou legendas que induzem uma leitura do assunto.",
          en: "Photos, illustrations or captions that steer how the subject is read.",
        },
        aiHint:
          "Só imagens enviadas junto com o texto. Foto que mostra um dos lados de forma desfavorável (expressão, ângulo, contexto) enquanto o outro aparece de forma favorável; legenda carregada ou que afirma mais do que a imagem mostra; imagem que não corresponde ao fato relatado. Fotos neutras de registro não são problema.",
        visualOnly: true,
      },
    ],
  },

  // ----------------------------------------------------------------- FONTES
  {
    id: "sources",
    name: { pt: "Fontes", en: "Sources" },
    shortName: { pt: "Fontes", en: "Sources" },
    description: {
      pt: "Quem é ouvido, quem não é, e como as falas são usadas.",
      en: "Who gets heard, who doesn't, and how quotes are used.",
    },
    weight: 1,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "source_balance",
        name: { pt: "Seleção e equilíbrio de fontes", en: "Source selection and balance" },
        simpleName: { pt: "Ouve só um lado (ou dá muito mais espaço a ele)", en: "Hears only one side (or gives it far more space)" },
        description: {
          pt: "Só um lado é ouvido, ou um lado tem muito mais espaço.",
          en: "Only one side is heard, or one side gets far more space.",
        },
        aiHint:
          "Liste mentalmente as fontes citadas e de que lado estão. Aponte quando partes diretamente interessadas não são ouvidas, ou quando há grande desproporção de espaço. Em artigos de opinião, julgue com mais leniência.",
      },
      {
        id: "vague_sources",
        name: { pt: "Fontes anônimas ou vagas", en: "Anonymous or vague sources" },
        simpleName: { pt: "Cita fontes vagas ou sem nome", en: "Cites vague or unnamed sources" },
        description: {
          pt: "'Especialistas dizem', 'segundo analistas', sem nome ou referência.",
          en: "'Experts say', 'analysts believe', with no name or reference.",
        },
        aiHint:
          "Atribuições genéricas ('especialistas', 'críticos', 'muitos acreditam', 'fontes próximas') sem identificação, especialmente quando sustentam afirmações centrais.",
      },
      {
        id: "selective_quotes",
        name: { pt: "Citações seletivas ou fora de contexto", en: "Selective or out-of-context quotes" },
        simpleName: { pt: "Recorta falas e muda o sentido", en: "Cuts quotes in a way that changes their meaning" },
        description: {
          pt: "Trechos de falas recortados de forma a mudar o sentido.",
          en: "Quotes trimmed in a way that changes their meaning.",
        },
        aiHint:
          "Citações muito curtas ou fragmentadas que parecem recortadas para soar pior/melhor, ou falas apresentadas sem o contexto em que foram ditas. Só aponte com indícios no próprio texto.",
      },
      {
        id: "source_credentials",
        name: { pt: "Credenciais das fontes", en: "Source credentials" },
        simpleName: { pt: "Apresenta como especialista quem não é", en: "Presents non-experts as experts" },
        description: {
          pt: "Opiniões apresentadas como de especialistas sem que sejam.",
          en: "Opinions presented as expert views when they are not.",
        },
        aiHint:
          "Fontes apresentadas como autoridade fora de sua área, sem credenciais informadas, ou militantes/partes interessadas apresentados como neutros (e vice-versa).",
      },
    ],
  },

  // ----------------------------------------------------- OMISSÃO E SELEÇÃO
  {
    id: "omission",
    name: { pt: "Omissão e seleção", en: "Omission and selection" },
    shortName: { pt: "Omissão", en: "Omission" },
    description: {
      pt: "O que ficou de fora e muda a forma de entender a história.",
      en: "What was left out that would change how the story is understood.",
    },
    weight: 1,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "missing_context",
        name: { pt: "Contexto relevante omitido", en: "Relevant context omitted" },
        simpleName: { pt: "Deixa de fora um contexto importante", en: "Leaves out important context" },
        description: {
          pt: "Falta um contexto que mudaria a interpretação (histórico, comparação, causas).",
          en: "Missing context that would change the interpretation (history, comparison, causes).",
        },
        aiHint:
          "Use a evidência como o trecho que precisaria de contexto e explique qual contexto falta. Inclui dados ou números que deveriam estar no texto e não estão. Baseie-se em conhecimento geral amplamente aceito; não invente fatos específicos que você não pode verificar.",
      },
      {
        id: "missing_perspectives",
        name: { pt: "Perspectivas ausentes", en: "Missing perspectives" },
        simpleName: { pt: "Ignora quem é afetado ou pensa diferente", en: "Ignores those affected or who think differently" },
        description: {
          pt: "Grupos afetados ou visões relevantes que não aparecem.",
          en: "Affected groups or relevant viewpoints that do not appear.",
        },
        aiHint:
          "Quem é afetado pelo tema e não tem voz no texto? Cite como evidência o trecho onde essa perspectiva seria esperada.",
      },
      {
        id: "selective_facts",
        name: { pt: "Seleção de fatos", en: "Selective facts" },
        simpleName: { pt: "Escolhe só os fatos que convêm", en: "Picks only the convenient facts" },
        description: {
          pt: "Só os fatos que favorecem uma narrativa são apresentados.",
          en: "Only facts that favor one narrative are presented.",
        },
        aiHint:
          "Padrão de selecionar fatos de um só lado quando fatos relevantes do outro lado são notórios.",
      },
    ],
  },

  // --------------------------------------------------- DADOS E ESTATÍSTICA
  {
    id: "data",
    name: { pt: "Dados e estatística", en: "Data and statistics" },
    shortName: { pt: "Dados", en: "Data" },
    description: {
      pt: "Números que aparecem no texto usados de forma que engana ou não sustenta a conclusão. Dados que faltam entram em \"Omissão\".",
      en: "Numbers that appear in the text used in misleading ways or that don't support the conclusion. Missing data counts under \"Omission\".",
    },
    weight: 0.9,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "misleading_numbers",
        name: { pt: "Números enganosos", en: "Misleading numbers" },
        simpleName: { pt: "Usa números de forma enganosa", en: "Uses numbers in a misleading way" },
        description: {
          pt: "Números sem base de comparação, ou absolutos quando o relativo importa (e vice-versa).",
          en: "Numbers without a baseline, or absolute figures where relative ones matter (and vice versa).",
        },
        aiHint:
          "Avalie SOMENTE números que aparecem no texto: percentuais sem base, valores absolutos sem população/inflação, 'aumento de 200%' sobre base minúscula, médias que escondem distribuição. Se o texto não traz números, use not_applicable. A falta de um dado que deveria estar no texto NÃO é problema desta categoria: isso é 'Contexto relevante omitido'.",
      },
      {
        id: "correlation_causation",
        name: { pt: "Correlação como causalidade", en: "Correlation as causation" },
        simpleName: { pt: "Trata coincidência como causa", en: "Treats coincidence as cause" },
        description: {
          pt: "Duas coisas que acontecem juntas apresentadas como causa e efeito.",
          en: "Two things that happen together presented as cause and effect.",
        },
        aiHint:
          "Afirmações causais ('X provocou Y', 'graças a X') sustentadas apenas por números que mostram coincidência ou correlação. Só se aplica se o texto apresentar dados; causalidade sem dados é avaliada em 'Opinião apresentada como fato'.",
      },
      {
        id: "cherry_picking",
        name: { pt: "Recorte temporal seletivo", en: "Cherry-picked timeframe" },
        simpleName: { pt: "Escolhe a dedo o período dos dados", en: "Hand-picks the time period of the data" },
        description: {
          pt: "Período escolhido a dedo para mostrar a tendência desejada.",
          en: "A hand-picked time window that shows the desired trend.",
        },
        aiHint:
          "Comparações numéricas com anos/meses específicos, presentes no texto, que favorecem a tese sem justificar o recorte, quando outro recorte mudaria a conclusão. Se o texto não traz séries ou comparações numéricas, use not_applicable.",
      },
      {
        id: "unsourced_data",
        name: { pt: "Dados sem fonte", en: "Unsourced data" },
        simpleName: { pt: "Traz números sem dizer de onde vêm", en: "Gives numbers without saying where they come from" },
        description: {
          pt: "Números ou gráficos sem indicação de onde vieram.",
          en: "Numbers or charts with no indication of where they came from.",
        },
        aiHint: "Números que APARECEM no texto sem qualquer fonte identificável. Se o texto não traz números, use not_applicable. Não aponte dados que deveriam existir e não aparecem: isso é 'Contexto relevante omitido'.",
      },
      {
        id: "misleading_chart",
        name: { pt: "Gráfico ou tabela enganosa", en: "Misleading chart or table" },
        simpleName: { pt: "Usa gráfico ou tabela que distorce os dados", en: "Uses a chart or table that distorts the data" },
        description: {
          pt: "Gráficos e tabelas que distorcem os dados ou dizem algo diferente do texto.",
          en: "Charts and tables that distort the data or say something different from the text.",
        },
        aiHint:
          "Só gráficos e tabelas enviados como imagem. Eixo vertical que não começa no zero exagerando diferenças; escala distorcida, quebrada ou dupla sem aviso; recorte de período escolhido a dedo; efeito 3D ou áreas desproporcionais; gráfico ou tabela sem fonte; texto que descreve o gráfico de forma diferente do que ele mostra (ex.: 'forte alta' quando a linha está quase estável). Gráficos corretos não são problema.",
        visualOnly: true,
      },
    ],
  },

  // ------------------------------------------------------- FATO VS OPINIÃO
  {
    id: "fact_opinion",
    name: { pt: "Fato vs. opinião", en: "Fact vs. opinion" },
    shortName: { pt: "Fato/opinião", en: "Fact/opinion" },
    description: {
      pt: "Quando opinião se disfarça de fato, ou o texto noticioso opina.",
      en: "When opinion is dressed up as fact, or a news story editorializes.",
    },
    weight: 1,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "opinion_as_fact",
        name: { pt: "Opinião apresentada como fato", en: "Opinion presented as fact" },
        simpleName: { pt: "Apresenta opinião como se fosse fato", en: "Presents opinion as if it were fact" },
        description: {
          pt: "Juízos de valor escritos como se fossem constatações objetivas.",
          en: "Value judgments written as if they were objective findings.",
        },
        aiHint:
          "Frases afirmativas que expressam julgamento, previsão ou interpretação discutível sem marcação de opinião ('a medida é um erro', 'o plano vai fracassar').",
      },
      {
        id: "editorializing",
        name: { pt: "Editorialização em texto noticioso", en: "Editorializing in news" },
        simpleName: { pt: "O repórter opina dentro da notícia", en: "The reporter gives opinions inside the news" },
        description: {
          pt: "O repórter opina dentro de uma notícia que deveria ser informativa.",
          en: "The reporter inserts opinion into a story meant to inform.",
        },
        aiHint:
          "Só se aplica a notícias e reportagens. Em artigos de opinião, editoriais, colunas e análises assinadas, use not_applicable. Procure comentários do autor, ironias, conclusões morais.",
      },
    ],
  },

  // ------------------------------------------- APELO EMOCIONAL E SENSACIONALISMO
  {
    id: "emotional",
    name: { pt: "Apelo emocional e sensacionalismo", en: "Emotional appeal and sensationalism" },
    shortName: { pt: "Emoção", en: "Emotion" },
    description: {
      pt: "Recursos para provocar medo, raiva ou urgência em vez de informar.",
      en: "Devices meant to provoke fear, anger or urgency rather than inform.",
    },
    weight: 0.8,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "clickbait",
        name: { pt: "Clickbait", en: "Clickbait" },
        simpleName: { pt: "Usa título feito só para gerar clique", en: "Uses a headline made just to get clicks" },
        description: {
          pt: "Títulos ou frases feitos para gerar clique, com mistério ou exagero.",
          en: "Headlines or lines built to drive clicks through mystery or exaggeration.",
        },
        aiHint: "'Você não vai acreditar', 'o que ninguém te conta', perguntas retóricas no título, revelações prometidas e não entregues.",
      },
      {
        id: "fear_outrage",
        name: { pt: "Medo e indignação", en: "Fear and outrage" },
        simpleName: { pt: "Tenta provocar medo ou revolta", en: "Tries to provoke fear or outrage" },
        description: {
          pt: "Texto montado para provocar medo ou revolta.",
          en: "Text built to provoke fear or outrage.",
        },
        aiHint: "Cenários catastróficos, linguagem de ameaça, apelo à indignação moral desproporcional aos fatos apresentados.",
      },
      {
        id: "false_urgency",
        name: { pt: "Urgência artificial", en: "Artificial urgency" },
        simpleName: { pt: "Cria uma pressa que não existe", en: "Creates a rush that doesn't exist" },
        description: {
          pt: "'Agora ou nunca', prazos dramáticos sem base.",
          en: "'Now or never', dramatic deadlines without basis.",
        },
        aiHint: "Pressão temporal sem fundamento ('antes que seja tarde', 'última chance').",
      },
    ],
  },

  // -------------------------------------------------------- FALÁCIAS LÓGICAS
  {
    id: "fallacies",
    name: { pt: "Falácias lógicas", en: "Logical fallacies" },
    shortName: { pt: "Falácias", en: "Fallacies" },
    description: {
      pt: "Argumentos com defeitos de raciocínio.",
      en: "Arguments with flawed reasoning.",
    },
    weight: 0.8,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "straw_man",
        name: { pt: "Espantalho", en: "Straw man" },
        simpleName: { pt: "Distorce o argumento do outro lado", en: "Distorts the other side's argument" },
        description: {
          pt: "Distorcer a posição do outro lado para facilitar a crítica.",
          en: "Distorting the other side's position to make it easier to attack.",
        },
        aiHint: "Posição adversária descrita de forma caricata ou extrema para ser refutada.",
      },
      {
        id: "false_dilemma",
        name: { pt: "Falso dilema", en: "False dilemma" },
        simpleName: { pt: "Mostra só duas opções quando há outras", en: "Shows only two options when there are more" },
        description: {
          pt: "Apresentar só duas opções quando existem outras.",
          en: "Presenting only two options when more exist.",
        },
        aiHint: "'Ou X ou Y', ignorando alternativas intermediárias óbvias.",
      },
      {
        id: "ad_hominem",
        name: { pt: "Ad hominem", en: "Ad hominem" },
        simpleName: { pt: "Ataca a pessoa em vez do argumento", en: "Attacks the person instead of the argument" },
        description: {
          pt: "Atacar a pessoa em vez do argumento.",
          en: "Attacking the person instead of the argument.",
        },
        aiHint: "Desqualificar um argumento pela pessoa, sua origem ou caráter, em vez do conteúdo.",
      },
      {
        id: "slippery_slope",
        name: { pt: "Ladeira escorregadia", en: "Slippery slope" },
        simpleName: { pt: "Exagera as consequências de um passo", en: "Exaggerates where one step will lead" },
        description: {
          pt: "Sugerir que um passo levará inevitavelmente a uma catástrofe.",
          en: "Suggesting one step will inevitably lead to disaster.",
        },
        aiHint: "Cadeia de consequências extremas sem justificativa de cada passo.",
      },
      {
        id: "appeal_to_authority",
        name: { pt: "Apelo à autoridade", en: "Appeal to authority" },
        simpleName: { pt: "Usa o prestígio de alguém no lugar de provas", en: "Uses someone's prestige instead of evidence" },
        description: {
          pt: "Usar o prestígio de alguém no lugar de evidências.",
          en: "Using someone's prestige in place of evidence.",
        },
        aiHint: "Autoridade citada como prova suficiente, especialmente fora de sua área de competência.",
      },
      {
        id: "false_equivalence",
        name: { pt: "Falsa equivalência", en: "False equivalence" },
        simpleName: { pt: "Trata como iguais coisas que não são", en: "Treats unequal things as equal" },
        description: {
          pt: "Tratar como equivalentes posições com pesos de evidência muito diferentes.",
          en: "Treating positions with very different evidence as equal.",
        },
        aiHint:
          "Inclui 'bothsidesism': dar peso igual a uma posição marginal e ao consenso científico, ou comparar situações de gravidade muito diferente como se fossem iguais.",
      },
    ],
  },

  // --------------------------------------------------- INTERESSES E CONFLITOS
  {
    id: "interests",
    name: { pt: "Interesses e conflitos", en: "Interests and conflicts" },
    shortName: { pt: "Interesses", en: "Interests" },
    description: {
      pt: "Publicidade disfarçada e conflitos de interesse visíveis no texto.",
      en: "Disguised advertising and conflicts of interest visible in the text.",
    },
    weight: 0.7,
    appliesTo: ["article", "paper"],
    categories: [
      {
        id: "sponsored_content",
        name: { pt: "Conteúdo patrocinado disfarçado", en: "Disguised sponsored content" },
        simpleName: { pt: "Parece notícia, mas é propaganda", en: "Looks like news, but is advertising" },
        description: {
          pt: "Texto com cara de notícia que promove um produto, empresa ou causa.",
          en: "News-like text that promotes a product, company or cause.",
        },
        aiHint: "Promoção de produtos/empresas, links comerciais, tom publicitário, ausência de qualquer crítica a quem é promovido.",
      },
      {
        id: "conflicts_of_interest",
        name: { pt: "Conflitos de interesse", en: "Conflicts of interest" },
        simpleName: { pt: "O autor ou o veículo tem interesse no assunto", en: "The author or outlet has a stake in the topic" },
        description: {
          pt: "Interesses do autor ou do veículo que podem influenciar o texto.",
          en: "Interests of the author or outlet that may shape the text.",
        },
        aiHint:
          "Só aponte conflitos identificáveis no PRÓPRIO texto (declarações, vínculos mencionados, o veículo cobrindo seus próprios negócios). Não especule sobre donos de veículos com base em conhecimento externo.",
      },
    ],
  },

  // ------------------------------------------------------------ REPRESENTAÇÃO
  {
    id: "representation",
    name: { pt: "Representação", en: "Representation" },
    shortName: { pt: "Representação", en: "Representation" },
    description: {
      pt: "Estereótipos sobre grupos de pessoas.",
      en: "Stereotypes about groups of people.",
    },
    weight: 0.9,
    appliesTo: ["article", "paper", "claim"],
    categories: [
      {
        id: "stereotype_gender",
        name: { pt: "Estereótipos de gênero", en: "Gender stereotypes" },
        simpleName: { pt: "Usa estereótipos de gênero", en: "Uses gender stereotypes" },
        description: { pt: "Papéis ou traços atribuídos a alguém por seu gênero.", en: "Roles or traits attributed to someone because of gender." },
        aiHint: "Descrições de aparência/vida pessoal só para mulheres, papéis tradicionais presumidos, linguagem desigual por gênero.",
      },
      {
        id: "stereotype_race",
        name: { pt: "Estereótipos raciais ou étnicos", en: "Racial or ethnic stereotypes" },
        simpleName: { pt: "Usa estereótipos de raça ou etnia", en: "Uses racial or ethnic stereotypes" },
        description: { pt: "Associações estereotipadas a raça ou etnia.", en: "Stereotyped associations with race or ethnicity." },
        aiHint: "Menção desnecessária de raça/etnia, associação de grupos a crime ou comportamentos.",
      },
      {
        id: "stereotype_class",
        name: { pt: "Estereótipos de classe", en: "Class stereotypes" },
        simpleName: { pt: "Usa estereótipos sobre pobres, ricos ou trabalhadores", en: "Uses stereotypes about the poor, the rich or workers" },
        description: { pt: "Retratos estereotipados de pobres, ricos ou trabalhadores.", en: "Stereotyped portrayals of the poor, rich or workers." },
        aiHint: "Generalizações sobre comportamento de classes sociais, desumanização de pobres ou caricatura de ricos.",
      },
      {
        id: "stereotype_region",
        name: { pt: "Estereótipos regionais", en: "Regional stereotypes" },
        simpleName: { pt: "Usa preconceitos sobre regiões", en: "Uses prejudice about regions" },
        description: { pt: "Preconceitos sobre regiões, estados ou cidades.", en: "Prejudice about regions, states or cities." },
        aiHint: "No Brasil, atenção a estereótipos sobre Nordeste, Norte, periferias; em outros países, equivalentes locais.",
      },
      {
        id: "stereotype_religion",
        name: { pt: "Estereótipos religiosos", en: "Religious stereotypes" },
        simpleName: { pt: "Generaliza sobre quem segue uma religião", en: "Generalizes about followers of a religion" },
        description: { pt: "Generalizações sobre fiéis de uma religião.", en: "Generalizations about followers of a religion." },
        aiHint: "Associação de religiões a fanatismo, violência ou atraso; ou o inverso, idealização acrítica.",
      },
      {
        id: "stereotype_nationality",
        name: { pt: "Estereótipos de nacionalidade", en: "Nationality stereotypes" },
        simpleName: { pt: "Generaliza sobre povos ou imigrantes", en: "Generalizes about peoples or immigrants" },
        description: { pt: "Generalizações sobre povos ou imigrantes.", en: "Generalizations about nations or immigrants." },
        aiHint: "Traços atribuídos a um povo inteiro, imigrantes retratados como ameaça ou fardo em bloco.",
      },
    ],
  },

  // ------------------------------------- VIESES DE RACIOCÍNIO (AFIRMAÇÕES)
  {
    id: "cognitive",
    name: { pt: "Vieses de raciocínio", en: "Reasoning biases" },
    shortName: { pt: "Raciocínio", en: "Reasoning" },
    description: {
      pt: "Atalhos de pensamento que levam a conclusões sem base, muitas vezes moldados pelo que a pessoa lê e assiste.",
      en: "Mental shortcuts that lead to unsupported conclusions, often shaped by what a person reads and watches.",
    },
    weight: 1.1,
    appliesTo: ["claim"],
    categories: [
      {
        id: "hasty_generalization",
        name: { pt: "Generalização apressada", en: "Hasty generalization" },
        simpleName: { pt: "Tira uma regra de poucos casos", en: "Draws a rule from a few cases" },
        description: {
          pt: "Tirar uma regra geral a partir de poucos casos.",
          en: "Drawing a general rule from a few cases.",
        },
        aiHint:
          "A afirmação atribui uma característica a um grupo inteiro, a um país ou a 'todo mundo' com base em poucos exemplos ou impressões.",
      },
      {
        id: "anecdotal_evidence",
        name: { pt: "Experiência pessoal como prova", en: "Anecdote as proof" },
        simpleName: { pt: "Usa um caso pessoal como prova", en: "Uses a personal story as proof" },
        description: {
          pt: "Usar um caso vivido ou ouvido como se provasse uma tendência.",
          en: "Using a personal or second-hand story as if it proved a trend.",
        },
        aiHint: "'Conheço um que…', 'na minha rua…', 'vi um vídeo que…' usados como prova de um fenômeno amplo.",
      },
      {
        id: "availability_bias",
        name: { pt: "Viés de disponibilidade", en: "Availability bias" },
        simpleName: { pt: "Acha que algo é comum só porque aparece muito", en: "Thinks something is common just because it's seen a lot" },
        description: {
          pt: "Achar que algo é comum porque aparece muito no noticiário ou nas redes.",
          en: "Believing something is common because it shows up a lot in the news or on social media.",
        },
        aiHint:
          "Afirmações sobre frequência ou tendência ('cada vez mais', 'toda hora', 'explodiu') que parecem refletir casos marcantes e muito divulgados, e não dados.",
      },
      {
        id: "confirmation_bias",
        name: { pt: "Viés de confirmação", en: "Confirmation bias" },
        simpleName: { pt: "Considera só o que confirma o que já se pensa", en: "Considers only what confirms existing beliefs" },
        description: {
          pt: "Considerar só o que confirma o que já se acredita.",
          en: "Considering only what confirms what one already believes.",
        },
        aiHint:
          "A afirmação ignora evidências contrárias notórias, ou interpreta um fato ambíguo de forma a confirmar uma crença prévia.",
      },
      {
        id: "unfalsifiable",
        name: { pt: "Afirmação impossível de verificar", en: "Unfalsifiable claim" },
        simpleName: { pt: "Não tem como ser verificada", en: "Can't be checked" },
        description: {
          pt: "Formulada de um jeito que nenhuma evidência poderia confirmar ou desmentir.",
          en: "Phrased so that no evidence could confirm or refute it.",
        },
        aiHint: "Afirmações vagas, sobre intenções ocultas ou conspirações, ou formuladas de modo que qualquer fato as 'confirma'.",
      },
      {
        id: "echoed_slogan",
        name: { pt: "Bordão ou narrativa pronta", en: "Slogan or ready-made narrative" },
        simpleName: { pt: "Repete um bordão sem examiná-lo", en: "Repeats a slogan without examining it" },
        description: {
          pt: "Repete uma frase feita que circula em um grupo, veículo ou rede, sem examiná-la.",
          en: "Repeats a stock phrase that circulates in a group, outlet or network, without examining it.",
        },
        aiHint:
          "Bordões, frases de efeito e enquadramentos típicos de um campo político ou de uma bolha de mídia. Não julgue a pessoa: explique de que tipo de discurso a frase costuma vir, com a mesma régua para todos os lados.",
      },
    ],
  },

  // -------------------------------------------- ESPECÍFICOS PARA PAPERS
  {
    id: "academic",
    name: { pt: "Específicos de artigos acadêmicos", en: "Academic paper issues" },
    shortName: { pt: "Acadêmico", en: "Academic" },
    description: {
      pt: "Problemas típicos de pesquisas científicas. Só aparecem quando o texto é um paper.",
      en: "Typical problems in scientific research. Only shown when the text is a paper.",
    },
    weight: 1.2,
    appliesTo: ["paper"],
    categories: [
      {
        id: "funding_conflicts",
        name: { pt: "Financiamento e conflitos de interesse", en: "Funding and conflicts of interest" },
        simpleName: { pt: "Quem pagou o estudo pode ter interesse no resultado", en: "Whoever paid for the study may have a stake in the result" },
        description: {
          pt: "Quem financiou o estudo e possíveis conflitos declarados.",
          en: "Who funded the study and any declared conflicts.",
        },
        aiHint:
          "Procure seções de financiamento/conflitos. Aponte financiadores com interesse no resultado, conflitos declarados relevantes, ou ausência de declaração quando seria esperada.",
      },
      {
        id: "sampling_bias",
        name: { pt: "Viés de amostragem / amostra pequena", en: "Sampling bias / small sample" },
        simpleName: { pt: "Usa amostra pequena ou pouco representativa", en: "Uses a small or unrepresentative sample" },
        description: {
          pt: "Amostra pequena ou não representativa para as conclusões tiradas.",
          en: "A sample too small or unrepresentative for the conclusions drawn.",
        },
        aiHint: "Tamanho de amostra, forma de seleção, população restrita generalizada para todos.",
      },
      {
        id: "abstract_spin",
        name: { pt: "Conclusões maiores que os resultados", en: "Conclusions overreach results" },
        simpleName: { pt: "Conclui mais do que os resultados mostram", en: "Concludes more than the results show" },
        description: {
          pt: "Resumo ou conclusão prometem mais do que os dados mostram.",
          en: "Abstract or conclusion claim more than the data show.",
        },
        aiHint:
          "Compare o abstract/conclusão com os resultados: efeitos não significativos descritos como 'tendência positiva', resultados secundários promovidos, linguagem causal sem desenho causal.",
      },
      {
        id: "observational_causality",
        name: { pt: "Causalidade a partir de dados observacionais", en: "Causality from observational data" },
        simpleName: { pt: "Afirma causa sem um estudo capaz de provar", en: "Claims cause without a study able to prove it" },
        description: {
          pt: "Conclusões de causa e efeito em estudo que só observa associações.",
          en: "Cause-and-effect conclusions from a study that only observes associations.",
        },
        aiHint: "Estudos transversais/coorte/caso-controle com linguagem de causa ('reduz', 'provoca') sem ressalvas.",
      },
      {
        id: "p_hacking",
        name: { pt: "Sinais de p-hacking ou análise seletiva", en: "Signs of p-hacking or selective analysis" },
        simpleName: { pt: "Testa muitas coisas e destaca só o que deu certo", en: "Tests many things and highlights only what worked" },
        description: {
          pt: "Muitas comparações e só as 'significativas' são destacadas.",
          en: "Many comparisons, with only the 'significant' ones highlighted.",
        },
        aiHint:
          "Valores-p logo abaixo de 0,05, muitos desfechos testados sem correção, subgrupos post hoc, mudança de desfecho principal, análises não pré-registradas.",
      },
      {
        id: "selective_citation",
        name: { pt: "Citação seletiva / viés de confirmação", en: "Selective citation / confirmation bias" },
        simpleName: { pt: "Cita só os estudos que concordam", en: "Cites only studies that agree" },
        description: {
          pt: "Só são citados estudos que concordam com a hipótese.",
          en: "Only studies that agree with the hypothesis are cited.",
        },
        aiHint: "Revisão de literatura unilateral, ausência de menção a resultados contrários conhecidos.",
      },
      {
        id: "unacknowledged_limitations",
        name: { pt: "Limitações não reconhecidas", en: "Unacknowledged limitations" },
        simpleName: { pt: "Não admite as fraquezas do estudo", en: "Doesn't admit the study's weaknesses" },
        description: {
          pt: "Fraquezas importantes do estudo não são mencionadas.",
          en: "Important weaknesses of the study go unmentioned.",
        },
        aiHint: "Seção de limitações ausente ou superficial diante de limitações evidentes do desenho.",
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 *  NOTA GERAL: como as notas das categorias viram a nota de 0 a 10
 * ---------------------------------------------------------------------------
 *  1. Categorias "não se aplica" ficam fora da conta.
 *  2. A nota de cada GRUPO mistura a pior categoria com a média do grupo
 *     (groupMaxShare = quanto a pior categoria pesa).
 *  3. A nota GERAL mistura a média ponderada dos grupos com a média dos
 *     piores grupos (topGroupsShare), para que um texto muito enviesado em
 *     poucos aspectos não pareça "limpo" só por estar ok nos demais.
 * ------------------------------------------------------------------------- */
export const SCORING = {
  /** 0 a 1: quanto a pior categoria pesa na nota do grupo. */
  groupMaxShare: 0.5,
  /** 0 a 1: quanto a média dos piores grupos pesa na nota geral. */
  topGroupsShare: 0.35,
  /** Quantos "piores grupos" entram na conta acima. */
  topGroupsCount: 3,
  /** Peso de cada nível de confiança no cálculo das médias. */
  confidenceWeight: { low: 0.6, medium: 0.85, high: 1 },
  /**
   * Escala única de intensidade usada no site inteiro (notas, cores,
   * destaques, versão neutra): abaixo de "moderate" = leve; de "moderate"
   * até antes de "strong" = moderado; a partir de "strong" = forte.
   */
  intensity: { moderate: 3.5, strong: 6.5 },
  /**
   * Faixas da nota geral (limite superior de cada faixa), na mesma escala de
   * "intensity" acima: leve até 3,4; moderado de 3,5 a 6,4; forte a partir de 6,5.
   */
  labels: [
    { max: 3.4, pt: "Viés leve", en: "Mild bias", simplePt: "levemente enviesado", simpleEn: "slightly biased" },
    { max: 6.4, pt: "Viés moderado", en: "Moderate bias", simplePt: "moderadamente enviesado", simpleEn: "moderately biased" },
    { max: 10, pt: "Viés forte", en: "Strong bias", simplePt: "fortemente enviesado", simpleEn: "strongly biased" },
  ],
} as const;

/* -------------------------- Funções de apoio (não precisa editar) ---------- */

export function getGroup(id: string): BiasGroup | undefined {
  return TAXONOMY.find((g) => g.id === id);
}

export function getCategory(id: string): { group: BiasGroup; category: BiasCategory } | undefined {
  for (const group of TAXONOMY) {
    const category = group.categories.find((c) => c.id === id);
    if (category) return { group, category };
  }
  return undefined;
}

export function scoreLabel(score: number) {
  return SCORING.labels.find((l) => score <= l.max) ?? SCORING.labels[SCORING.labels.length - 1];
}
