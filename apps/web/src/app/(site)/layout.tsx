import { logoSvg } from "@rowle/design";
import Link from "next/link";
import "../painel/painel.css";
import "./site.css";

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Páginas públicas do site: mesmo visual do painel, coluna estreita. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="painel site">
      <header className="painel-topo">
        <div className="painel-topo-linha site-topo">
          <Link href="/" className="painel-marca" aria-label="Rowlê · início">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático da marca */}
            <img src={asImage(logoSvg)} alt="" width={96} height={30} />
          </Link>
          <nav className="site-nav" aria-label="Site">
            <Link href="/divulgue">Divulgue seu rolê</Link>
            <Link href="/acompanhar">Acompanhar</Link>
          </nav>
        </div>
      </header>
      <main className="painel-conteudo site-conteudo">{children}</main>
    </div>
  );
}
