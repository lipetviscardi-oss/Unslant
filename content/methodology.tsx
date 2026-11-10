/**
 * ============================================================================
 *  TEXTO DA PÁGINA "METODOLOGIA" (português e inglês)
 * ============================================================================
 *  Pode editar livremente. Os números (pesos, fórmula, faixas da nota) vêm
 *  de lib/taxonomy.ts e lib/config.ts, então a página acompanha qualquer
 *  mudança feita lá.
 * ============================================================================
 */

import Link from "next/link";
import { SCORING, TAXONOMY } from "@/lib/taxonomy";
import { activeModelName, config } from "@/lib/config";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const fmt = (n: number, lang: "pt" | "en") => n.toLocaleString(lang === "pt" ? "pt-BR" : "en-US");
const MODEL_NAME = activeModelName();

function WeightsList({ lang }: { lang: "pt" | "en" }) {
  return (
    <ul>
      {TAXONOMY.map((g) => (
        <li key={g.id}>
          {g.name[lang]}: <strong>{fmt(g.weight, lang)}</strong>
        </li>
      ))}
    </ul>
  );
}

function Bands({ lang }: { lang: "pt" | "en" }) {
  return (
    <ul>
      {SCORING.labels.map((l, i) => (
        <li key={l.max}>
          {fmt(i === 0 ? 0 : SCORING.labels[i - 1].max + 0.1, lang)} – {fmt(l.max, lang)}: <strong>{l[lang]}</strong>
        </li>
      ))}
    </ul>
  );
}

