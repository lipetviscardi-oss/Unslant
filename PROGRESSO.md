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
| 3 | Tabelas da web em linhas legíveis; PDF sem cabeçalho/rodapé repetido; PDF em duas colunas | em andamento |
| 2 | Etapa "Imagens e gráficos" (PDF: páginas com figura/tabela, até 20; link: até 6 imagens), 2 categorias novas, seção no resultado | a fazer |
| 5 | Metodologia/README: limitações (gráficos interativos, PDF escaneado) | a fazer |
| T | Teste automático com um paper com gráficos (aprovado) | a fazer |
| 4 | Análise em segundo plano (tempo limite da Vercel) | fica para a Fase 4 |
Retomada automática: tarefa agendada "Retomar unslant" (a cada hora). Apagar quando tudo estiver feito.
