/**
 * Logo do unslant: um traço inclinado "/" que fica reto "|" — o texto sendo
 * desentortado.
 */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--color-teal)" />
      <rect x="14.25" y="7" width="3.5" height="18" rx="1.75" fill="#ffffff" opacity="0.38" transform="rotate(28 16 16)" />
      <rect x="14.25" y="7" width="3.5" height="18" rx="1.75" fill="#ffffff" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.2rem] font-semibold tracking-tight text-ink">unslant</span>
    </span>
  );
}
