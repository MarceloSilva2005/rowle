"use client";

import { useActionState, type ReactNode } from "react";

export type FormState = { error?: string; ok?: string };
export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

/** Formulário ligado a uma Server Action, com estado de envio e mensagem de retorno. */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Salvando…",
  variant = "primario",
  className,
}: {
  action: FormAction;
  children?: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  variant?: "primario" | "secundario" | "perigo";
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const buttonClass = variant === "primario" ? "botao" : variant === "perigo" ? "botao botao-perigo" : "botao botao-secundario";
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="acoes">
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
      {state.error ? (
        <p className="mensagem-erro" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mensagem-ok" role="status">
          {state.ok}
        </p>
      ) : null}
    </form>
  );
}
