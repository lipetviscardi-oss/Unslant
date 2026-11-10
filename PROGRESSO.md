# Progresso dos ajustes

Este arquivo registra o andamento do trabalho. Se a sessão for interrompida,
basta pedir "continue": o trabalho retoma a partir do primeiro item não concluído.
Cada item concluído é salvo no GitHub logo em seguida.

## Rodada 4 (atual)

| # | Item | Estado |
|---|---|---|
| A | Custo: desligar cache/aquecimento onde não é lido; rodapé mostra os dois modelos | feito |
| B | Citações entre aspas não contam como voz do autor (instrução + trava no código + versão neutra) | feito |
| C | Coerência da disputa: intensidade leve/clara/forte; resumo não pode contradizer o marcador | feito |
| D | Gênero: critérios fixos, motivo mostrado, editoria/seção da página como pista, seletor de gênero no formulário | feito |
| E | Linha editorial dos veículos sugeridos (tabela lib/veiculos.ts + estimativa da IA) | feito |
| F | Custo: visão geral junto de um pacote de especialistas (4 chamadas em vez de 5) | feito |
| G | Teste automático: npm run teste:salvar e npm run teste (faixas, simetria ≤ 1,5, lados opostos) | feito |
| H | Verificação final (tipos, lint, build) + README/Metodologia + instruções ao usuário | feito |
| H2 | Correção: análises falhavam (limite de 21 mil tokens da biblioteca sem streaming no pacote com visão geral) | feito |

### Decisões
- Item 5: "esforço baixo" nos especialistas fica pronto para teste, mas só será ativado se `npm run teste` passar.
- Gênero: seletor opcional no formulário; sem seleção, a IA classifica e explica.
- Simetria: diferença máxima de 1,5 ponto entre Brasil de Fato e Terra Brasil.

## Rodada 3 (concluída)
Faixas da nota, dados/estatística, versão neutra no estilo de notícia, bug visual da disputa, diagnóstico e 2ª rodada da busca, Haiku na identificação e na busca.

### Resultado do teste automático (10/11/2026)
- Esforço padrão: aprovado (BdF 4,7 · Terra 4,2 · CNN 1,5; diferença 0,5; lados opostos). Custo médio US$ 0,140.
- Esforço baixo: aprovado (4,3 · 4,5 · 1,6; diferença 0,2). Custo médio US$ 0,140, sem economia → fica o esforço padrão.
- Aprovado: experimentos `npm run teste -- --haiku` e `-- --misto` (feito; aguardando o usuário rodar). Se algum passar e ficar < US$ 0,10, vira padrão (config.ai).
- --haiku: REPROVADO (BdF 3,0 · Terra 3,2 · CNN 1,9; US$ 0,040). Simétrico, mas menos sensível: a distância entre os textos enviesados e o neutro cai de ~3 para ~1,2 ponto; CNN passa a "favorece levemente".
- --misto: REPROVADO (2,9 · 3,1 · 1,6; US$ 0,066). Mesmo problema: as notas vêm das categorias, que ficaram quase todas no Haiku.
- Decisão: especialistas continuam no Sonnet (padrão atual, US$ 0,14). Próxima ideia (aguardando o usuário): experimento "enxuto" no Sonnet (2 chamadas em vez de 4, até 2 buscas, explicações mais curtas).

## Rodada 5 — ajustes finos (aprovada; depois começa a Fase 3)
| Item | O quê | Status |
|---|---|---|
| 5 | Bug visual em "Outras sugestões" (grid → flex) | feito |
| 1 | Cache: versão da análise, custo original, botão "Analisar de novo" | feito |
| 2 | Versão neutra: só trechos elegíveis (fora das aspas, sem atribuição, ≥ moderado) | feito |
| 4 | Escala única leve/moderado/forte (0–3,4 / 3,5–6,4 / 6,5–10) + resumo natural | feito |
| 3 | 50 veículos com fonte conferida; órgãos públicos = "Oficial" | feito |
- Item 3: fontes conferidas em 10/11/2026 (MBFC e Wikipédia pt). Sem fonte clara (ficam para a IA estimar): UOL, CNN Brasil, Veja, Gazeta do Povo, Jovem Pan, Metrópoles, Poder360, Revista Fórum, Intercept Brasil, Terra Brasil Notícias, Valor, Exame, R7, IstoÉ, Crusoé, Correio Braziliense, Nexo, Piauí.
- Rede: criado o ambiente "Unslant" (sites liberados: mediabiasfactcheck.com, www.allsides.com, pt.wikipedia.org). AllSides recusa acesso automático (403).
- Próximo: Fase 3 (modo simples e detalhado).

