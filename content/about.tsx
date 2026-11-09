/**
 * ============================================================================
 *  TEXTO DA PÁGINA "QUEM SOMOS" (português e inglês)
 * ============================================================================
 *  Pode editar livremente. Quando houver um e-mail de contato, acrescente
 *  uma seção "Contato" aqui.
 * ============================================================================
 */

import Link from "next/link";

export function AboutPt() {
  return (
    <>
      <h2>Quem está por trás</h2>
      <p>
        O unslant é um projeto independente criado por <strong>Felipe Viscardi</strong>, estudante de Economia e Business
        na Northeastern University. Não pertence a nenhum veículo de imprensa, partido, empresa ou grupo de interesse.
      </p>

      <h2>Por que o unslant existe</h2>
      <p>
        Todo texto faz escolhas: quais palavras usar, quem ouvir, quais números mostrar, o que deixar de fora. Essas escolhas
        moldam a forma como entendemos um assunto, muitas vezes sem que a gente perceba. Criei o unslant para que qualquer
        pessoa consiga enxergar com clareza os possíveis vieses de uma notícia, de um artigo ou de uma simples afirmação, de
        um jeito fácil, didático e acessível a todos.
      </p>
      <p>
        O objetivo não é dizer em quem acreditar. É dar a você as ferramentas para ler com mais atenção e chegar às suas
        próprias conclusões.
      </p>

      <h2>Para que usar</h2>
      <p>
        O unslant foi pensado para os momentos em que a qualidade da informação importa: quando você está preparando um
        argumento, fazendo uma pesquisa, escrevendo um artigo ou uma notícia, ou simplesmente quer entender melhor algo que
        leu ou ouviu.
      </p>

      <h2>Nossos compromissos</h2>
      <ul>
        <li>
          <strong>A mesma régua para todos.</strong> Textos de qualquer lado político, veículo ou autor são analisados com
          os mesmos critérios. É por isso que testamos a ferramenta com textos espelhados, que contam o mesmo fato com viés
          para lados opostos.
        </li>
        <li>
          <strong>Nenhum vínculo político.</strong> O unslant não tem ligação com partidos, candidatos ou políticos.
        </li>
        <li>
          <strong>Nenhum dinheiro de partidos ou governos.</strong> Não aceitamos recursos de partidos políticos, governos,
          igrejas ou organizações que possam ter interesse nos resultados.
        </li>
        <li>
          <strong>Correção pública de erros.</strong> Quando errarmos, vamos corrigir e dizer o que mudou.
        </li>
        <li>
          <strong>Transparência sobre o uso de IA.</strong> As análises são feitas por inteligência artificial, que também
          pode errar e ter vieses. Explicamos como ela funciona, quais regras segue e quais são seus limites na{" "}
          <Link href="/pt/methodology">Metodologia</Link>.
        </li>
      </ul>

      <h2>Como o unslant se mantém</h2>
      <p>
        O projeto é sustentado pelos planos pagos dos próprios usuários. Essa escolha existe para proteger a independência
        das análises: quem paga pelo unslant são as pessoas que o usam, e não quem poderia querer influenciar os
        resultados.
      </p>
    </>
  );
}

export function AboutEn() {
  return (
    <>
      <h2>Who is behind it</h2>
      <p>
        unslant is an independent project created by <strong>Felipe Viscardi</strong>, an Economics and Business student at
        Northeastern University. It does not belong to any media outlet, political party, company or interest group.
      </p>

      <h2>Why unslant exists</h2>
      <p>
        Every text makes choices: which words to use, whom to quote, which numbers to show, what to leave out. Those choices
        shape how we understand a topic, often without our noticing. I created unslant so that anyone can clearly see the
        possible biases in a news story, an article or a simple claim, in a way that is easy, educational and accessible to
        everyone.
      </p>
      <p>
        The goal is not to tell you whom to believe. It is to give you the tools to read more carefully and reach your own
        conclusions.
      </p>

      <h2>What it is for</h2>
      <p>
        unslant is built for the moments when the quality of information matters: when you are preparing an argument,
        doing research, writing an article or a news story, or simply want to understand something you read or heard.
      </p>

      <h2>Our commitments</h2>
      <ul>
        <li>
          <strong>The same yardstick for everyone.</strong> Texts from any political side, outlet or author are analyzed
          with the same criteria. That is why we test the tool with mirrored texts that tell the same story slanted in
          opposite directions.
        </li>
        <li>
          <strong>No political ties.</strong> unslant has no connection to parties, candidates or politicians.
        </li>
        <li>
          <strong>No money from parties or governments.</strong> We do not accept funds from political parties,
          governments, churches or organizations that could have an interest in the results.
        </li>
        <li>
          <strong>Public corrections.</strong> When we get something wrong, we will fix it and say what changed.
        </li>
        <li>
          <strong>Transparency about AI.</strong> Analyses are performed by artificial intelligence, which can also make
          mistakes and be biased. We explain how it works, what rules it follows and where it falls short in the{" "}
          <Link href="/en/methodology">Methodology</Link>.
        </li>
      </ul>

      <h2>How unslant is funded</h2>
      <p>
        The project is supported by its users&rsquo; paid plans. This choice protects the independence of the analyses:
        unslant is paid for by the people who use it, not by anyone who might want to influence the results.
      </p>
    </>
  );
}
