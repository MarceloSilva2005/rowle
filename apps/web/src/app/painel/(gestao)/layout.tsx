import { OPEN_REPORT_STATUSES, OPEN_SUBMISSION_STATUSES } from "@rowle/core";
import { logoSvg } from "@rowle/design";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(sessao)/entrar/actions";
import { NavLinks, PainelNav } from "./nav";

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export default function GestaoLayout({ children }: LayoutProps<"/painel">) {
  return (
    <>
      <header className="painel-topo">
        <div className="painel-topo-linha">
          <Link href="/painel" className="painel-marca" aria-label="Rowlê · início do painel">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático da marca */}
            <img src={asImage(logoSvg)} alt="" width={96} height={30} />
            <span className="etiqueta-fita">Curadoria</span>
          </Link>
          <Suspense fallback={<NavLinks />}>
            <NavWithCounts />
          </Suspense>
          <div className="painel-conta">
            <Link href="/painel/eventos/novo" className="botao painel-novo">
              Novo evento
            </Link>
            <Suspense fallback={<span className="muted">…</span>}>
              <StaffBadge />
            </Suspense>
            <form action={signOut}>
              <button type="submit" className="botao botao-fantasma">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="painel-conteudo">{children}</main>
    </>
  );
}

async function NavWithCounts() {
  await requireStaff();
  const supabase = await createClient();
  const [submissions, reports, revalidation] = await Promise.all([
    supabase.from("submissions").select("id", { count: "exact", head: true }).in("status", [...OPEN_SUBMISSION_STATUSES]),
    supabase.from("reports").select("id", { count: "exact", head: true }).in("status", [...OPEN_REPORT_STATUSES]),
    supabase.from("revalidation_queue").select("event_id", { count: "exact", head: true }),
  ]);
  return (
    <PainelNav
      counts={{ submissions: submissions.count ?? 0, reports: reports.count ?? 0, revalidation: revalidation.count ?? 0 }}
    />
  );
}

async function StaffBadge() {
  const staff = await requireStaff();
  return (
    <span className="muted painel-quem">
      {staff.name} · {staff.role === "admin" ? "admin" : "curadoria"}
    </span>
  );
}