## Rodada 6 — textos longos, imagens, gráficos e tabelas (aprovada; depois começa a Fase 3)
| Item | O quê | Status |
|---|---|---|
| 1 | Limite por minuto: fila de chamadas por estimativa de tokens + espera quando a Anthropic pedir | feito |
| 3 | Tabelas da web em linhas legíveis; PDF sem cabeçalho/rodapé repetido; PDF em duas colunas | feito |
| 2 | Etapa "Imagens e gráficos" (PDF: páginas com figura/tabela, até 20; link: até 6 imagens), 2 categorias novas, seção no resultado | feito |
| 5 | Metodologia/README: limitações (gráficos interativos, PDF escaneado) | feito |
| T | Teste automático com um paper com gráficos (aprovado) | feito |
| 4 | Análise em segundo plano (tempo limite da Vercel) | fica para a Fase 4 |
Retomada automática: tarefa "Retomar unslant" apagada (rodada concluída). Próximo: Fase 3.
- Teste do paper com gráfico (10/11/2026): APROVADO — gráfico enganoso apontado com nota 8,0; etapa de imagens custou US$ 0,018. A falha anterior (AI_ERROR) foi passageira.

## Fase 3 — modo simples e detalhado: FEITA
- Nomes simples aprovados pelo usuário (lib/taxonomy.ts, campo simpleName; rascunho em docs/nomes-simples-rascunho.md).
- Modo simples primeiro; escolha lembrada no navegador; "Ver no texto" abre o detalhado no trecho.
- Escolha "Tipo de análise" (Simples/Detalhada) no formulário — Opção A aprovada: as duas fazem a mesma análise completa (mesma nota); muda o que é mostrado.
- Para a Fase 4 (decidido): usuário grátis = 3 análises simples + 1 detalhada por dia; numa simples, o botão "Ver análise completa" vira "usar minha detalhada do dia" (não chama a IA de novo). Limites do plano pago ficam para a Fase 5.
- Próximo: Fase 4 (login Supabase, histórico, limites por usuário, análise em segundo plano). Pedir aprovação e avisar custos antes.

## Fase 4 — plano enviado ao usuário (aguardando aprovação e 4 decisões)
Itens: 1) conta Supabase (grátis) + chaves no .env.local; 2) instalar @supabase/supabase-js e @supabase/ssr (pedir aprovação);
3) login por link no e-mail; 4) tabelas (perfis, análises, uso diário) com regras de acesso (cada um só vê o seu);
5) limites: grátis = 3 simples + 1 detalhada/dia (zera à meia-noite de Brasília), "usar minha detalhada do dia";
6) "Minhas análises" (histórico, abrir de novo sem custo, apagar); 7) cache no banco (compartilhado);
8) análise em etapas salvas no banco (resolve o tempo limite da Vercel; dá para fechar a aba); 9) Privacidade atualizada.
Decisões pendentes: visitante sem login pode analisar?; login só por e-mail ou também Google?; resultado reaproveitado conta no limite?; horário da virada do dia.
Decisões do usuário (Fase 4): 1b (visitante sem conta: 1 análise simples); 2a agora (link no e-mail) — depois e-mail+senha e Google;
3a (resultado reaproveitado não conta); virada do dia = meia-noite do horário de CADA pessoa; região Supabase = Leste dos EUA;
pode instalar @supabase/supabase-js e @supabase/ssr.