export function MethodologyPt() {
  return (
    <>
      <h2>O que o unslant faz e o que não faz</h2>
      <p>
        O unslant mostra <strong>como</strong> um texto pode influenciar a sua leitura: palavras carregadas, fontes de um
        lado só, números sem contexto, falácias, omissões. Ele não diz se o autor é bem ou mal-intencionado, não decide em
        quem você deve acreditar e não substitui a sua própria leitura.
      </p>
      <p>
        Viés não é o mesmo que mentira. Um texto pode trazer só fatos verdadeiros e, ainda assim, escolhê-los e
        organizá-los de forma a empurrar o leitor para uma conclusão. Da mesma forma, um artigo de opinião pode defender
        uma posição sem ser desonesto: nesses casos, o unslant procura distorções, omissões e falácias, não a existência
        de opinião.
      </p>

      <h2>Como uma análise acontece</h2>
      <ol>
        <li>
          <strong>Extração.</strong> Separamos o texto principal de menus, anúncios e rodapés. Tabelas viram linhas
          legíveis. PDFs são lidos no seu próprio navegador, na ordem certa mesmo em duas colunas, sem os cabeçalhos e
          rodapés repetidos em cada página.
        </li>
        <li>
          <strong>Identificação.</strong> A IA identifica o tipo de texto (notícia, reportagem, análise, opinião,
          editorial, paper…), o país e o contexto político relevante. O tipo segue critérios fixos (por exemplo: texto
          assinado que defende uma posição é opinião; texto que defende a posição do próprio veículo é editorial) e usa
          como pista a editoria indicada pela página, quando existe. O motivo da escolha aparece no resultado. Se você
          souber o tipo, pode informá-lo no formulário, e ele prevalece sobre o da IA.
        </li>
        <li>
          <strong>Especialistas.</strong> O texto é examinado ao mesmo tempo por vários &ldquo;especialistas&rdquo;, cada um
          olhando só para alguns grupos de vieses (linguagem, fontes, dados, falácias…). Um deles também avalia a inclinação
          política, a proporção de fato e opinião e possíveis omissões.
        </li>
        <li>
          <strong>Imagens e gráficos.</strong> Ao mesmo tempo, a IA examina as imagens do conteúdo: descreve cada
          gráfico, tabela ou foto, compara com o que o texto diz e procura gráficos enganosos (eixo que não começa no
          zero, recorte escolhido a dedo, escala distorcida) e enquadramento por imagem. Ela só pode apontar figuras que
          de fato recebeu.
        </li>
        <li>
          <strong>Conferência.</strong> Cada trecho citado como evidência é procurado no texto original. O que não for
          encontrado é descartado (veja abaixo). As notas são calculadas pelo próprio site, com uma fórmula fixa.
        </li>
        <li>
          <strong>Síntese.</strong> Um resumo final junta os achados e sugere como um trecho problemático poderia ser
          reescrito de forma neutra. A versão neutra nunca acrescenta fontes, números ou fatos que não estão no original;
          o site confere isso automaticamente e descarta a sugestão se ela inventar algo.
        </li>
      </ol>
      <p>
        Ao todo são {TAXONOMY.reduce((s, g) => s + g.categories.length, 0)} categorias em {TAXONOMY.length} grupos. Algumas só
        valem para certos conteúdos: o grupo de artigos acadêmicos é ativado apenas para papers, e o de vieses de
        raciocínio, apenas para afirmações. Veja a lista completa em <Link href="/pt/glossary">Tipos de viés</Link>.
      </p>

      <h2>Toda afirmação precisa de prova no próprio texto</h2>
      <p>
        Por padrão, o texto analisado mostra só os destaques de nível moderado e forte; os leves podem ser exibidos com um
        botão. Trechos apontados em mais de uma categoria aparecem como um destaque só, com todas as explicações. Verbos
        como &ldquo;afirmou&rdquo; ou &ldquo;alegou&rdquo; não são apontados sozinhos, só quando há tratamento desigual
        entre os lados.
      </p>
      <p>
        A IA só pode apontar um viés se citar o trecho exato que o demonstra. Antes de mostrar o resultado, o site procura
        cada citação no texto original, tolerando apenas diferenças de aspas, espaços e maiúsculas. Se a citação não
        existir, ela é <strong>descartada</strong>, e a categoria fica sem o apontamento. O número de trechos descartados
        aparece no fim de cada análise.
      </p>
      <p>
        Isso impede que a IA &ldquo;invente&rdquo; problemas e permite que você confira cada apontamento com os próprios
        olhos: basta clicar no trecho destacado.
      </p>
      <p>
        <strong>Falas entre aspas são de quem fala, não do autor.</strong> Quando o texto reproduz entre aspas a fala de
        um político, especialista ou entrevistado, essa fala não é tratada como opinião do autor apresentada como fato,
        nem como linguagem do autor. O site confere isso automaticamente e descarta esses apontamentos. Falas citadas
        ainda podem contar quando o problema está na escolha do autor, por exemplo ao dar voz a um só lado.
      </p>

      <h2>Como a nota de 0 a 10 é calculada</h2>
      <p>Cada categoria recebe uma nota com esta escala:</p>
      <ul>
        <li><strong>0</strong>: nenhum problema</li>
        <li><strong>1 a 3</strong>: problemas leves ou pontuais</li>
        <li><strong>4 a 6</strong>: problemas claros e recorrentes</li>
        <li><strong>7 e 8</strong>: viés forte, que molda a leitura</li>
        <li><strong>9 e 10</strong>: distorção grave e sistemática</li>
      </ul>
      <p>
        Cada nota vem com um nível de confiança (baixo, médio ou alto). A IA distingue duas situações: &ldquo;sem
        problema&rdquo; (o texto tem material para aquela categoria e o trata bem, o que conta como 0) e &ldquo;não se
        aplica&rdquo; (o texto não tem material para ela, como as categorias de dados num texto sem números). As
        categorias que não se aplicam ficam <strong>fora da conta</strong>, e o resultado mostra quantas foram.
      </p>
      <p>
        Para manter as notas consistentes, a IA recebe descrições de referência: nota 2 é uma notícia equilibrada com um
        ou outro adjetivo dispensável; nota 5 é um texto que dá bem mais espaço a um lado e usa algumas palavras
        carregadas, mas ainda informa os fatos; nota 8 é um texto de campanha disfarçado de notícia.
      </p>
      <p>
        A nota de cada grupo combina a pior categoria do grupo ({pct(SCORING.groupMaxShare)}) com a média das categorias (
        {pct(1 - SCORING.groupMaxShare)}), em que apontamentos de confiança baixa pesam menos.
      </p>
      <p>
        A <strong>nota geral</strong> combina a média ponderada dos grupos ({pct(1 - SCORING.topGroupsShare)}) com a média
        dos {SCORING.topGroupsCount} grupos com as notas mais altas ({pct(SCORING.topGroupsShare)}). Essa segunda parte
        existe para que um texto muito enviesado em poucos aspectos não pareça equilibrado só porque está correto nos
        demais. Os pesos atuais dos grupos são:
      </p>
      <WeightsList lang="pt" />
      <p>E as faixas da nota geral:</p>
      <Bands lang="pt" />
      <p>
        A nota mede o quanto o texto é enviesado <strong>de forma geral</strong>, não só politicamente. Um texto pode ter
        nota alta sem nenhuma inclinação política, por exemplo por sensacionalismo ou uso enganoso de números.
      </p>

      <h2>Inclinação política</h2>
      <p>
        A inclinação é avaliada em três partes. A primeira é o <strong>lado favorecido numa disputa</strong>: quando o
        texto trata de uma disputa concreta (governo × oposição, candidato A × candidato B), a IA diz se ele favorece um
        lado, se é equilibrado ou se não dá para afirmar. Para que a régua seja a mesma para os dois lados, eles são
        sempre apresentados na mesma ordem: primeiro quem está no poder, depois quem está fora. A classificação precisa
        de um trecho do texto como prova e indica a intensidade (levemente, moderadamente ou fortemente). O resumo da
        análise é instruído a dizer a mesma coisa que esse marcador.
      </p>
      <p>
        As outras duas são eixos ideológicos, preenchidos só quando o tema realmente envolve economia ou costumes. Uma
        briga eleitoral, por exemplo, não é por si só um tema econômico; nesse caso o eixo aparece como &ldquo;não se
        aplica&rdquo;.
      </p>
      <ul>
        <li>
          <strong>Econômico</strong>: à esquerda, mais papel do Estado na economia, redistribuição e proteção social; à
          direita, livre mercado, menos impostos e gasto público, privatização.
        </li>
        <li>
          <strong>Social</strong>: à esquerda, progressismo em costumes e ampliação de direitos de minorias; à direita,
          valores tradicionais, religião, ênfase em ordem e segurança.
        </li>
      </ul>
      <p>
        Três cuidados orientam essa avaliação. Primeiro, ela mede <strong>como o texto trata o tema</strong>, e não o tema
        em si: uma notícia equilibrada sobre uma política de esquerda não é um texto de esquerda. Segundo, as definições
        são adaptadas ao país do texto, porque o espectro político brasileiro é diferente do americano ou do europeu.
        Terceiro, &ldquo;Não identificado&rdquo; é usado sempre que não há evidência suficiente. Isso é comum e esperado:
        muitos textos não têm inclinação clara, e a ferramenta não força uma classificação.
      </p>

      <h2>Como buscamos imparcialidade</h2>
      <ul>
        <li>
          <strong>A mesma régua para todos.</strong> As instruções da IA são as mesmas para qualquer texto, veículo ou lado
          político.
        </li>
        <li>
          <strong>Teste de inversão.</strong> Antes de apontar algo, a IA é instruída a se perguntar se apontaria a mesma
          coisa num texto que favorecesse o lado oposto.
        </li>
        <li>
          <strong>Teste com lados opostos.</strong> Mantemos um conjunto de textos reais sobre o mesmo fato, de veículos
          de lados opostos e de um veículo mais neutro. Cada mudança no site passa por um teste automático: os dois lados
          precisam receber notas parecidas (diferença de no máximo 1,5 ponto) e inclinações opostas, e o texto mais neutro
          precisa receber nota baixa.
        </li>
        <li>
          <strong>Cores neutras.</strong> Esquerda e direita nunca aparecem com cores diferentes. As cores do site indicam
          só a intensidade do problema.
        </li>
      </ul>

      <h2>Para equilibrar sua leitura</h2>
      <p>
        Depois da análise, a IA faz algumas buscas na web (no máximo {config.balance.maxSearches}) por outras coberturas do
        mesmo assunto, de veículos e perspectivas diferentes, além de dados e fontes primárias. Para cada texto encontrado,
        ela explica o que ele acrescenta em relação ao original.
      </p>
      <ul>
        <li>
          <strong>Só links reais.</strong> O site guarda a lista de resultados que a busca devolveu e descarta qualquer link
          sugerido pela IA que não esteja nessa lista.
        </li>
        <li>
          <strong>Perspectivas diferentes.</strong> A IA é instruída a nunca recomendar só veículos do mesmo lado e a
          priorizar fontes confiáveis. O veículo do texto original fica de fora. Quando o texto pende para um lado, o site
          exige pelo menos um veículo confiável do outro: se a busca não trouxer nenhum, ele faz uma busca a mais só em
          veículos do outro lado (nos EUA, por exemplo, Wall Street Journal ou National Review para textos de esquerda;
          The Atlantic ou NPR para textos de direita).
        </li>
        <li>
          <strong>Linha editorial.</strong> Cada sugestão mostra a linha editorial do veículo (esquerda, centro-esquerda,
          centro, centro-direita, direita, oficial, jurídico, checagem, acadêmico, agência de notícias). Cerca de 78
          veículos e órgãos vêm de uma lista fixa do site, e cada classificação tem uma fonte pública com link: a avaliação
          do Media Bias/Fact Check ou, para veículos brasileiros que ele não avalia, a descrição da linha editorial na
          Wikipédia, com o mês da avaliação. Órgãos públicos (governo, Congresso, STF, TSE) aparecem como &ldquo;oficial&rdquo;. Veículos sem
          fonte clara ficam fora da lista: para eles, a IA faz uma estimativa, marcada como &ldquo;estimativa&rdquo;.
        </li>
        <li>
          <strong>Não é endosso.</strong> Recomendar um texto não significa que ele seja neutro ou correto: ele ajuda a ver o
          assunto por outro ângulo. Vale aplicar a ele o mesmo olhar crítico.
        </li>
      </ul>

      <h2>Afirmações</h2>
      <p>
        Na aba Afirmação você pode analisar uma frase curta, como algo que ouviu numa conversa ou viu nas redes. Além dos
        vieses de linguagem e lógica, o unslant avalia vieses de raciocínio (como generalizar a partir de poucos casos) e
        faz uma <strong>verificação</strong>: que tipo de afirmação é, se dá para verificar, o que se sabe sobre o tema,
        por que essa ideia circula e onde conferir.
      </p>
      <p className="note">
        A verificação usa o conhecimento geral da IA, que tem data de corte e pode estar desatualizado ou errado. Ela não
        consulta fontes durante a verificação. Por isso a IA é orientada a preferir &ldquo;evidência insuficiente&rdquo;
        quando não tiver segurança. Logo abaixo, a seção &ldquo;Onde conferir essa afirmação&rdquo; traz fontes reais
        encontradas na web para você checar por conta própria.
      </p>

      <h2>Limitações que você deve conhecer</h2>
      <ul>
        <li>
          <strong>Imagens: só o que é imagem.</strong> A IA examina as imagens dentro da matéria (até{" "}
          {config.visual.maxUrlImages}) e, em PDFs, as páginas com figuras, gráficos ou tabelas (até{" "}
          {config.visual.maxPdfPages}). Gráficos interativos embutidos (como Datawrapper ou Flourish), vídeos e textos
          colados na aba Texto não têm imagens para analisar. PDFs escaneados (só imagem, sem texto) não são aceitos.
        </li>
        <li>
          <strong>Textos longos levam mais tempo.</strong> Para respeitar o limite de uso por minuto da IA, textos
          longos são analisados em etapas, e a tela avisa quando isso acontece.
        </li>
        <li>
          <strong>A IA também pode errar e ter vieses.</strong> Os modelos de linguagem aprendem com textos humanos e
          carregam vieses deles. As regras acima reduzem esse risco, mas não o eliminam.
        </li>
        <li>
          <strong>Os resultados podem variar um pouco.</strong> Analisar o mesmo texto duas vezes pode gerar notas
          ligeiramente diferentes. Diferenças pequenas (meio ponto, por exemplo) não devem ser interpretadas como
          significativas.
        </li>
        <li>
          <strong>Ironia, sátira e humor</strong> podem ser mal interpretados.
        </li>
        <li>
          <strong>Contexto local muito específico</strong> (política de uma cidade pequena, gírias, acontecimentos muito
          recentes) pode escapar à IA.
        </li>
        <li>
          <strong>A leitura de páginas pode falhar.</strong> Alguns sites bloqueiam leitores automáticos ou escondem o texto
          atrás de paywall. Nesses casos, cole o texto na aba Texto.
        </li>
        <li>
          <strong>A nota é uma medida aproximada</strong>, útil para comparar e para chamar atenção a problemas, mas não é um
          veredito sobre o texto, o autor ou o veículo.
        </li>
      </ul>

      <h2>Tecnologia usada</h2>
      <p>
        As análises são feitas pelo modelo de linguagem <strong>{MODEL_NAME}</strong>. As respostas da IA
        seguem um formato fixo, verificado automaticamente; quando uma resposta vem fora do formato, a etapa é repetida.
        A extração de páginas usa o Readability, a mesma tecnologia do modo de leitura do Firefox.
      </p>

      <h2>Como usar bem o unslant</h2>
      <ul>
        <li>Leia as evidências, não só a nota. Clique nos trechos destacados e veja se concorda.</li>
        <li>Compare com outras fontes sobre o mesmo assunto, de preferência de perspectivas diferentes.</li>
        <li>Use a análise como ponto de partida para pensar, não como palavra final.</li>
      </ul>
    </>
  );
}

