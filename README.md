# unslant

O unslant analisa um texto (link de matéria, texto colado, PDF ou uma afirmação curta) e mostra os vieses que ele contém, sempre com o **trecho exato do texto** como prova. Ele também mostra a inclinação política em dois eixos e o que o texto pode estar omitindo.

> Projeto em construção. Fases 1 e 2 prontas (análise completa e busca de textos para equilibrar), sem login.

---

## Índice

1. [O que já funciona](#o-que-já-funciona)
2. [Como rodar no seu computador](#como-rodar-no-seu-computador)
3. [Chave da Anthropic](#chave-da-anthropic)
4. [Como testar](#como-testar)
5. [Arquivos que você pode editar](#arquivos-que-você-pode-editar)
6. [Quanto custa](#quanto-custa)
7. [Problemas comuns](#problemas-comuns)
8. [Como o projeto está organizado](#como-o-projeto-está-organizado)
9. [Próximas fases](#próximas-fases)

---

## O que já funciona

- Quatro formas de enviar conteúdo: **Link**, **Texto**, **PDF** e **Afirmação** (frases curtas, como "os jovens de hoje não querem trabalhar").
- **Site em português e inglês**: o botão de idioma no topo troca o site inteiro, e o relatório sai no mesmo idioma. Quem abre o site pela primeira vez vai para o idioma do navegador.
- **Afirmações** têm análise própria: um grupo extra, "Vieses de raciocínio", e uma **verificação** (que tipo de afirmação é, o que se sabe, por que a ideia circula, como conferir e uma versão mais precisa).
- Páginas **Metodologia**, **Tipos de viés** (gerada automaticamente a partir da taxonomia), **Privacidade** e **Quem somos**, nos dois idiomas.
- Análise em **52 categorias de viés**, organizadas em 12 grupos. O grupo de papers acadêmicos é ativado sozinho quando o texto é um paper, e o de vieses de raciocínio, nas afirmações.
- **Nota geral de 0 a 10**, calculada pelo próprio site a partir das notas das categorias.
- **Inclinação política** em dois eixos (econômico e social), com justificativa e trecho. Se não houver evidência suficiente, aparece "Não identificado".
- **Texto original com os trechos destacados.** Ao clicar num destaque, aparecem a categoria e a explicação.
- Resumo, proporção de fato e opinião, "o que o texto pode estar omitindo" e uma sugestão de reescrita neutra.
- **Conferência de citações:** cada trecho citado pela IA é procurado no texto original e descartado se não for encontrado.
- **Para equilibrar sua leitura:** depois da análise, a IA busca na web outras coberturas do mesmo assunto, de perspectivas diferentes, e explica o que cada uma acrescenta. Só aparecem links que vieram de fato da busca (o site confere).
- **Dois exemplos prontos** (uma notícia e uma afirmação), que funcionam sem chave e sem custo.

---

## Como rodar no seu computador

Você só precisa fazer os passos 1 a 4 **uma vez**.

### 1. Instalar o Node.js

O Node.js é o programa que faz o site funcionar no seu computador.

1. Acesse **https://nodejs.org**.
2. Clique no botão da versão **LTS**, que é a recomendada.
3. Abra o arquivo baixado e clique em **Avançar/Continuar** até o fim, mantendo as opções padrão.
4. **Para conferir se deu certo**, abra o terminal:
   - **Windows:** aperte a tecla Windows, digite `PowerShell` e aperte Enter.
   - **Mac:** aperte Cmd + Espaço, digite `Terminal` e aperte Enter.
5. No terminal, digite o comando abaixo e aperte Enter:
   ```bash
   node --version
   ```
   **Se deu certo:** aparece um número de versão, como `v22.11.0`. Qualquer versão a partir da 20 serve.

### 2. Baixar o projeto do GitHub

O jeito mais fácil, que também facilita receber as atualizações de cada fase, é usar o **GitHub Desktop**:

1. Baixe e instale em **https://desktop.github.com**.
2. Abra o programa e entre com a sua conta do GitHub.
3. Clique em **File → Clone repository** e escolha **Unslant** na lista.
4. Em *Local path*, escolha onde salvar (por exemplo, a pasta Documentos) e clique em **Clone**.
5. **Para receber atualizações no futuro:** abra o GitHub Desktop e clique em **Fetch origin**, depois em **Pull origin**.

### 3. Abrir o terminal na pasta do projeto

- **No GitHub Desktop:** clique em **Repository → Open in Command Prompt** (Windows) ou **Open in Terminal** (Mac).
- **Para conferir:** digite o comando abaixo e aperte Enter. Deve aparecer uma lista com `package.json`, `README.md` e outros arquivos.
  - Windows:
    ```bash
    dir
    ```
  - Mac:
    ```bash
    ls
    ```

### 4. Instalar as bibliotecas do projeto

No terminal aberto na pasta do projeto, digite:

```bash
npm install
```

Leva de 1 a 3 minutos. **Se deu certo:** a última linha fala em pacotes adicionados ("added … packages"). Avisos em amarelo ("warn") são normais.

### 5. Ligar o site (sempre que quiser usar)

```bash
npm run dev
```

**Se deu certo:** aparece `Ready` e um endereço `http://localhost:3000`. Abra esse endereço no navegador.

- Enquanto o terminal estiver aberto, o site funciona.
- Para desligar, clique no terminal e aperte **Ctrl + C**.

---

## Qual IA o site usa

O site funciona com duas IAs. A escolha fica em `lib/config.ts`, na linha `provider`:

| `provider` | IA | Custo | Para quê |
|---|---|---|---|
| `"gemini"` | Google Gemini | **Grátis** (com limites por minuto e por dia) | Testes durante o desenvolvimento |
| `"anthropic"` (atual) | Claude Sonnet 5.5 | Pago (créditos) | Versão final do site |

Enquanto o Gemini estiver ligado, a página de Privacidade mostra um aviso de "versão de testes", porque no plano grátis o Google pode usar os textos enviados para melhorar os modelos dele. **Não abra o site ao público com o Gemini grátis.**

## Chave do Gemini (grátis, para testes)

1. Acesse **https://aistudio.google.com** e entre com uma conta Google.
2. Aceite os termos, se aparecerem.
3. Clique em **Get API key** e depois em **Create API key**.
4. Copie a chave (começa com `AIza`). Não é preciso cartão de crédito.
5. Na pasta do projeto, faça uma cópia do arquivo `.env.example` e dê à cópia o nome **`.env.local`** (se já tiver o `.env.local`, só edite).
6. Na linha `GEMINI_API_KEY=`, cole a chave logo depois do `=`, sem espaços e sem aspas. Salve.
7. No terminal, desligue o site (**Ctrl + C**) e ligue de novo com `npm run dev`.

**Como funciona com o plano grátis:**
- O site faz uma chamada de cada vez. Quando o limite por minuto é atingido, ele espera e tenta de novo sozinho. Por isso cada análise pode levar de 2 a 5 minutos.
- Se aparecer "Limite de uso da IA atingido", você bateu o limite diário. Tente no dia seguinte.
- As notas e os trechos apontados podem ser diferentes do que o Claude faria. Use o Gemini para testar o funcionamento do site; a calibragem fina das instruções será feita com a IA final.

## Checklist: trocar para a Anthropic (versão final)

1. Crie a chave da Anthropic e adicione créditos (seção abaixo).
2. No `.env.local`, preencha `ANTHROPIC_API_KEY=`.
3. Em `lib/config.ts`, troque `provider: "gemini"` por `provider: "anthropic"`.
4. Reinicie o site (**Ctrl + C** e `npm run dev`).
5. Confira:
   - a página de **Privacidade** não mostra mais o aviso de "versão de testes";
   - a **Metodologia** cita o Claude Sonnet 5.5;
   - o custo estimado aparece no fim de cada análise.
6. Rode de novo os testes com IA da tabela "Como testar", principalmente o **par espelhado**, para conferir a imparcialidade com a IA final.
7. No Console da Anthropic, confira se a **busca na web** está ativada e defina um **limite mensal de gastos**.

Todo o resto (instruções, regras, conferência de citações e de links) já está pronto e é o mesmo para as duas IAs.

## Chave da Anthropic

Necessária quando `provider` for `"anthropic"` (versão final). Sem nenhuma chave, só os **exemplos prontos** funcionam.

A **chave de API** é uma senha que permite ao site usar a IA e cobrar o uso na **sua** conta. Por isso ela é secreta: quem tiver a chave pode gastar seus créditos.

### Criar a conta e a chave

1. Acesse **https://console.anthropic.com** (o endereço pode redirecionar para platform.claude.com) e crie uma conta.
2. **Créditos:** no menu, entre em **Billing** e adicione créditos. **US$ 5 a 10 bastam** para dezenas de testes. Essa é a única etapa com custo.
3. **Limite de gastos (recomendado):** em **Settings → Limits**, defina um limite mensal (por exemplo, US$ 10). Assim nunca haverá surpresa na fatura.
4. **Gerar a chave:** em **Settings → API Keys**, clique em **Create Key**, dê o nome `unslant` e clique em criar.
5. **Copie a chave na hora.** Ela começa com `sk-ant-` e só aparece uma vez.

### Colocar a chave no projeto (arquivo .env.local)

1. Na pasta do projeto, faça uma cópia do arquivo `.env.example` e dê à cópia o nome **`.env.local`**.
   - No Windows, se o Explorador esconder arquivos que começam com ponto, use **Exibir → Itens ocultos**. No Mac, aperte **Cmd + Shift + .** no Finder.
2. Abra o `.env.local` num editor de texto (Bloco de Notas, TextEdit ou VS Code).
3. Na linha `ANTHROPIC_API_KEY=`, cole a chave logo depois do `=`, sem espaços e sem aspas:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
   ```
4. Salve o arquivo.
5. No terminal, desligue o site (**Ctrl + C**) e ligue de novo:
   ```bash
   npm run dev
   ```

**Por que no .env.local e não direto no código?**
- O `.env.local` **nunca é enviado ao GitHub** (está bloqueado no arquivo `.gitignore`), então a chave não vaza mesmo que o código seja público.
- A chave fica só no servidor e **nunca chega ao navegador** de quem usa o site.
- **Nunca** cole a chave em chats, e-mails ou no próprio código.

---

## Como testar

Com o site ligado em `http://localhost:3000`:

| Teste | Como fazer | O que deve acontecer |
|---|---|---|
| **Exemplo pronto** (grátis) | Clique em **Ver uma análise pronta** | Nota 5,9 ("Viés moderado"), inclinação econômica "Esquerda", social "Não identificado" e dezenas de trechos destacados |
| **Modo simples e detalhado** (grátis) | Em **Tipo de análise**, escolha Simples ou Detalhada e clique em **Ver uma análise pronta** | Abre no tipo escolhido. No **Simples** (nota, inclinação em uma linha, 3 principais problemas com exemplo). O botão **Detalhado** (ou "Ver análise completa") mostra tudo; "Ver no texto" abre o detalhado no trecho. O site lembra a última escolha |
| **Afirmação pronta** (grátis) | Clique em **Ver uma afirmação analisada** | Nota 3,7 ("Viés moderado") e o quadro "Verificação da afirmação" |
| **Idioma** (grátis) | Clique em **English** no topo | O site inteiro muda para inglês (endereço `/en`); o botão vira **Português** |
| **Exemplo em inglês** (grátis) | Na versão em inglês, clique em **See a ready-made analysis** | Notícia americana fictícia, com viés no sentido oposto ao do exemplo brasileiro: nota 5,8 e inclinação econômica "Direita" |
| **Páginas** (grátis) | Clique em **Metodologia**, **Tipos de viés** e **Privacidade** no topo (no celular, ficam no rodapé) | Textos completos nos dois idiomas |
| **Afirmação** (usa a IA) | Aba **Afirmação** → clique num dos exemplos → **Analisar** | Resultado com a verificação e o grupo "Vieses de raciocínio" |
| **Destaques** | Clique num trecho colorido do texto | Aparecem a categoria e a explicação (ao lado no computador, embaixo no celular) |
| **Ver no texto** | Em "Todas as categorias", abra um grupo e clique em **Ver no texto** | A página rola até o trecho, que pisca |
| **Texto colado** (usa a IA) | Clique em **Notícia em inglês** e depois em **Analisar texto** | Progresso em 4 etapas e resultado em 30 s a 2 min |
| **PDF** (usa a IA) | Clique em **Baixar o paper em PDF**, vá à aba **PDF** e envie o arquivo | Aparece "Fermented Oat Beverage and Anxiety (471 palavras extraídas)"; a análise deve ativar o grupo "Específicos de artigos acadêmicos" |
| **Simetria** (usa a IA) | Analise o **Par espelhado (A)** e depois o **(B)** | Notas parecidas e inclinação social em lados opostos |
| **Link** (usa a IA) | Cole o link de uma matéria real | Título, veículo, autor e data aparecem no topo do resultado |
| **Tipo de texto** (usa a IA) | Antes de analisar, escolha um tipo em **Tipo de texto** (ex.: Opinião). Depois analise de novo deixando **Detectar automaticamente** | Com escolha: aparece "Tipo informado por você."; sem escolha: aparece "Por que …" com o motivo dado pela IA |
| **Linha editorial** (usa a IA) | Role até **Para equilibrar sua leitura** | Cada sugestão mostra a linha editorial do veículo; as estimativas da IA aparecem com "(estimativa)" |
| **Erros** | Cole um texto com poucas palavras, ou um link de site com paywall | Mensagem clara explicando o que fazer |

**Comparar antes e depois:** depois de mudar instruções ou configurações, analise de novo os mesmos textos e rode o comando abaixo. Ele mostra, para cada texto, a análise mais antiga ao lado da mais recente (nota, inclinações, destaques, custo, tempo e custo por etapa).

```bash
npm run comparar
```

**Teste automático (simetria):** compara artigos reais de lados opostos sobre o mesmo fato (Brasil de Fato e Terra Brasil, que devem ficar entre 4 e 6, com diferença de no máximo 1,5 ponto e favorecendo lados opostos) e um mais neutro (CNN Brasil, entre 1 e 3). A lista e as faixas ficam em `testes/casos.json`. O teste também tem um **paper sintético com gráfico enganoso** (`testes/fixtures/paper-grafico.json`, feito pelo unslant, sem direitos autorais): ele confere se a IA vê a figura e aponta o gráfico enganoso.

1. Na primeira vez, analise os 3 artigos no site e depois rode (guarda os textos em `testes/textos/`, só no seu computador, fora do GitHub por causa dos direitos autorais):

```bash
npm run teste:salvar
```

2. Sempre que quiser conferir uma mudança, com o site ligado em outra janela do Terminal (custa cerca de US$ 0,50 por rodada):

```bash
npm run teste
```

3. Experimento para baratear: o mesmo teste com "esforço baixo" nos especialistas (não muda o site; só mostra se a qualidade se mantém):

```bash
npm run teste -- --baixo
```

4. Experimentos com o modelo mais barato (Claude Haiku) nos especialistas: `npm run teste -- --haiku` (todos) ou `npm run teste -- --misto` (todos menos o que avalia a inclinação política).

O teste mostra ✅ ou ❌ para cada regra, o custo de cada etapa, o gênero identificado e a comparação com a rodada anterior.

**Cache:** analisar o mesmo texto de novo é instantâneo e grátis, porque o resultado fica guardado na pasta `.cache/`. Se você editar a taxonomia ou os prompts, o cache antigo é ignorado sozinho.

---

## Arquivos que você pode editar

| Arquivo | O que controla |
|---|---|
| `lib/taxonomy.ts` | Categorias de viés, descrições, orientações para a IA, **pesos** e a fórmula da nota geral |
| `lib/prompts/` | As instruções enviadas à IA (`system.ts` tem as regras gerais) |
| `lib/config.ts` | Modelo de IA, limites de tamanho de texto, limite diário de análises, preços para estimar custo |
| `app/globals.css` | Cores e fontes do site |
| `lib/examples.ts` | Textos de exemplo |
| `lib/errors.ts` | Textos das mensagens de erro |
| `lib/i18n/pt.ts` e `lib/i18n/en.ts` | Todos os textos da interface, em português e em inglês |
| `content/methodology.tsx` | Texto da página Metodologia |
| `content/about.tsx` | Texto da página Quem somos |
| `content/privacy.tsx` | Texto da página Privacidade (atualize antes de lançar login ou pagamentos) |
| `lib/prompts/claimCheck.ts` | Instruções da verificação de afirmações |
| `lib/prompts/balance.ts` | Instruções da busca de textos para equilibrar |
| `lib/veiculos.ts` | Linha editorial de ~75 veículos e órgãos, cada uma com fonte (Media Bias/Fact Check ou Wikipédia). Veículos fora da lista recebem uma estimativa da IA, marcada como "estimativa" |
| `testes/casos.json` | Artigos e faixas de nota do teste automático |

Cada arquivo tem comentários explicando o que pode ser mudado. Depois de salvar, o site recarrega sozinho (se estiver ligado com `npm run dev`).

---

## Quanto custa

- **Com o Gemini grátis, o custo é zero.** Com a Anthropic, **cada análise de matéria deve custar cerca de US$ 0,10 a 0,15** (estimativa após a otimização: 4 chamadas de especialistas, com o Claude Haiku na identificação, na síntese e na busca; confira o valor real no fim de cada análise ou com `npm run comparar`), já incluindo até 3 buscas na web (US$ 0,01 cada; ajuste em `lib/config.ts`, seção `balance`). Papers longos ficam entre US$ 0,50 e 1,50. O custo estimado de cada análise aparece no fim da página de resultado.
- **Imagens e gráficos** somam cerca de US$ 0,02–0,04 numa matéria com imagens e US$ 0,05–0,15 num paper com gráficos (só quando há imagens).
- **Textos longos:** um paper de 10 mil palavras deve custar US$ 0,25–0,35; de 30 mil, US$ 0,60–0,90 (estimativas). Eles são analisados em fila para respeitar o limite por minuto da conta (`lib/config.ts`, `rateLimit`); a tela avisa quando isso acontece.
- O exemplo pronto e as análises repetidas (cache) são grátis.
- **Proteção:** o site recusa novas análises depois de 30 por dia (ajuste em `lib/config.ts`, `globalDailyAnalyses`). Configure também o limite mensal na conta da Anthropic, como explicado acima.

---

## Problemas comuns

| Mensagem ou situação | O que fazer |
|---|---|
| `'node' não é reconhecido` / `command not found: node` | O Node.js não foi instalado ou o terminal foi aberto antes da instalação. Feche e abra o terminal de novo. |
| "A chave da IA não está configurada" | Confira o nome do arquivo (`.env.local`, com o ponto no início) e reinicie o site (Ctrl + C e `npm run dev`). |
| "A chave da IA foi recusada" | A chave foi copiada incompleta, com espaços, ou não corresponde ao `provider` escolhido em `lib/config.ts`. |
| "A conta da Anthropic está sem créditos" | Adicione créditos em **Billing**. |
| "O site bloqueou o acesso automático" ou "paywall" | Copie o texto da matéria e use a aba **Texto**. |
| "Não foi possível fazer a busca na web desta vez" | Confira no Console da Anthropic (configurações da organização) se a busca na web (*web search*) está ativada. O resto da análise funciona mesmo sem ela. |
| "Esse PDF parece ser uma imagem escaneada" | O PDF não tem texto selecionável. Use outro arquivo ou cole o texto. |
| `Port 3000 is in use` | O site já está ligado em outro terminal. Use esse ou feche-o. |

---

## Como o projeto está organizado

```
app/
  [lang]/                  páginas em cada idioma (/pt/... e /en/...)
    page.tsx               página inicial
    methodology/           Metodologia
    glossary/              Tipos de viés
    privacy/               Privacidade
  api/analyze/route.ts     servidor: recebe o pedido e executa a análise
proxy.ts                   envia quem abre "/" para /pt ou /en
components/                partes da tela (formulário, nota, destaques...)
content/                   textos das páginas Metodologia e Privacidade  ← editável
lib/
  taxonomy.ts              categorias de viés e pesos  ← editável
  config.ts                configurações gerais        ← editável
  prompts/                 instruções da IA            ← editável
  examples.ts              textos de exemplo
  i18n/                    textos da interface em português e inglês  ← editável
  extract/                 leitura de links (servidor) e PDF (navegador)
  analysis/                linha de montagem: etapas, citações, notas, cache
  ai/client.ts             conversa com a IA (Anthropic) e escolhe qual IA usar
  ai/gemini.ts             conversa com o Google Gemini (testes grátis)
  ai/balance.ts            busca na web e conferência dos links
  ai/ratelimit.ts          fila que respeita o limite de uso por minuto da IA
  analysis/visuals.ts      preparação das imagens (etapa "Imagens e gráficos")
  veiculos.ts              linha editorial fixa de alguns veículos  ← editável
  demo/                    resultado do exemplo pronto
scripts/                   comandos npm run comparar, teste e teste:salvar
testes/casos.json          artigos e faixas do teste automático  ← editável
public/exemplos/           PDF de exemplo
```

**Como uma análise acontece:**
1. **Identificação:** a IA descobre o tipo de texto, o país e o contexto político.
2. **Especialistas:** 4 chamadas ao mesmo tempo, cada uma com alguns grupos de viés; uma delas também faz a visão geral (inclinação, disputa, fato e opinião, omissões).
   **Imagens e gráficos** (ao mesmo tempo, só quando há imagens): a IA vê as páginas do PDF com figuras/tabelas (até 20) ou as imagens da matéria (até 6), descreve cada uma e procura gráficos enganosos e enquadramento por imagem. Configuração em `lib/config.ts`, seção `visual`.
3. **Conferência:** cada citação é procurada no texto, as que não existem são descartadas e as notas são calculadas.
4. **Síntese:** resumo e sugestão de reescrita.

Detalhes técnicos:
- **Respostas validadas:** a IA responde em formato fixo (JSON), conferido com `zod`. Se vier errado, o site tenta mais uma vez.
- **Proteção contra instruções escondidas:** o documento fica dentro de marcações com código aleatório, e a IA é instruída a nunca seguir ordens vindas dele.
- **Segurança de links:** o site se recusa a acessar endereços internos (proteção contra SSRF), e a conferência é feita no momento da conexão.
- **Textos longos:** acima de 30 mil palavras, o texto é dividido em partes e os resultados são consolidados.

---

## Próximas fases

- ~~**Fase 2:** busca na web e a seção "Para equilibrar sua leitura".~~ Pronta.
- ~~**Fase 3:** interface em português e inglês, página de Metodologia e modo simples e detalhado.~~ Pronta.
- **Fase 4:** login (Supabase), histórico e limite de 3 análises por dia.
- **Fase 5:** plano pago (Stripe).
- **Fase 6:** publicação na Vercel com domínio próprio.

A estrutura já está preparada para, no futuro, ter perfis por veículo, comparação de coberturas e análise de vídeos do YouTube.
