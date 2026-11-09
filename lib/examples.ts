/**
 * TEXTOS DE EXEMPLO PARA TESTE
 *
 * Todos são FICTÍCIOS (pessoas, cidades e veículos inventados) e foram
 * escritos com vieses colocados de propósito, para conferir se a análise
 * encontra o que deveria. O par "espelhado" conta o mesmo fato com viés
 * para lados opostos: se a ferramenta for justa, os dois devem receber
 * notas parecidas e inclinações opostas.
 *
 * O PDF do paper fica em public/exemplos/paper-exemplo.pdf (para testar a aba PDF).
 */

export interface Example {
  id: string;
  label: string;
  description: string;
  text: string;
  /** Existe um resultado pronto (sem custo) para este exemplo? */
  hasDemo?: boolean;
}

const NOTICIA_PT = `Prefeitura impõe corte brutal na saúde e abandona os mais pobres

A Prefeitura de Vale Verde anunciou nesta segunda-feira um corte de 30% no orçamento da saúde para 2027, numa decisão que especialistas classificam como desastrosa. A medida, aprovada às pressas pela base aliada na Câmara Municipal, atinge em cheio as unidades básicas de saúde dos bairros da periferia.

Segundo especialistas ouvidos pela reportagem, a redução vai destruir o atendimento nos bairros mais pobres e provocar uma explosão de mortes evitáveis nos próximos anos. "É um crime contra a população", afirmou Marta Ribeiro, presidente do Sindicato dos Servidores da Saúde, que acompanha o tema há duas décadas.

O corte de R$ 84 milhões é o maior da história da cidade. Desde que o prefeito Ricardo Almeida assumiu, a fila para consultas com especialistas cresceu sem parar, o que mostra que a gestão sucateou a rede pública. Moradores relatam esperas de até oito meses por um exame de rotina.

Na UBS do Jardim Esperança, a dona de casa Lúcia Pereira, 62 anos, chorava na porta do posto. "Não sei mais a quem recorrer", disse ela, que tem diabetes e não consegue renovar a receita há três meses. Cenas como essa devem se tornar cada vez mais comuns. Todos os moradores da zona leste sabem que, se nada for feito agora, será tarde demais.

A oposição promete recorrer à Justiça. Para o vereador Paulo Nunes, o prefeito governa apenas para os empresários do centro e despreza quem depende do SUS. "Primeiro cortam a saúde, depois vão fechar as escolas, e logo não vai sobrar nenhum serviço público na cidade", disse.

Ou a Câmara derruba o corte, ou a cidade vai assistir ao colapso da saúde pública.

Procurada, a Secretaria Municipal da Fazenda alegou que a arrecadação caiu 18% neste ano e que o orçamento da saúde de 2026 havia recebido um reforço extraordinário durante a epidemia de dengue, que não se repetirá. A pasta admitiu que o valor previsto para 2027 é semelhante ao de 2024, corrigido pela inflação.`;

const NOTICIA_EN = `Reckless green mandate will cost Millbrook families thousands

Millbrook's city council voted 5-4 on Tuesday night to force homeowners to replace gas furnaces with electric heat pumps by 2030, a radical scheme that critics say will bankrupt working families and drive businesses out of town.

The mandate, rammed through by the council's activist majority after just two public hearings, requires any home sold after 2027 to install a heat pump before the sale can close. Local realtors warn the rule could add as much as $25,000 to the cost of a home.

"This is nothing but a war on ordinary people," said Dale Hutchins, president of the Millbrook Homebuilders Association. Experts agree the technology simply does not work in cold climates.

Energy bills in neighboring Carver County jumped 40% in the two years after it adopted a similar policy, proof that green mandates always backfire. Everyone who has looked at the numbers knows the result: higher costs, colder homes and fewer jobs.

Council member Rachel Ortiz, who wrote the ordinance, claimed the program would cut emissions and lower bills over time. She insisted that federal rebates would cover most installation costs, but did not explain where the remaining money would come from.

Supporters of the plan, many of whom do not own homes in Millbrook, packed the chamber with signs. Once the city starts telling you how to heat your home, it is only a matter of time before it tells you what car to drive and what food to eat.

Residents have until March to voice their opposition before the rule takes effect. Families who cannot afford the upgrade may soon have to choose between heating their homes and putting food on the table.`;

