/**
 * IMAGENS E GRÁFICOS — preparação do que vai para a IA.
 *
 * As imagens chegam de dois jeitos:
 *  - PDF: o navegador transforma em imagem as páginas com figura/tabela
 *    (lib/extract/pdf-client.ts) e manda junto com o texto;
 *  - Link: o servidor baixa as imagens que estão dentro da matéria
 *    (lib/extract/url.ts, com as mesmas proteções das páginas).
 */

import "server-only";
import { config } from "@/lib/config";
import { countWords } from "@/lib/text";
import type { CallImage } from "@/lib/ai/client";

export interface VisualInput {
  /** "img-1", "img-2"... (a IA só pode citar esses ids). */
  id: string;
  /** Rótulo para o leitor: "Página 7", "Imagem 2". */
  label: string;
  caption?: string;
  mediaType: CallImage["mediaType"];
  /** base64, sem o prefixo "data:". */
  data: string;
  /** Miniatura para a tela (endereço da imagem ou data URL pequena). */
  thumb?: string;
}

/** Lista das figuras para o prompt (o rótulo de cada uma também vai antes da imagem). */
export function figureLabel(v: VisualInput) {
  return `[${v.id} — ${v.label}${v.caption ? `; legenda: ${v.caption.slice(0, 200)}` : ""}]`;
}

export function toCallImages(inputs: VisualInput[]): CallImage[] {
  return inputs.map((v) => ({ label: figureLabel(v), mediaType: v.mediaType, data: v.data }));
}

const FIGURE_REF = /\b(fig(?:ura|ure)?s?\.?|tabelas?|tables?|gr[aá]ficos?|charts?|quadros?|imagens?|fotos?)\s*\d*/i;

/**
 * Texto que acompanha as imagens: inteiro, se for curto; se for longo, o começo
 * e os parágrafos que falam de figuras, tabelas e gráficos (é o que a IA
 * precisa para comparar o texto com as imagens).
 */
export function visualContext(text: string): string {
  if (countWords(text) <= config.visual.maxContextWords) return text;
  const paragraphs = text.split(/\n{2,}/);
  const picked: string[] = [];
  let words = 0;
  const add = (p: string) => {
    const w = countWords(p);
    if (words + w > config.visual.maxContextWords) return false;
    picked.push(p);
    words += w;
    return true;
  };
  // começo do texto (título, resumo, introdução): até ~1/3 do limite
  for (const p of paragraphs) {
    if (words > config.visual.maxContextWords / 3) break;
    add(p);
  }
  for (const p of paragraphs) {
    if (!picked.includes(p) && FIGURE_REF.test(p) && !add(p)) break;
  }
  return picked.join("\n\n");
}

/**
 * Categorias em que um problema de IMAGEM pode entrar (além das duas "só de
 * imagem"). Ex.: fotos chocantes de tumores → "Medo e indignação"; gráfico
 * que corta o período → "Recorte temporal seletivo". A nota da categoria
 * passa a considerar o texto e as imagens. Só valem as categorias dos grupos
 * ativos naquela análise (as acadêmicas, só em papers).
 */
export const IMAGE_CATEGORY_IDS = [
  "misleading_chart",
  "visual_framing",
  "fear_outrage",
  "clickbait",
  "misleading_numbers",
  "cherry_picking",
  "correlation_causation",
  "selective_facts",
  "stereotype_gender",
  "stereotype_race",
  "stereotype_class",
  "stereotype_region",
  "stereotype_religion",
  "stereotype_nationality",
  "sampling_bias",
  "observational_causality",
  "p_hacking",
  "unacknowledged_limitations",
] as const;
