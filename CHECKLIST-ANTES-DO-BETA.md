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

**2. Teste com a IA de verdade (~US$ 2,90, ~35 minutos):**

```bash
npm run teste:beta
```

Roda 13 casos: Séralini (PDF), Outras Palavras, Mother Jones, Federalist, Brasil de Fato, Terra, CNN Brasil, Reuters, 3 textos históricos (AI-5 de 1968, Doutrina Truman de 1947, Nabuco de 1883) 1 PDF escaneado sintético e o telegrama escaneado de Lincoln Gordon (1964), os dois com transcrição pela IA. No fim, mostra as **REGRAS** (✅/❌) e grava os resultados completos em `testes/resultados/…-completo.json`.

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

## Resultado da última verificação (11/11/2026, antes do beta com professores e historiadores)

| Item | Status | Evidência |
|---|---|---|
| 1. Veículos | ✅ OK | `conferir-veiculos`: 73 conferidos na fonte, 0 errados, 19 sem classificação política. CBS = RIGHT-CENTER no MBFC (28/04/2026). Lista publicada na Metodologia. |
| 2. Contradições | ✅ OK | `teste:beta`: 13 análises, nenhuma contradição sobrou. O site achou e corrigiu 7 sozinho (Federalist, Reuters, Séralini, Truman ×2 — 1 frase retirada —, telegrama ×2). |
| 3. Lixo | ✅ OK | `checar-lixo`: 12 de 12 links e PDFs limpos, nenhum conteúdo removido por engano (ex.: CNN "Leia Mais" + 3 manchetes; Federalist 13 tags; Mother Jones newsletter; Outras Palavras boletim, apoio, tags e 2 parágrafos repetidos; Séralini anúncio da Springer e 2.501 palavras de referências). |
| 4. PDFs | ✅ OK | `checar-pdfs`: 6 de 6 (Séralini e NEJM com título, autores, revista e data certos; escaneados reconhecidos). |
| 4b. Escaneados | ✅ OK | Sintético e telegrama de Gordon (12 páginas, preto e branco) transcritos pela IA com os trechos esperados. Observação: 1 lote de 4 páginas do telegrama foi recusado pela Anthropic (erro 400) e a nova tentativa página por página resolveu. |
| 5. Históricos | ✅ OK | AI-5 (13/12/1968), Truman (12/03/1947, sem data no texto), Nabuco (1880; eixos "não se aplica"), Gordon (27/03/1964): época certa, reconhecidos como históricos, nenhuma figura atual. |
| Notas e simetria | ✅ OK | 8 artigos dentro da faixa; Brasil de Fato × Terra 0,2 de diferença; Mother Jones × Federalist 0,7; lados opostos. |
| Custo | ℹ️ | Média US$ 0,20 por análise; papers ~US$ 0,45; escaneado de 12 páginas ~US$ 0,32. |
