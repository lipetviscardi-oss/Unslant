# Checklist antes de cada versão (beta)

Rode isto **antes de mandar uma nova versão do site** para testadores (professores, historiadores, amigos).
Nada aqui pode ser marcado como OK sem ter sido testado de verdade.

## Como rodar

Num terminal, deixe o site ligado:

```bash
npm run dev
```

Em **outro** terminal, na mesma pasta:

**1. Conferências sem IA (custo zero, ~5 minutos):**

```bash
npm run checar-beta
```

Ele roda, um depois do outro:

| Comando | O que confere |
|---|---|
| `npm run checar-pdfs` | Título, autores, revista e data de cada PDF de `testes/pdfs/` (os com direitos autorais ficam em `testes/pdfs/privados/`, fora do GitHub) |
| `npm run checar-lixo` | Newsletter, apoio/doação, tags, "leia também", anúncio de editora, referências e parágrafos repetidos em cada link e PDF já testado; avisa se algum conteúdo de verdade foi removido |
| `npm run checar-contradicoes` | Contradições nas análises já feitas (resumo × tipo de texto, × disputa, × notas; versão neutra × "sem fonte") |
| `npm run conferir-veiculos` | Cada veículo da lista fixa × a página da fonte (Media Bias/Fact Check, Wikipédia); grava a tabela em `docs/veiculos-conferidos.md` |

**2. Teste com a IA de verdade (~US$ 2,50, ~30 minutos):**

```bash
npm run teste:beta
```

Roda 12 casos: Séralini (PDF), Outras Palavras, Mother Jones, Federalist, Brasil de Fato, Terra, CNN Brasil, Reuters, 3 textos históricos (AI-5 de 1968, Doutrina Truman de 1947, Nabuco de 1883) e 1 PDF escaneado (transcrição pela IA). No fim, mostra as **REGRAS** (✅/❌) e grava os resultados completos em `testes/resultados/…-completo.json`.

Se algo der ❌, anexe no chat o arquivo `…-completo.json` e o relatório `testes/resultados/lixo-….md`.

## O que cada item precisa mostrar para estar OK

### 1. Classificação de veículos
- ✅ quando `conferir-veiculos` termina com **0 não batem** e **0 não abriram**.
- Veículo sem fonte pública confiável **não entra na lista**: aparece como "estimativa da IA", com aviso.
- Tabela atual: `docs/veiculos-conferidos.md`.

### 2. Contradições internas
- Toda análise confere o próprio resumo no fim: (a) gênero e rótulo de opinião; (b) versão neutra × "sem fonte"; (c) lado, intensidade e equilíbrio da disputa; (d) "sem viés"/"viés leve" × notas altas; e, em textos históricos, nomes posteriores à época.
- Se houver contradição, a IA refaz o resumo (até 2 vezes); se ainda falhar, a frase é retirada.
- ✅ quando, no `teste:beta`, todas as linhas "nenhuma contradição sobrou no resumo" estão ✅ e `checar-contradicoes` mostra 0 com contradição.

### 3. Lixo da página
- ✅ quando `checar-lixo` mostra "nenhum lixo sobrou" e "nenhum parágrafo de conteúdo foi removido" em todos os links.
- Para ampliar a lista de lixo: `lib/extract/lixo-por-site.ts`.

### 4. Título de PDFs
- ✅ quando `checar-pdfs` mostra ✓ em título, autores, revista e data de todos os PDFs.
- O título nunca pode ser o nome do arquivo (o teste usa de propósito o nome "Teste unslant pdf.pdf").

### 4b. PDFs escaneados
- ✅ quando `checar-pdfs` reconhece os escaneados e, no `teste:beta`, o caso "PDF escaneado" tem o texto transcrito com os trechos esperados.
- Lembrete: depois de mudar o SQL (`supabase/migrations/0001_unslant.sql`), rode-o de novo no Supabase.

### 5. Textos históricos
- ✅ quando, no `teste:beta`, os 3 casos históricos têm: época identificada corretamente, reconhecido como histórico, nenhum partido ou figura atual na análise e (Nabuco) eixos "não se aplica".
- Para ampliar a trava de anacronismo: `lib/historico.ts` (nome + ano a partir do qual faz sentido).

## Resultado da última verificação (Rodada 10, 10/11/2026)

| Item | Status | Evidência |
|---|---|---|
| 1. Veículos | ✅ OK | 92 domínios: 73 conferidos na fonte, 0 errados, 19 sem classificação política. CBS = RIGHT-CENTER no MBFC (atualizado em 28/04/2026), igual à lista. 3 notas corrigidas para o texto exato da fonte (Gazeta do Povo, Brasil de Fato, Aos Fatos). |
| 2. Contradições | ⏳ Falta IA de verdade | Verificador testado: 7 tipos detectados em casos montados, 0 alarmes falsos nos 3 exemplos prontos; correção testada com IA falsa (resumo refeito; frase retirada). Falta o `teste:beta`. |
| 3. Lixo | ⏳ Parcial | Outras Palavras: boletim, "Receba por email", Apoia.se, tags e 2 parágrafos repetidos (estão no HTML do site) removidos; Séralini: anúncio da Springer e 2.501 palavras de referências separadas; nada de conteúdo removido. Falta rodar `checar-lixo` com os links guardados no computador do usuário. |
| 4. PDFs | ⚠️ 4 de 5 | Séralini, NEJM e 2 sintéticos: título, autores, revista e data certos. Telegrama de 1964 (escaneado): o site ainda não lê PDFs escaneados. |
| 5. Históricos | ⏳ Falta IA de verdade | Trava de anacronismo testada (6 casos certos, ex.: Lula barrado em 1964 e aceito em 1989); rodada com IA falsa sem erros. Falta o `teste:beta`. |
