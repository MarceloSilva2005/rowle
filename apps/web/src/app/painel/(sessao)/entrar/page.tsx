import { symbolSvg } from "@rowle/design";
import { Suspense } from "react";
import { ActionForm } from "../../action-form";
import { signIn } from "./actions";

const asImage = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export default function EntrarPage({ searchParams }: PageProps<"/painel/entrar">) {
  return (
    <main className="login">
      <div className="cartao">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático da marca */}
        <img src={asImage(symbolSvg)} alt="" width={64} height={72} />
        <div>
          <h1>Painel da curadoria</h1>
          <p className="muted">Acesso restrito à equipe do Rowlê.</p>
        </div>
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
    </main>
  );
}

async function AccessNotice({ searchParams }: { searchParams: PageProps<"/painel/entrar">["searchParams"] }) {
  const { erro } = await searchParams;
  if (erro !== "sem-acesso") return null;
  return (
    <p className="mensagem-erro" role="alert">
      Esta conta não faz parte da equipe do painel.
    </p>
  );
}