export function MethodologyEn() {
  return (
    <>
      <h2>What unslant does, and what it doesn&rsquo;t</h2>
      <p>
        unslant shows <strong>how</strong> a text may shape your reading: loaded words, one-sided sources, numbers without
        context, fallacies, omissions. It does not say whether the author means well or ill, does not decide whom you
        should believe, and does not replace your own reading.
      </p>
      <p>
        Bias is not the same as lying. A text can contain only true facts and still select and arrange them to push the
        reader toward a conclusion. Likewise, an opinion piece can argue for a position without being dishonest: there,
        unslant looks for distortions, omissions and fallacies, not for the existence of an opinion.
      </p>

      <h2>How an analysis works</h2>
      <ol>
        <li>
          <strong>Extraction.</strong> We separate the main text from menus, ads and footers. Tables become readable rows.
          PDFs are read in your own browser, in the right order even in two columns, without the headers and footers
          repeated on every page.
        </li>
        <li>
          <strong>Identification.</strong> The AI identifies the type of text (news, feature, analysis, opinion,
          editorial, paper…), the country and the relevant political context. The type follows fixed criteria (for
          example: a signed piece arguing a position is opinion; a piece stating the outlet&rsquo;s own position is an
          editorial) and uses the section shown by the page as a hint, when there is one. The reason appears in the
          result. If you know the type, you can choose it in the form, and your choice overrides the AI.
        </li>
        <li>
          <strong>Specialists.</strong> The text is examined at the same time by several &ldquo;specialists&rdquo;, each
          looking at a few groups of biases only (language, sources, data, fallacies…). One of them also assesses political
          leaning, the share of fact and opinion, and possible omissions.
        </li>
        <li>
          <strong>Images and charts.</strong> At the same time, the AI examines the content&rsquo;s images: it describes
          each chart, table or photo, compares it with what the text says, and looks for misleading charts (an axis that
          does not start at zero, a cherry-picked time window, a distorted scale) and visual framing. It can only point to
          figures it actually received.
        </li>
        <li>
          <strong>Verification.</strong> Every passage quoted as evidence is searched for in the original text. Anything
          not found is discarded (see below). Scores are calculated by the site itself, with a fixed formula.
        </li>
        <li>
          <strong>Synthesis.</strong> A final summary brings the findings together and suggests how a problematic passage
          could be rewritten neutrally. The neutral version never adds sources, numbers or facts that are not in the
          original; the site checks this automatically and discards the suggestion if it invents anything.
        </li>
      </ol>
      <p>
        There are {TAXONOMY.reduce((s, g) => s + g.categories.length, 0)} categories in {TAXONOMY.length} groups. Some only
        apply to certain content: the academic group is used only for papers, and the reasoning-bias group only for
        claims. See the full list in <Link href="/en/glossary">Types of bias</Link>.
      </p>

      <h2>Every finding must be backed by the text itself</h2>
      <p>
        By default, the analyzed text shows only moderate and strong highlights; mild ones can be revealed with a button.
        Passages flagged in more than one category appear as a single highlight with all explanations. Verbs such as
        &ldquo;stated&rdquo; or &ldquo;claimed&rdquo; are not flagged on their own, only when the sides are treated
        unequally.
      </p>
      <p>
        The AI may only flag a bias if it quotes the exact passage that shows it. Before showing the result, the site
        searches for each quote in the original text, tolerating only differences in quotation marks, spacing and
        capitalization. If the quote does not exist, it is <strong>discarded</strong> and the category loses that finding.
        The number of discarded passages is shown at the end of each analysis.
      </p>
      <p>
        This keeps the AI from &ldquo;inventing&rdquo; problems and lets you check every finding yourself: just click the
        highlighted passage.
      </p>
      <p>
        <strong>Quotes belong to the speaker, not the author.</strong> When the text quotes a politician, expert or
        interviewee, that quote is not treated as the author&rsquo;s opinion presented as fact, nor as the author&rsquo;s
        language. The site checks this automatically and discards such findings. Quotes can still count when the problem
        is the author&rsquo;s choice, for example giving voice to only one side.
      </p>

      <h2>How the 0–10 score is calculated</h2>
      <p>Each category gets a score on this scale:</p>
      <ul>
        <li><strong>0</strong>: no problem</li>
        <li><strong>1 to 3</strong>: mild or isolated problems</li>
        <li><strong>4 to 6</strong>: clear, recurring problems</li>
        <li><strong>7 and 8</strong>: strong bias that shapes the reading</li>
        <li><strong>9 and 10</strong>: severe, systematic distortion</li>
      </ul>
      <p>
        Each score comes with a confidence level (low, medium or high). The AI distinguishes two situations: &ldquo;no
        problem&rdquo; (the text has material for that category and handles it well, which counts as 0) and &ldquo;not
        applicable&rdquo; (the text has no material for it, like data categories in a text without numbers). Categories
        that do not apply are <strong>left out</strong> of the calculation, and the result shows how many there were.
      </p>
      <p>
        To keep scores consistent, the AI is given reference descriptions: a 2 is a balanced story with the odd
        unnecessary adjective; a 5 gives far more space to one side and uses some loaded words but still reports the
        facts; an 8 is campaign material dressed up as news.
      </p>
      <p>
        Each group&rsquo;s score combines its worst category ({pct(SCORING.groupMaxShare)}) with the average of its
        categories ({pct(1 - SCORING.groupMaxShare)}), where low-confidence findings weigh less.
      </p>
      <p>
        The <strong>overall score</strong> combines the weighted average of the groups ({pct(1 - SCORING.topGroupsShare)})
        with the average of the {SCORING.topGroupsCount} highest-scoring groups ({pct(SCORING.topGroupsShare)}). The second
        part keeps a text that is heavily biased in a few aspects from looking balanced just because it is fine in the
        others. Current group weights:
      </p>
      <WeightsList lang="en" />
      <p>And the overall score bands:</p>
      <Bands lang="en" />
      <p>
        The score measures how biased the text is <strong>overall</strong>, not just politically. A text can score high
        with no political leaning at all, for example through sensationalism or misleading use of numbers.
      </p>

      <h2>Political leaning</h2>
      <p>
        Leaning is assessed in three parts. The first is <strong>which side of a dispute the text favors</strong>: when
        the text covers a concrete dispute (government × opposition, candidate A × candidate B), the AI says whether it
        favors one side, is balanced, or cannot be determined. To apply the same yardstick to both sides, they are always
        listed in the same order: first whoever holds power, then whoever is outside it. The classification must be backed
        by a passage from the text and states the intensity (slightly, moderately or strongly). The analysis summary is
        instructed to say the same thing as this marker.
      </p>
      <p>
        The other two are ideological axes, filled in only when the topic really involves the economy or social values.
        An electoral fight, for example, is not an economic topic in itself; in that case the axis shows as &ldquo;not
        applicable&rdquo;.
      </p>
      <ul>
        <li>
          <strong>Economic</strong>: on the left, a larger role for the state in the economy, redistribution and social
          protection; on the right, free markets, lower taxes and spending, privatization.
        </li>
        <li>
          <strong>Social</strong>: on the left, progressive values and expanded minority rights; on the right, traditional
          values, religion, emphasis on order and security.
        </li>
      </ul>
      <p>
        Three principles guide this assessment. First, it measures <strong>how the text treats the topic</strong>, not the
        topic itself: a balanced story about a left-wing policy is not a left-wing text. Second, the definitions are
        adapted to the text&rsquo;s country, because political spectrums differ between countries. Third,
        &ldquo;Unidentified&rdquo; is used whenever there is not enough evidence. This is common and expected: many texts
        have no clear leaning, and the tool does not force a label.
      </p>

      <h2>How we pursue impartiality</h2>
      <ul>
        <li>
          <strong>Same yardstick for everyone.</strong> The AI&rsquo;s instructions are the same for any text, outlet or
          political side.
        </li>
        <li>
          <strong>Inversion test.</strong> Before flagging something, the AI is instructed to ask whether it would flag the
          same thing in a text favoring the opposite side.
        </li>
        <li>
          <strong>Opposite-sides test.</strong> We keep a set of real texts about the same event, from outlets on opposite
          sides and from a more neutral outlet. Every change to the site goes through an automatic test: both sides must
          get similar scores (at most 1.5 points apart) and opposite leanings, and the more neutral text must get a low
          score.
        </li>
        <li>
          <strong>Neutral colors.</strong> Left and right never appear in different colors. The site&rsquo;s colors only
          indicate how severe a problem is.
        </li>
      </ul>

      <h2>To balance your reading</h2>
      <p>
        After the analysis, the AI runs a few web searches (at most {config.balance.maxSearches}) for other coverage of the
        same topic, from different outlets and perspectives, plus data and primary sources. For each text it finds, it
        explains what that text adds compared with the original.
      </p>
      <ul>
        <li>
          <strong>Real links only.</strong> The site keeps the list of results returned by the search and discards any link
          suggested by the AI that is not on that list.
        </li>
        <li>
          <strong>Different perspectives.</strong> The AI is instructed never to recommend outlets from a single side and
          to prioritize reliable sources. The original text&rsquo;s outlet is excluded. When the text leans one way, the
          site requires at least one reliable outlet from the other side: if the search finds none, it runs one more search
          limited to outlets from the other side (in the US, for example, the Wall Street Journal or National Review for
          left-leaning texts; The Atlantic or NPR for right-leaning ones).
        </li>
        <li>
          <strong>Editorial line.</strong> Each suggestion shows the outlet&rsquo;s editorial line (left, center-left,
          center, center-right, right, official, legal, fact-checking, academic, news agency). About 78 outlets and
          bodies come from a fixed list kept by the site, and each classification has a public source with a link: the
          Media Bias/Fact Check rating or, for Brazilian outlets it does not rate, the description of the editorial line on
          Portuguese Wikipedia, with the month of the rating. Public bodies (government, Congress, courts) appear as &ldquo;official&rdquo;. Outlets
          without a clear source are left off the list: for them the AI makes an estimate, marked as &ldquo;estimate&rdquo;.
        </li>
        <li>
          <strong>Not an endorsement.</strong> Recommending a text does not mean it is neutral or correct: it helps you see
          the topic from another angle. Read it with the same critical eye.
        </li>
      </ul>

      <h2>Claims</h2>
      <p>
        In the Claim tab you can analyze a short statement, such as something you heard in a conversation or saw on social
        media. Besides language and logic biases, unslant looks at reasoning biases (such as generalizing from a few cases)
        and runs a <strong>claim check</strong>: what kind of claim it is, whether it can be checked, what is known about
        the topic, why the idea circulates and where to check it.
      </p>
      <p className="note">
        The claim check relies on the AI&rsquo;s general knowledge, which has a cutoff date and may be outdated or wrong.
        It does not consult sources during the check. That is why the AI is told to prefer &ldquo;not enough
        evidence&rdquo; when unsure. Right below, the &ldquo;Where to check this claim&rdquo; section lists real sources
        found on the web so you can check for yourself.
      </p>

      <h2>Limitations you should know about</h2>
      <ul>
        <li>
          <strong>Images: only what is an image.</strong> The AI examines the images inside the article (up to{" "}
          {config.visual.maxUrlImages}) and, in PDFs, the pages with figures, charts or tables (up to{" "}
          {config.visual.maxPdfPages}). Embedded interactive charts (such as Datawrapper or Flourish), videos and text
          pasted in the Text tab have no images to analyze. Scanned PDFs (images only, no text) are not accepted.
        </li>
        <li>
          <strong>Long texts take longer.</strong> To respect the AI&rsquo;s per-minute usage limit, long texts are
          analyzed in stages, and the screen says so when that happens.
        </li>
        <li>
          <strong>The AI can be wrong and biased too.</strong> Language models learn from human writing and carry its
          biases. The rules above reduce this risk but do not remove it.
        </li>
        <li>
          <strong>Results can vary slightly.</strong> Analyzing the same text twice may produce slightly different scores.
          Small differences (half a point, for example) should not be read as meaningful.
        </li>
        <li>
          <strong>Irony, satire and humor</strong> can be misread.
        </li>
        <li>
          <strong>Very specific local context</strong> (small-town politics, slang, very recent events) may escape the AI.
        </li>
        <li>
          <strong>Page reading can fail.</strong> Some sites block automated readers or hide text behind a paywall. If so,
          paste the text into the Text tab.
        </li>
        <li>
          <strong>The score is an approximation</strong>, useful for comparing and for flagging problems, but not a verdict
          on the text, the author or the outlet.
        </li>
      </ul>

      <h2>Technology</h2>
      <p>
        Analyses are performed by the <strong>{MODEL_NAME}</strong> language model. The AI&rsquo;s answers
        follow a fixed format that is checked automatically; when an answer is malformed, the step is repeated. Page
        extraction uses Readability, the same technology behind Firefox&rsquo;s reader view.
      </p>

      <h2>How to get the most out of unslant</h2>
      <ul>
        <li>Read the evidence, not just the score. Click the highlighted passages and see whether you agree.</li>
        <li>Compare with other sources on the same topic, ideally from different perspectives.</li>
        <li>Use the analysis as a starting point for thinking, not as the final word.</li>
      </ul>
    </>
  );
}
