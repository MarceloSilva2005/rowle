"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/painel", label: "Visão geral", exact: true },
  { href: "/painel/eventos", label: "Eventos", exclude: ["/painel/eventos/assistente", "/painel/eventos/novo"] },
  { href: "/painel/eventos/assistente", label: "Assistente" },
  { href: "/painel/eventos/novo", label: "Novo evento" },
  { href: "/painel/sugestoes", label: "Sugestões" },
  { href: "/painel/denuncias", label: "Denúncias" },
  { href: "/painel/locais", label: "Locais" },
  { href: "/painel/organizacoes", label: "Organizações" },
];

/** Menu do painel, marcando a seção atual. */
export function PainelNav() {
  return <NavLinks pathname={usePathname()} />;
}

/** Mesmo menu, sem marcar a seção: aparece enquanto o endereço ainda não foi lido. */
export function NavLinks({ pathname }: { pathname?: string }) {
  const isCurrent = ({ href, exact, exclude }: (typeof LINKS)[number]) =>
    pathname !== undefined &&
    (exact ? pathname === href : pathname.startsWith(href) && !exclude?.some((e) => pathname.startsWith(e)));

  return (
    <nav className="painel-nav" aria-label="Painel">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} aria-current={isCurrent(link) ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
