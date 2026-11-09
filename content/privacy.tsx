/**
 * ============================================================================
 *  TEXTO DA PÁGINA "PRIVACIDADE" (português e inglês)
 * ============================================================================
 *  IMPORTANTE: este texto descreve o funcionamento ATUAL do site (sem
 *  contas, sem banco de dados). Quando o login e o histórico entrarem
 *  (Fase 4) e os pagamentos (Fase 5), esta página precisa ser atualizada
 *  ANTES de essas funções irem ao ar.
 * ============================================================================
 */

export const PRIVACY_UPDATED = { pt: "novembro de 2026", en: "November 2026" };

export function PrivacyPt() {
  return (
    <>
      <h2>Em resumo</h2>
      <ul>
        <li>Não é preciso criar conta nem informar nome ou e-mail para usar o unslant.</li>
        <li>O conteúdo que você envia é usado só para gerar a análise e não é vendido nem compartilhado para publicidade.</li>
        <li>Nesta versão do site, não guardamos os textos enviados nem os resultados das análises.</li>
        <li>Não usamos ferramentas de rastreamento ou de publicidade.</li>
      </ul>

      <h2>O que acontece com o que você envia</h2>
      <ul>
        <li>
          <strong>Links:</strong> nosso servidor acessa a página, extrai o texto principal e o envia para análise.
        </li>
        <li>
          <strong>Textos e afirmações:</strong> são enviados para análise exatamente como você os escreveu ou colou, junto
          com o contexto opcional que você informar.
        </li>
        <li>
          <strong>PDFs:</strong> o arquivo é lido no seu próprio navegador e não é enviado ao nosso servidor. Apenas o
          texto extraído segue para análise.
        </li>
      </ul>
      <p>
        A análise é feita pela IA da <strong>Anthropic</strong>, empresa que desenvolve os modelos Claude. O texto é
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
      <p>
        Nesta versão, nenhum texto ou resultado é guardado em banco de dados: o resultado aparece na sua tela e some quando
        você fecha a página ou começa uma nova análise. Registros técnicos de funcionamento (por exemplo, o tipo de erro
        quando uma análise falha) não incluem o conteúdo enviado. O serviço de hospedagem do site pode registrar dados
        técnicos de acesso, como endereço IP, por um período curto, para segurança e funcionamento.
      </p>

      <h2>Cookies</h2>
      <p>
        Usamos um único cookie, para lembrar o idioma que você escolheu (português ou inglês). Ele não identifica você e
        não é usado para publicidade.
      </p>

      <h2>Cuidados recomendados</h2>
      <p>
        Evite enviar textos com dados pessoais sensíveis, seus ou de outras pessoas, como documentos, endereços,
        informações de saúde ou conversas privadas. O unslant foi feito para analisar conteúdo público ou de interesse
        público.
      </p>

      <h2>Mudanças nesta política</h2>
      <p>
        Quando o unslant passar a ter contas de usuário, histórico de análises ou pagamentos, esta página será atualizada
        antes de essas funções entrarem no ar, explicando quais dados passarão a ser guardados, por quanto tempo e como
        excluí-los.
      </p>
      <p className="note">Última atualização: {PRIVACY_UPDATED.pt}.</p>
    </>
  );
}

export function PrivacyEn() {
  return (
    <>
      <h2>In short</h2>
      <ul>
        <li>You don&rsquo;t need an account, name or email to use unslant.</li>
        <li>What you send is used only to produce the analysis and is never sold or shared for advertising.</li>
        <li>In this version of the site, we do not store the texts you send or the results of analyses.</li>
        <li>We don&rsquo;t use tracking or advertising tools.</li>
      </ul>

      <h2>What happens to what you send</h2>
      <ul>
        <li>
          <strong>Links:</strong> our server fetches the page, extracts the main text and sends it for analysis.
        </li>
        <li>
          <strong>Texts and claims:</strong> are sent for analysis exactly as you typed or pasted them, together with any
          optional context you provide.
        </li>
        <li>
          <strong>PDFs:</strong> the file is read in your own browser and is not sent to our server. Only the extracted text
          is sent for analysis.
        </li>
      </ul>
      <p>
        The analysis is performed by AI from <strong>Anthropic</strong>, the company that develops the Claude models. The
        text is sent to Anthropic through its API and processed under Anthropic&rsquo;s privacy policy and commercial
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
      <p>
        In this version, no text or result is stored in a database: the result appears on your screen and disappears when
        you close the page or start a new analysis. Technical operation logs (for example, the type of error when an
        analysis fails) do not include the content you sent. The site&rsquo;s hosting provider may log technical access
        data, such as IP addresses, for a short period, for security and operation.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a single cookie to remember the language you chose (Portuguese or English). It does not identify you and is
        not used for advertising.
      </p>

      <h2>Recommended care</h2>
      <p>
        Avoid sending texts containing sensitive personal data, yours or anyone else&rsquo;s, such as ID documents,
        addresses, health information or private conversations. unslant is meant for analyzing public content or content
        of public interest.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        When unslant introduces user accounts, analysis history or payments, this page will be updated before those
        features go live, explaining what data will be stored, for how long and how to delete it.
      </p>
      <p className="note">Last updated: {PRIVACY_UPDATED.en}.</p>
    </>
  );
}
