# unslant

O unslant analisa um texto (link de matéria, texto colado ou PDF) e mostra os vieses que ele contém, sempre com o **trecho exato do texto** como prova. Ele também mostra a inclinação política em dois eixos e o que o texto pode estar omitindo.

> Projeto em construção. Fase atual: **Fase 1**: análise completa, sem login.

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

- Três formas de enviar conteúdo: **Link**, **Texto** e **PDF**.
- Análise em **46 categorias de viés**, organizadas em 11 grupos. O grupo de papers acadêmicos é ativado sozinho quando o texto é um paper.
- **Nota geral de 0 a 10**, calculada pelo próprio site a partir das notas das categorias.
- **Inclinação política** em dois eixos (econômico e social), com justificativa e trecho. Se não houver evidência suficiente, aparece "Não identificado".
- **Texto original com os trechos destacados.** Ao clicar num destaque, aparecem a categoria e a explicação.
- Resumo, proporção de fato e opinião, "o que o texto pode estar omitindo" e uma sugestão de reescrita neutra.
- **Conferência de citações:** cada trecho citado pela IA é procurado no texto original e descartado se não for encontrado.
- **Exemplo pronto**, que funciona sem chave e sem custo.

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

## Chave da Anthropic

Sem a chave, só o **exemplo pronto** funciona. Para analisar qualquer texto, você precisa de uma chave da API da Anthropic.

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
| **Exemplo pronto** (grátis) | Clique em **Ver uma análise pronta** | Nota 5,9 ("Viés alto"), inclinação econômica "Esquerda", social "Não identificado" e dezenas de trechos destacados |
| **Destaques** | Clique num trecho colorido do texto | Aparecem a categoria e a explicação (ao lado no computador, embaixo no celular) |
| **Ver no texto** | Em "Todas as categorias", abra um grupo e clique em **Ver no texto** | A página rola até o trecho, que pisca |
| **Texto colado** (usa a IA) | Clique em **Notícia em inglês** e depois em **Analisar texto** | Progresso em 4 etapas e resultado em 30 s a 2 min |
| **PDF** (usa a IA) | Clique em **Baixar o paper em PDF**, vá à aba **PDF** e envie o arquivo | Aparece "Fermented Oat Beverage and Anxiety (471 palavras extraídas)"; a análise deve ativar o grupo "Específicos de artigos acadêmicos" |
| **Simetria** (usa a IA) | Analise o **Par espelhado (A)** e depois o **(B)** | Notas parecidas e inclinação social em lados opostos |
| **Link** (usa a IA) | Cole o link de uma matéria real | Título, veículo, autor e data aparecem no topo do resultado |
| **Erros** | Cole um texto com poucas palavras, ou um link de site com paywall | Mensagem clara explicando o que fazer |

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

Cada arquivo tem comentários explicando o que pode ser mudado. Depois de salvar, o site recarrega sozinho (se estiver ligado com `npm run dev`).

---

## Quanto custa

- **Cada análise de matéria custa cerca de US$ 0,20 a 0,50.** Papers longos ficam entre US$ 0,50 e 1,50. O custo estimado de cada análise aparece no fim da página de resultado.
- O exemplo pronto e as análises repetidas (cache) são grátis.
- **Proteção:** o site recusa novas análises depois de 30 por dia (ajuste em `lib/config.ts`, `globalDailyAnalyses`). Configure também o limite mensal na conta da Anthropic, como explicado acima.

---

## Problemas comuns

| Mensagem ou situação | O que fazer |
|---|---|
| `'node' não é reconhecido` / `command not found: node` | O Node.js não foi instalado ou o terminal foi aberto antes da instalação. Feche e abra o terminal de novo. |
| "A chave da Anthropic não está configurada" | Confira o nome do arquivo (`.env.local`, com o ponto no início) e reinicie o site (Ctrl + C e `npm run dev`). |
| "A chave da Anthropic foi recusada" | A chave foi copiada incompleta ou com espaços. Gere outra no Console. |
| "A conta da Anthropic está sem créditos" | Adicione créditos em **Billing**. |
| "O site bloqueou o acesso automático" ou "paywall" | Copie o texto da matéria e use a aba **Texto**. |
| "Esse PDF parece ser uma imagem escaneada" | O PDF não tem texto selecionável. Use outro arquivo ou cole o texto. |
| `Port 3000 is in use` | O site já está ligado em outro terminal. Use esse ou feche-o. |

---

## Como o projeto está organizado

```
app/
  page.tsx                 página inicial (formulário, progresso e resultado)
  api/analyze/route.ts     servidor: recebe o pedido e executa a análise
components/                partes da tela (formulário, nota, destaques...)
lib/
  taxonomy.ts              categorias de viés e pesos  ← editável
  config.ts                configurações gerais        ← editável
  prompts/                 instruções da IA            ← editável
  examples.ts              textos de exemplo
  extract/                 leitura de links (servidor) e PDF (navegador)
  analysis/                linha de montagem: etapas, citações, notas, cache
  ai/client.ts             conversa com a IA (só no servidor)
  demo/                    resultado do exemplo pronto
public/exemplos/           PDF de exemplo
```

**Como uma análise acontece:**
1. **Identificação:** a IA descobre o tipo de texto, o país e o contexto político.
2. **Especialistas:** um por grupo de viés, mais um de visão geral (inclinação, fato e opinião, omissões), todos ao mesmo tempo.
3. **Conferência:** cada citação é procurada no texto, as que não existem são descartadas e as notas são calculadas.
4. **Síntese:** resumo e sugestão de reescrita.

Detalhes técnicos:
- **Respostas validadas:** a IA responde em formato fixo (JSON), conferido com `zod`. Se vier errado, o site tenta mais uma vez.
- **Proteção contra instruções escondidas:** o documento fica dentro de marcações com código aleatório, e a IA é instruída a nunca seguir ordens vindas dele.
- **Segurança de links:** o site se recusa a acessar endereços internos (proteção contra SSRF), e a conferência é feita no momento da conexão.
- **Textos longos:** acima de 30 mil palavras, o texto é dividido em partes e os resultados são consolidados.

---

## Próximas fases

- **Fase 2:** busca na web e a seção "Para equilibrar sua leitura".
- **Fase 3:** interface em português e inglês, modo simples e detalhado, página de Metodologia.
- **Fase 4:** login (Supabase), histórico e limite de 3 análises por dia.
- **Fase 5:** plano pago (Stripe).
- **Fase 6:** publicação na Vercel com domínio próprio.

A estrutura já está preparada para, no futuro, ter perfis por veículo, comparação de coberturas e análise de vídeos do YouTube.
