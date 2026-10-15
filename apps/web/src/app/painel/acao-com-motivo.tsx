import { ActionForm, type FormAction } from "./action-form";

/**
 * Ação que exige justificativa (cancelar, adiar, recusar…). O campo só aparece
 * depois do clique, junto com o botão de confirmação, para a tela não virar uma
 * pilha de campos "Motivo" iguais.
 */
export function AcaoComMotivo({
  label,
  confirmLabel,
  action,
  fieldName,
  fieldLabel,
  hint,
  maxLength,
  variant = "perigo",
}: {
  label: string;
  confirmLabel: string;
  action: FormAction;
  fieldName: string;
  fieldLabel: string;
  hint: string;
  maxLength: number;
  variant?: "secundario" | "perigo";
}) {
  return (
    <details className="acao-com-motivo">
      <summary className={`botao ${variant === "perigo" ? "botao-perigo" : "botao-secundario"}`}>{label}</summary>
      <ActionForm action={action} submitLabel={confirmLabel} variant={variant} className="acao-com-motivo-form">
        <label className="campo">
          {fieldLabel} <small>{hint}</small>
          <input name={fieldName} maxLength={maxLength} required />
        </label>
      </ActionForm>
    </details>
  );
}
