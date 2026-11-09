"use client";

import { useDict } from "@/lib/i18n";
import { NavLinks } from "@/components/SiteHeader";

export function SiteFooter() {
  const t = useDict();
  return (
    <footer className="border-t border-line px-4 py-8 text-sm text-muted sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-4">
        <nav aria-label={t.nav.menu}>
          <NavLinks className="flex flex-wrap gap-x-6 gap-y-2" />
        </nav>
        <p className="max-w-[72ch]">{t.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
