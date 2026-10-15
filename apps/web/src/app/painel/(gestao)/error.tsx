"use client";

import Link from "next/link";
import { Mascote } from "../ui";

/** Falha inesperada numa página do painel. Os detalhes técnicos ficam no log do servidor. */
export default function PainelErro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="pagina-erro">
      <Mascote pose="erro" size={150} />
      <h1>Algo deu errado</h1>
      <p className="muted">A página não carregou. Tente de novo em instantes.</p>
      <div className="acoes">
        <button type="button" className="botao" onClick={reset}>
          Tentar de novo
        </button>
        <Link href="/painel" className="botao botao-secundario">
          Voltar à visão geral
        </Link>
      </div>
    </section>
  );
}
