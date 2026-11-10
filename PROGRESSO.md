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