## Rodada 7 — internacional (antes da Fase 4)
| Item | O quê | Status |
|---|---|---|
| I1 | Mais veículos britânicos (e americanos) na lista, com fonte MBFC conferida | feito |
| I2 | Exemplo pronto em inglês | feito |
| I3 | Teste automático com pares EUA e Reino Unido (simetria em vários pares) | feito (falta o usuário salvar os artigos EUA/Reino Unido) |
- Próximo: Fase 4. O usuário vai criar a conta no Supabase (Leste dos EUA) e pôr as chaves no .env.local:
  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY.

## Fase 4 — em andamento (chaves conferidas pelo usuário com npm run verificar)
| Item | O quê | Status |
|---|---|---|
| P1 | Instalar @supabase/supabase-js e @supabase/ssr (aprovado) | feito |
| P2 | Clientes do Supabase (navegador, servidor, admin) + sessão no proxy.ts | feito |
| P3 | Tabelas e regras de acesso (supabase/migrations) | feito (usuário roda o SQL no Supabase) |
| P4 | Login por link no e-mail: página Entrar, /auth/callback, menu da conta | feito |
| P5 | Limites: visitante 1 simples; grátis 3 simples + 1 detalhada por dia (meia-noite local); cache não conta | feito (falta teste do usuário) |
| P6 | Minhas análises (histórico, abrir, apagar) + página da análise salva | feito (falta teste do usuário) |
| P7 | Análise em segundo plano: quem tem conta pode fechar a página; a análise continua no servidor (after()), fica "em andamento" em Minhas análises e aparece quando termina. Testado com servidores falsos: página aberta, página fechada e erro (marca "não concluída" e devolve o uso). Limite: 5 minutos por análise na Vercel; dividir em etapas fica para a Fase 6, depois de medir | feito |
| P8 | Privacidade reescrita (contas, o que guardamos e por quanto tempo, onde ficam os dados, cookies, direitos pela LGPD/UK GDPR/leis da Califórnia); botão "Apagar minha conta"; limpeza automática (cache e registros de uso somem depois de 30 dias, config.privacy); README com o passo a passo do Supabase; .env.example com as chaves do Supabase. Testado com servidores falsos | feito |

## Rodada 8 — ajustes da versão em inglês: FEITA (usuário vai rodar npm run teste:salvar + npm run teste)
1 faixas (manter 3 ou voltar a 5? aguardando); 2 idioma misturado (identificação sem instrução de idioma; rodapé com nomes internos);
3 códigos internos no resumo; 4 CBS: MBFC diz RIGHT-CENTER (2.2), atualizado 28/04/2026 — manter com data ou tirar? (aguardando) + reconferir a lista toda;
5 resumo × gênero; 6 limpar newsletter/tags/"leia também" do texto; 7 equilibrar com pelo menos 1 veículo do outro lado (+ National Review, The Dispatch, Washington Examiner);
8 imagens: só o visível; 9 teste: Mother Jones e Federalist 4–7, Reuters 1–3 (mesmo acontecimento? simetria?).
Decisões: 1b (5 faixas nos dois idiomas: 0–2 leve/Mild, 2–4 moderado/Moderate, 4–6 acentuado/Marked, 6–8 forte/Strong, 8–10 muito forte/Very strong; um único arquivo);
4a (manter classificação da fonte, mostrar data da avaliação); 9 sim (simetria Mother Jones × Federalist ≤ 1,5, lados opostos).
| Item | O quê | Status |
|---|---|---|
| R1 | 5 faixas (taxonomy SCORING), resumo, destaques, modo simples, docs | feito |
| R2 | Idioma: identificação com instrução de idioma; rodapé traduzido | feito |
| R3 | Resumo sem códigos internos (dados legíveis + regra + conferência) | feito |
| R5 | Resumo coerente com o gênero | feito |
| R4 | Reconferir a lista de veículos (avaliação, país, data) + National Review, The Dispatch, Washington Examiner | feito |
| R6 | Limpar newsletter, propaganda, "leia também" e tags do texto | feito |
| R7 | Equilibrar: pelo menos 1 veículo do outro lado (busca dirigida se faltar) | feito |
| R8 | Imagens: só o visível | feito |
| R9 | Teste: Mother Jones e Federalist 4–7, Reuters 1–3, simetria MJ × Federalist | feito |
Depois: Fase 4 (P2 em diante). Retomada automática: tarefa "Retomar unslant".
- R4: 55 páginas reconferidas (todas iguais à lista; CBS = RIGHT-CENTER, atualizada em 04/2026). Novos: National Review (right), The Dispatch e Washington Examiner (center_right).
- Teste da rodada 8 (10/11/2026): APROVADO — 7 artigos; simetria BR 0,9 e EUA 0,3 (lados opostos); custo médio US$ 0,148.
- Fase 4/P5: limites com revisão de segurança aplicada (fuso fixo na conta; visitante = janela de 24 h; uso devolvido marcado "refunded" e ainda conta no limite geral; registro + recontagem contra pedidos simultâneos). Decisão 3a mantida: resultado reaproveitado (inclusive detalhado) não conta — avisar o usuário desse efeito.

