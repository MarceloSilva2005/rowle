import { logoSvg, mascotSvg } from "@rowle/design";
import { Suspense } from "react";
import { ActionForm } from "../../action-form";
import { signIn } from "./actions";

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export default function EntrarPage({ searchParams }: PageProps<"/painel/entrar">) {
  return (
    <main className="login">
      <section className="login-marca" aria-label="Rowlê">
        <div className="fita-aviso" aria-hidden="true">
          {"ÁREA DA CURADORIA · ".repeat(10)}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático da marca */}
        <img className="login-logo" src={asImage(logoSvg)} alt="Rowlê" width={360} height={115} />
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático gerado pelo pacote de design */}
        <img className="login-toupeira" src={asImage(mascotSvg.acenando)} alt="" width={230} height={230} />
      </section>

      <section className="login-formulario">
        <div className="cartao">
          <h1>Entrar</h1>
          <Suspense fallback={null}>
            <AccessNotice searchParams={searchParams} />
          </Suspense>
          <ActionForm action={signIn} submitLabel="Entrar" pendingLabel="Entrando…">
            <div className="grade-campos">
              <label className="campo campo-largo">
                E-mail
                <input name="email" type="email" autoComplete="username" required />
              </label>
              <label className="campo campo-largo">
                Senha
                <input name="senha" type="password" autoComplete="current-password" required />
              </label>
            </div>
          </ActionForm>
        </div>
        <p className="login-rodape muted">Esqueceu a senha? Fale com o admin.</p>
      </section>
    </main>
  );
}

async function AccessNotice({ searchParams }: { searchParams: PageProps<"/painel/entrar">["searchParams"] }) {
  const { erro } = await searchParams;
  if (erro !== "sem-acesso") return null;
  return (
    <p className="mensagem-erro" role="alert">
      Essa conta não tem acesso ao painel.
    </p>
  );
}
