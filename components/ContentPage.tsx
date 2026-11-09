/**
 * Moldura comum das páginas de texto (Metodologia, Tipos de viés, Privacidade...).
 */

export function ContentPage({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl pt-8 sm:pt-14">
      <h1 className="text-[2rem] leading-[1.15] font-semibold sm:text-[2.5rem]">{title}</h1>
      {lede && <p className="mt-4 max-w-[62ch] text-[19px] leading-relaxed text-muted">{lede}</p>}
      <div className="prose-u mt-6">{children}</div>
    </article>
  );
}