### Fase 4: pendências do usuário (antes de publicar)
- ~~Testar no computador~~: testado pelo usuário em 10/11/2026, tudo funcionou. **Fase 4 concluída.**
- Preencher `contactEmail` em lib/config.ts (seção privacy) com um e-mail para pedidos de privacidade.
- Configurar um serviço de e-mail próprio no Supabase (o envio grátis é limitado) — junto com a Fase 6.

## Fase 5: plano pago (Stripe)
**Em espera** (decisão do usuário em 10/11/2026): primeiro publicar o site e testar com conhecidos no Brasil e no Reino Unido; cobrança depois.

## Fase 6 (adiantada): publicar para testes
Decisões do usuário (10/11/2026): botão de sugestões sim; 5 análises por dia (simples ou detalhadas) na fase de testes; e-mail de contato ainda será criado; domínio unslant.world (GoDaddy).

| # | Item | Status |
|---|---|---|
| D1 | Limites da fase de testes: 4 por pessoa na SEMANA (janela de 7 dias), somando simples e detalhadas; orientação de 2 papers + 2 notícias vai no convite; teto do site 15 por dia. Orçamento: US$ 25 (config.limits.perDay.free.total); frases geradas da config (lib/plans.ts) | feito |
| D2 | Botão "Enviar sugestão" (tabela feedback no SQL, /api/feedback com limite de 5 por hora, apagadas em 12 meses; Privacidade e README atualizados) | feito |
| D3 | Domínio: unslant.world, comprado na GoDaddy em 10/11/2026 | feito |
| D4 | Publicar na Vercel (contas do usuário: Vercel; chaves nas configurações da Vercel) | a fazer |
| D5 | E-mails de login pelo Resend (precisa do domínio) | a fazer |
| D6 | URLs de produção no Supabase; e-mail de contato em config.privacy | a fazer |

### Ordem combinada com o usuário (publicação)
1. GoDaddy: conferir privacidade, renovação automática e preço da renovação.
2. Anthropic: US$ 25 de créditos e limite mensal de US$ 25 (aviso em US$ 15).
3. Vercel: criar conta, importar o repositório, colocar as 4 chaves, Deploy → usuário manda o endereço .vercel.app.
4. Claude confere o site no ar.
5. Ligar unslant.world à Vercel (Vercel → Domains; registros DNS na GoDaddy).
6. Supabase: Site URL e Redirect URLs com o domínio.
7. Resend: conta, domínio verificado (DNS na GoDaddy), chave no SMTP do Supabase.
8. E-mail de contato → config.privacy.contactEmail.
9. Teste final (login com Gmail/Outlook/iCloud, celular, sugestões).
10. Convite para os testadores (Claude escreve em pt e en).

### Lembretes
- Conta da Vercel criada com o e-mail da faculdade (a antiga foi apagada e prendia o GitHub/Apple). **Antes da formatura**, trocar o e-mail da conta da Vercel por um pessoal (Account Settings → General → Email).
- Anthropic: US$ 15 de créditos para a semana de testes (esperado ~US$ 10).

