import Link from "next/link";
import { Mascote } from "../ui";

export default function PainelNaoEncontrado() {
  return (
    <section className="pagina-erro">
      <Mascote pose="procurando" size={150} />
      <h1>Cadastro não encontrado</h1>
      <p className="muted">O link pode estar errado ou o cadastro foi excluído.</p>
      <div className="acoes">
        <Link href="/painel/eventos" className="botao">
          Ver eventos
        </Link>
        <Link href="/painel" className="botao botao-secundario">
          Visão geral
        </Link>
      </div>
    </section>
  );
}