const PAPER = `Daily Consumption of a Fermented Oat Beverage Reduces Anxiety in Young Adults: A Cross-Sectional Study

Abstract
Anxiety disorders are a growing public health crisis. We investigated whether regular consumption of a fermented oat beverage (FOB) improves mental health. In a sample of 48 university students, participants who reported drinking FOB daily showed significantly lower anxiety scores than non-consumers (p = 0.048). These findings demonstrate that FOB consumption reduces anxiety and support its use as a natural, low-cost intervention for anxiety in the general population.

1. Introduction
Anxiety affects millions of people worldwide, and current pharmacological treatments are associated with side effects. A growing body of evidence shows that the gut microbiome plays a central role in mood regulation (Lindqvist et al., 2021; Moreau, 2022). Fermented foods have been proposed as a promising strategy to modulate the gut-brain axis. Previous studies by our group found that oat-based fermented products improve digestive comfort (Hart et al., 2023). To our knowledge, no prior work has examined the effect of fermented oat beverages on anxiety.

2. Methods
Participants were recruited through flyers posted at a campus café that sells the beverage. Forty-eight undergraduate students (aged 19 to 24; 39 women) completed an online questionnaire. Participants reported how often they drank FOB in the past month and completed the Generalized Anxiety Disorder scale (GAD-7), the Perceived Stress Scale, a sleep quality index, a loneliness scale, a mood checklist, and a self-esteem inventory. Participants were classified as daily consumers (n = 17) or non-consumers (n = 31). Group differences were tested with independent t-tests. No correction for multiple comparisons was applied.

3. Results
Daily consumers had lower GAD-7 scores than non-consumers (mean 6.1 vs 8.0; p = 0.048). Differences in perceived stress (p = 0.21), sleep quality (p = 0.34), loneliness (p = 0.57), mood (p = 0.12) and self-esteem (p = 0.41) were not statistically significant, although daily consumers showed a positive trend on most measures. In an exploratory analysis restricted to women, the difference in anxiety scores was larger (p = 0.031).

4. Discussion
Our results show that drinking FOB every day lowers anxiety. This effect is likely driven by the beverage's live cultures acting on the gut-brain axis. The positive trends across stress, sleep and mood further confirm the broad mental health benefits of FOB. Given its low cost and lack of side effects, FOB could be recommended as a first-line option for people experiencing anxiety. Future studies should explore whether these benefits extend to children and older adults.

Limitations
The sample size was modest.

Funding and conflicts of interest
This study was funded by Northfield Oat Company, manufacturer of the beverage tested. Two authors are members of Northfield's scientific advisory board. The funder had no role in the study design.`;

const ESPELHO_ESQUERDA = `Câmara aprova escolas cívico-militares e entrega a educação aos quartéis

Por 12 votos a 9, a Câmara de Rio Claro do Sul aprovou na quinta-feira a transformação de seis escolas municipais em unidades cívico-militares, num projeto que educadores classificam como um retrocesso autoritário. A votação ocorreu sob protestos de pais e professores, que lotaram as galerias.

Segundo especialistas, o modelo militariza a infância e silencia o pensamento crítico. "É a volta da disciplina pelo medo", afirmou a pedagoga Helena Duarte, da rede municipal.

A Secretaria de Educação alegou que as escolas escolhidas têm índices altos de violência e que a adesão foi aprovada pelas comunidades escolares. O vereador Jorge Lima, autor do projeto, admitiu que não há estudos conclusivos sobre o desempenho dessas escolas.

Todos sabem que disciplina imposta não ensina ninguém a pensar. Se a cidade aceitar fardas nas salas de aula hoje, amanhã serão as próprias ideias dos alunos que estarão sob vigilância.`;

const ESPELHO_DIREITA = `Câmara aprova escolas cívico-militares e devolve a ordem às salas de aula

Por 12 votos a 9, a Câmara de Rio Claro do Sul aprovou na quinta-feira a transformação de seis escolas municipais em unidades cívico-militares, num projeto que famílias classificam como um resgate da disciplina. A votação ocorreu sob a pressão de sindicalistas, que tumultuaram as galerias.

Segundo especialistas, o modelo devolve o respeito ao professor e protege os alunos da violência. "É a volta da autoridade em sala de aula", afirmou o pai de aluno Roberto Faria, morador do bairro.

O sindicato dos professores alegou que o modelo restringe a liberdade pedagógica e que as comunidades escolares não foram ouvidas de forma ampla. A vereadora Sônia Prado, contrária ao projeto, admitiu que as escolas escolhidas têm índices altos de violência.

Todos sabem que sem disciplina não há aprendizado. Se a cidade rejeitar a ordem nas escolas hoje, amanhã serão as próprias salas de aula que estarão nas mãos da criminalidade.`;

export const EXAMPLES: Example[] = [
  {
    id: "noticia-pt",
    label: "Notícia brasileira",
    description: "Corte no orçamento da saúde de uma cidade fictícia.",
    text: NOTICIA_PT,
    hasDemo: true,
  },
  {
    id: "noticia-en",
    label: "Notícia em inglês",
    description: "Lei ambiental numa cidade americana fictícia (viés no sentido oposto).",
    text: NOTICIA_EN,
  },
  {
    id: "paper",
    label: "Paper científico",
    description: "Estudo fictício sobre uma bebida e ansiedade. Também disponível em PDF.",
    text: PAPER,
  },
  {
    id: "espelho-esquerda",
    label: "Par espelhado (A)",
    description: "Escolas cívico-militares, com viés contrário ao projeto.",
    text: ESPELHO_ESQUERDA,
  },
  {
    id: "espelho-direita",
    label: "Par espelhado (B)",
    description: "O mesmo fato, com viés favorável ao projeto.",
    text: ESPELHO_DIREITA,
  },
];

export function getExample(id: string) {
  return EXAMPLES.find((e) => e.id === id);
}