### Onde paramos (10/11/2026, ~17h)
- Passos 1, 2 e 3 feitos: domínio na GoDaddy, US$ 15 de créditos na Anthropic, site publicado em https://unslant.vercel.app (conta nova da Vercel, e-mail da faculdade).
- Passo 4: **resolvido**. A rota de análise quebrava na Vercel (ERR_REQUIRE_ESM no jsdom: lá o Node 22 roda sem require() de ESM). Correções: "engines": {"node": "22.x"} no package.json e `transpilePackages: ["jsdom"]` no next.config.ts (jsdom empacotado). Conferido no site publicado: exemplo pronto funciona e a leitura de links funciona. Diagnóstico em /api/health (versão do Node e carga do jsdom). Para simular a Vercel localmente: NODE_OPTIONS="--no-experimental-require-module" npx next start.
- Passo 5 feito: https://www.unslant.world no ar (endereço principal; unslant.world redireciona para o www). Conferido daqui.
- Passos 6, 7 e 8 feitos: URLs no Supabase; Resend com unslant.world verificado (SMTP no Supabase, remetente login@unslant.world; e-mail cai no spam no início, mas funciona; modelo em supabase/templates/login.html); e-mail de contato unslanttheworld@gmail.com.
- Passo 9 travado: na Vercel a chave da IA é recusada (401 invalid x-api-key; parecia faltar 2 caracteres). Usuário vai criar chave nova, colar na Vercel e fazer Redeploy. Conferir com https://www.unslant.world/api/health?ai=1 (deve dar "accepted").
- **Depois: passo 9** (teste final do usuário: 1 paper longo + 1 notícia; atenção ao limite de 5 min da Vercel) e passo 10 (convite).
- O ambiente desta sessão libera unslant.vercel.app, unslant.world e www.unslant.world (dá para testar o site publicado daqui).
- Depois: passo 5 (ligar unslant.world na Vercel + DNS na GoDaddy), 6 (Supabase URLs), 7 (Resend), 8 (e-mail de contato), 9 (teste final), 10 (convite: 4 análises por pessoa, sugerir 2 papers + 2 notícias).

## Rodada 9 (ajustes depois do teste com o paper do Séralini e o Outras Palavras) — aprovada em 10/11/2026
Decisões: A) item 9 = intensidade por trecho; B) limite de imagens e PDF contar como 2 **ficam para a fase final** (avisar o usuário quando formos implementar); C) veículos sem fonte = estimativa da IA com aviso; E) gasto máximo com IA de verdade nesta rodada: **US$ 2** (gasto até agora: US$ 0).

| # | Item | Status |
|---|---|---|
| R9-1 | Título do PDF (maior letra da 1ª página → metadados → nome do arquivo) | feito (testado em 4 PDFs) |
| R9-2 | Referências recolhidas e fora da análise (lib/extract/references.ts; botão "Mostrar referências"; a IA é avisada); anúncios de editora | feito (Séralini: 2.501 palavras de referências separadas) |
| R9-3 | Lixo por site (lib/extract/lixo-por-site.ts) + parágrafos duplicados | feito (Outras Palavras: boletim, apoio, tags e 2 parágrafos repetidos removidos; a repetição existe no HTML original) |
| R9-4 | Versão neutra não repete número "sem fonte" como fato (regra + conferência) | a fazer |
| R9-5 | Problemas das imagens entram nas notas das categorias; mesmo critério para figuras parecidas | a fazer |
| R9-6 | "Respostas do autor às críticas" (avaliação: procede / em parte / não) | a fazer |
| R9-7 | Disputa com ressalva no resumo simples | a fazer |
| R9-8 | Veículos brasileiros + linha "especializado"; sem fonte = estimativa com aviso | a fazer |
| R9-9 | Intensidade por trecho nos destaques | a fazer |
| R9-11 | Casos Séralini (PDF) e Outras Palavras no teste automático | a fazer |
| R9-V | Validação com IA de verdade (≤ US$ 2) | a fazer |

Lembrete para a fase final: limite de imagens por PDF (priorizar gráficos/fotos) e PDF longo contar como 2 análises no plano grátis — **avisar o usuário**.
