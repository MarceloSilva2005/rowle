import { logoSvg } from "@rowle/design";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
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
            <PainelNav />
          </Suspense>
          <div className="painel-conta">
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

async function StaffBadge() {
  const staff = await requireStaff();
  return (
    <span className="muted">
      {staff.name} · {staff.role === "admin" ? "admin" : "curadoria"}
    </span>
  );
}
