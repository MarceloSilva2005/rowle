"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; exact?: boolean; count?: keyof QueueCounts };

// Filas primeiro (o trabalho do dia), depois o catálogo. Criar evento é botão, não página do menu.
const GROUPS: NavLink[][] = [
  [{ href: "/painel", label: "Visão geral", exact: true }],
  [
    { href: "/painel/sugestoes", label: "Sugestões", count: "submissions" },
    { href: "/painel/denuncias", label: "Denúncias", count: "reports" },
    { href: "/painel/revalidar", label: "Revalidar", count: "revalidation" },
  ],
  [
    { href: "/painel/eventos", label: "Eventos" },
    { href: "/painel/locais", label: "Locais" },
    { href: "/painel/organizacoes", label: "Organizações" },
  ],
];

export type QueueCounts = { submissions: number; reports: number; revalidation: number };

/** Menu do painel, marcando a seção atual. */
export function PainelNav({ counts }: { counts?: QueueCounts }) {
  return <NavLinks pathname={usePathname()} counts={counts} />;
}

/** Mesmo menu, sem marcar a seção: aparece enquanto o endereço e as filas ainda não foram lidos. */
export function NavLinks({ pathname, counts }: { pathname?: string; counts?: QueueCounts }) {
  const isCurrent = ({ href, exact }: NavLink) => pathname !== undefined && (exact ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="painel-nav" aria-label="Painel">
      {GROUPS.map((group, i) => (
        <div key={i} className="painel-nav-grupo">
          {group.map((link) => {
            const n = link.count && counts ? counts[link.count] : 0;
            return (
              <Link key={link.href} href={link.href} aria-current={isCurrent(link) ? "page" : undefined}>
                {link.label}
                {n ? (
                  <span className="painel-nav-contador" aria-label={`${n} na fila`}>
                    {n}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
