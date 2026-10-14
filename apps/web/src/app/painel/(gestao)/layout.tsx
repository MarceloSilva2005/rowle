import { symbolSvg } from "@rowle/design";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { signOut } from "../(sessao)/entrar/actions";

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export default function GestaoLayout({ children }: LayoutProps<"/painel">) {
  return (
    <>
      <header className="painel-topo">
        <Link href="/painel" aria-label="Início do painel">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático da marca */}
          <img src={asImage(symbolSvg)} alt="" width={34} height={38} />
        </Link>
        <nav aria-label="Painel">
          <Link href="/painel/eventos">Eventos</Link>
          <Link href="/painel/eventos/novo">Novo evento</Link>
          <Link href="/painel/locais">Locais</Link>
        </nav>
        <Suspense fallback={<span className="muted">…</span>}>
          <StaffBadge />
        </Suspense>
        <form action={signOut}>
          <button type="submit" className="botao botao-secundario">
            Sair
          </button>
        </form>
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
