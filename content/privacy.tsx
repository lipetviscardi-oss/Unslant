/**
 * ============================================================================
 *  TEXTO DA PÁGINA "PRIVACIDADE" (português e inglês)
 * ============================================================================
 *  Descreve o funcionamento ATUAL do site: contas por e-mail, "Minhas
 *  análises", limites diários e resultados guardados para reaproveitar.
 *  Os prazos e o e-mail de contato vêm de lib/config.ts (config.privacy).
 *  Quando os pagamentos entrarem (Fase 5), esta página precisa ser
 *  atualizada ANTES de essa função ir ao ar.
 * ============================================================================
 */

import { config } from "@/lib/config";

/** Aviso mostrado enquanto o site usa o Gemini grátis (fase de testes). */
const TESTING_WITH_GEMINI = config.ai.provider === "gemini";

const { cacheDays, usageDays, contactEmail } = config.privacy;

export const PRIVACY_UPDATED = { pt: "novembro de 2026", en: "November 2026" };

function Contact({ lang }: { lang: "pt" | "en" }) {
  if (contactEmail) {
    return (
      <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
    );
  }
  return <>{lang === "pt" ? "o e-mail de contato, que será informado aqui" : "the contact email, which will be listed here"}</>;
}

export function PrivacyPt() {
  return (
    <>
      {TESTING_WITH_GEMINI && (
        <p className="note">
          <strong>Versão de testes:</strong> no momento, as análises estão sendo feitas pelo Google Gemini, no plano
          gratuito. Nesse plano, o Google pode usar o conteúdo enviado para melhorar os modelos dele. Não envie textos
          privados. A descrição abaixo vale para a versão final do site.
        </p>
      )}
      <h2>Em resumo</h2>
      <ul>
        <li>Você pode usar o unslant sem conta. Com conta, pedimos só o seu e-mail.</li>
        <li>O conteúdo que você envia é usado só para gerar a análise. Não vendemos dados e não os usamos para publicidade.</li>
        <li>Quem tem conta encontra as próprias análises em &ldquo;Minhas análises&rdquo; e pode apagá-las, ou apagar a conta inteira, a qualquer momento.</li>
        <li>Não usamos ferramentas de rastreamento nem de publicidade.</li>
      </ul>

      <h2>O que acontece com o que você envia</h2>
      <ul>
        <li>
          <strong>Links:</strong> nosso servidor acessa a página, extrai o texto principal e algumas imagens da matéria
          (gráficos, tabelas, fotos com legenda) e os envia para análise.
        </li>
        <li>
          <strong>Textos e afirmações:</strong> são enviados para análise exatamente como você os escreveu ou colou, junto
          com o contexto opcional que você informar.
        </li>
        <li>
          <strong>PDFs:</strong> o arquivo é lido no seu próprio navegador e não é enviado inteiro ao nosso servidor.
          Seguem para análise o texto extraído e imagens das páginas que têm figuras, gráficos ou tabelas (no máximo{" "}
          {config.visual.maxPdfPages}), para que a IA possa examiná-los.
        </li>
      </ul>
      <p>
        A análise é feita pela IA da <strong>Anthropic</strong>, empresa que desenvolve os modelos Claude. O conteúdo é
        enviado a ela pela API, e a Anthropic o processa conforme a política de privacidade e os termos comerciais dela.
        Segundo esses termos, o conteúdo enviado por clientes da API não é usado para treinar os modelos. Detalhes em{" "}
        <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">
          anthropic.com/legal/privacy
        </a>
        .
      </p>
      <p>
        Para a seção &ldquo;Para equilibrar sua leitura&rdquo;, a IA faz buscas na web sobre o tema do texto, usando a
        ferramenta de busca da Anthropic. Os termos buscados são escritos pela IA a partir do assunto, não são o texto
        completo que você enviou. Os links recomendados levam a sites de terceiros, que têm suas próprias políticas de
        privacidade.
      </p>

      <h2>O que guardamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> o seu e-mail, as datas de criação e de acesso e o fuso horário do seu primeiro uso (o
          limite diário zera à meia-noite dele). O login é por um link enviado ao seu e-mail; não guardamos senha.
        </li>
        <li>
          <strong>Minhas análises</strong> (só com conta): o resultado de cada análise que você faz, com título, link,
          nota e o texto analisado (os destaques apontam para ele). Ficam guardadas até você apagá-las ou apagar a conta.
        </li>
        <li>
          <strong>Uso diário:</strong> para os limites de análises por dia, registramos o dia e o tipo de cada análise
          (simples ou detalhada). Para quem não tem conta, o registro é ligado a dois códigos anônimos: um gerado a partir
          de um cookie e outro a partir do endereço de internet (IP). Os dois são resumos irreversíveis: o banco nunca
          recebe o endereço em si. Esses registros são apagados depois de {usageDays} dias.
        </li>
        <li>
          <strong>Resultados reaproveitados:</strong> quando um texto já foi analisado, o mesmo resultado sai na hora para
          quem enviar o mesmo texto de novo, sem custo e sem gastar o limite. Para isso, guardamos o resultado (com o
          texto analisado) por até {cacheDays} dias, <strong>sem nenhuma ligação com quem enviou</strong>. Por isso, apagar
          uma análise da sua conta não apaga essa cópia anônima, que some sozinha no fim do prazo.
        </li>
        <li>
          <strong>Registros técnicos:</strong> registros de funcionamento (por exemplo, o tipo de erro quando uma análise
          falha) não incluem o conteúdo enviado. O serviço de hospedagem pode registrar dados técnicos de acesso, como o
          IP, por um período curto, para segurança e funcionamento.
        </li>
      </ul>

      <h2>Onde os dados ficam</h2>
      <p>
        As contas e o banco de dados ficam no <strong>Supabase</strong>, em servidores no leste dos Estados Unidos. A
        análise é feita pela Anthropic, também nos Estados Unidos. Ou seja: se você está no Brasil ou no Reino Unido, os
        seus dados são transferidos para os Estados Unidos para que o serviço funcione. Essas empresas processam os dados
        em nosso nome e só para isso.
      </p>

      <h2>Cookies e armazenamento no navegador</h2>
      <ul>
        <li>
          <strong>Idioma:</strong> lembra o idioma que você escolheu (português ou inglês).
        </li>
        <li>
          <strong>Sessão:</strong> mantém você conectado à sua conta (só existe se você entrar).
        </li>
        <li>
          <strong>Visitante:</strong> um código aleatório que conta a análise grátis de quem não tem conta. Ele não
          contém dados pessoais e dura até 1 ano.
        </li>
        <li>
          <strong>Tipo de análise:</strong> o seu navegador lembra se você prefere a análise simples ou a detalhada. Essa
          escolha fica só no seu aparelho.
        </li>
      </ul>
      <p>Nenhum deles é usado para publicidade ou para seguir você em outros sites.</p>

      <h2>Os seus direitos</h2>
      <p>
        Pelas leis de proteção de dados (como a LGPD, no Brasil, o UK GDPR, no Reino Unido, e as leis de privacidade da
        Califórnia, nos Estados Unidos), você pode pedir para ver, corrigir, receber uma cópia ou apagar os seus dados.
        No próprio site, você já pode ver e apagar as suas análises em &ldquo;Minhas análises&rdquo; e apagar a sua
        conta, o que apaga também todas as análises dela. Para qualquer outro pedido, escreva para <Contact lang="pt" />.
      </p>

      <h2>Cuidados recomendados</h2>
      <p>
        Evite enviar textos com dados pessoais sensíveis, seus ou de outras pessoas, como documentos, endereços,
        informações de saúde ou conversas privadas. O unslant foi feito para analisar conteúdo público ou de interesse
        público.
      </p>

      <h2>Mudanças nesta política</h2>
      <p>
        Quando o unslant passar a ter pagamentos, ou quando mudar o que guardamos, esta página será atualizada antes de a
        mudança entrar no ar.
      </p>
      <p className="note">Última atualização: {PRIVACY_UPDATED.pt}.</p>
    </>
  );
}

