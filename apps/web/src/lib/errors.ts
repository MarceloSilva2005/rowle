type DbError = { code?: string; message: string };

// Restrições do banco → mensagens que a curadoria entende.
const CONSTRAINTS: Record<string, string> = {
  sessions_price_shape: "O preço não combina com o tipo escolhido (ex.: gratuito não tem valor; faixa precisa de mínimo e máximo).",
  sessions_time_order: "O término precisa ser depois do início.",
  venues_coordinates_pair: "Informe latitude e longitude juntas, ou nenhuma das duas.",
  events_cover_rights: "Toda capa precisa da informação de direitos de uso.",
  sources_has_reference: "A fonte precisa de um link ou de uma descrição.",
};

/** Converte um erro do Supabase/Postgres numa mensagem em português, sem detalhes técnicos. */
export function friendlyError(error: DbError | null | undefined): string {
  if (!error) return "Não foi possível salvar. Tente de novo.";
  if (error.code === "23505") return "Já existe um cadastro com esse endereço (slug). Mude o título ou o endereço.";
  if (error.code === "42501") return "Sua conta não tem permissão para isso.";
  if (error.code === "23514") {
    const constraint = /constraint "([^"]+)"/.exec(error.message)?.[1];
    if (constraint && CONSTRAINTS[constraint]) return CONSTRAINTS[constraint];
    if (constraint?.endsWith("_check")) return "Algum campo está fora do formato esperado. Confira os valores.";
    // Mensagens do ciclo de vida do evento já vêm em português, escritas no banco.
    return error.message;
  }
  return "Não foi possível salvar. Tente de novo.";
}
