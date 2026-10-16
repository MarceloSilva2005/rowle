import { mascotSvg, type MascotPose } from "@rowle/design";
import type { ReactNode } from "react";

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Toupeira do Rowlê numa das poses do kit. Decorativa: o texto ao lado diz o que importa. */
export function Mascote({ pose, size = 120, className }: { pose: MascotPose; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático gerado pelo pacote de design
    <img src={asImage(mascotSvg[pose])} alt="" width={size} height={size} className={className} />
  );
}

/** Lista ou fila sem itens: a toupeira procurando, uma frase e, se fizer sentido, o próximo passo. */
export function EstadoVazio({
  titulo,
  children,
  acao,
  pose = "procurando",
}: {
  titulo: string;
  children?: ReactNode;
  acao?: ReactNode;
  pose?: MascotPose;
}) {
  return (
    <div className="estado-vazio">
      <Mascote pose={pose} size={112} />
      <div>
        <p className="estado-vazio-titulo">{titulo}</p>
        {children ? <p className="muted">{children}</p> : null}
        {acao ? <div className="acoes">{acao}</div> : null}
      </div>
    </div>
  );
}

/** Espera de carregamento: as três toupeiras saindo da toca. */
export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div className="carregando" role="status">
      <Mascote pose="carregando" size={96} />
      <span className="muted">{texto}</span>
    </div>
  );
}