export function PrivacyEn() {
  return (
    <>
      {TESTING_WITH_GEMINI && (
        <p className="note">
          <strong>Testing version:</strong> analyses are currently performed by Google Gemini on its free tier. On that
          tier, Google may use submitted content to improve its models. Do not send private texts. The description below
          applies to the final version of the site.
        </p>
      )}
      <h2>In short</h2>
      <ul>
        <li>You can use unslant without an account. With an account, we only ask for your email.</li>
        <li>What you send is used only to produce the analysis. We don&rsquo;t sell data or use it for advertising.</li>
        <li>Account holders find their analyses in &ldquo;My analyses&rdquo; and can delete them, or the whole account, at any time.</li>
        <li>We don&rsquo;t use tracking or advertising tools.</li>
      </ul>

      <h2>What happens to what you send</h2>
      <ul>
        <li>
          <strong>Links:</strong> our server fetches the page, extracts the main text and some of the article&rsquo;s
          images (charts, tables, captioned photos) and sends them for analysis.
        </li>
        <li>
          <strong>Texts and claims:</strong> are sent for analysis exactly as you typed or pasted them, together with any
          optional context you provide.
        </li>
        <li>
          <strong>PDFs:</strong> the file is read in your own browser and is not sent to our server in full. What is sent
          for analysis is the extracted text and images of the pages that contain figures, charts or tables (at most{" "}
          {config.visual.maxPdfPages}), so the AI can examine them.
        </li>
      </ul>
      <p>
        The analysis is performed by AI from <strong>Anthropic</strong>, the company that develops the Claude models. The
        content is sent to Anthropic through its API and processed under Anthropic&rsquo;s privacy policy and commercial
        terms. Under those terms, content sent by API customers is not used to train its models. Details at{" "}
        <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">
          anthropic.com/legal/privacy
        </a>
        .
      </p>
      <p>
        For the &ldquo;To balance your reading&rdquo; section, the AI runs web searches on the topic of the text, using
        Anthropic&rsquo;s search tool. The search terms are written by the AI based on the topic; they are not the full text
        you sent. Recommended links lead to third-party sites, which have their own privacy policies.
      </p>

      <h2>What we keep</h2>
      <ul>
        <li>
          <strong>Account:</strong> your email, when the account was created and last used, and the time zone of your
          first use (the daily limit resets at its midnight). You sign in with a link sent to your email; we don&rsquo;t
          store a password.
        </li>
        <li>
          <strong>My analyses</strong> (accounts only): the result of each analysis you run, with title, link, score and
          the analyzed text (the highlights point to it). They are kept until you delete them or delete your account.
        </li>
        <li>
          <strong>Daily usage:</strong> to enforce the daily limits, we record the day and the type of each analysis
          (simple or detailed). For visitors without an account, the record is tied to two anonymous codes: one derived
          from a cookie and one from the internet (IP) address. Both are irreversible digests: the database never receives
          the address itself. These records are deleted after {usageDays} days.
        </li>
        <li>
          <strong>Reused results:</strong> when a text has already been analyzed, the same result is shown instantly to
          anyone who sends the same text again, at no cost and without using up the limit. For that, we keep the result
          (with the analyzed text) for up to {cacheDays} days, <strong>with no link to whoever sent it</strong>. So
          deleting an analysis from your account does not delete this anonymous copy, which expires on its own.
        </li>
        <li>
          <strong>Technical logs:</strong> operation logs (for example, the type of error when an analysis fails) do not
          include the content you sent. The hosting provider may log technical access data, such as IP addresses, for a
          short period, for security and operation.
        </li>
      </ul>

      <h2>Where the data is stored</h2>
      <p>
        Accounts and the database are hosted by <strong>Supabase</strong>, on servers in the eastern United States. The
        analysis is performed by Anthropic, also in the United States. So if you are in Brazil or the United Kingdom, your
        data is transferred to the United States for the service to work. These companies process the data on our behalf
        and only for that purpose.
      </p>

      <h2>Cookies and browser storage</h2>
      <ul>
        <li>
          <strong>Language:</strong> remembers the language you chose (Portuguese or English).
        </li>
        <li>
          <strong>Session:</strong> keeps you signed in to your account (only exists if you sign in).
        </li>
        <li>
          <strong>Visitor:</strong> a random code that counts the free analysis for people without an account. It contains
          no personal data and lasts up to 1 year.
        </li>
        <li>
          <strong>Analysis type:</strong> your browser remembers whether you prefer the simple or the detailed analysis.
          This choice stays on your device only.
        </li>
      </ul>
      <p>None of them is used for advertising or to follow you on other sites.</p>

      <h2>Your rights</h2>
      <p>
        Under data protection laws (such as Brazil&rsquo;s LGPD, the UK GDPR and California&rsquo;s privacy laws), you can
        ask to access, correct, receive a copy of or delete your data. On the site itself, you can already view and delete
        your analyses in &ldquo;My analyses&rdquo; and delete your account, which also deletes all of its analyses. For
        any other request, write to <Contact lang="en" />.
      </p>

      <h2>Recommended care</h2>
      <p>
        Avoid sending texts containing sensitive personal data, yours or anyone else&rsquo;s, such as ID documents,
        addresses, health information or private conversations. unslant is meant for analyzing public content or content
        of public interest.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        When unslant introduces payments, or changes what we keep, this page will be updated before the change goes
        live.
      </p>
      <p className="note">Last updated: {PRIVACY_UPDATED.en}.</p>
    </>
  );
}
