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
| P6 | Minhas análises (histórico, abrir, apagar) + página da análise salva | em andamento |
| P7 | Análise em segundo plano (etapas salvas no banco) | a fazer |
| P8 | Privacidade, README, testes | a fazer |

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
