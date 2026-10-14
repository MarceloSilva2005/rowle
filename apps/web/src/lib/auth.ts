import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type StaffMember = {
  id: string;
  name: string;
  role: "curator" | "admin";
};

/**
 * Camada de acesso: devolve quem está logado se for da equipe; senão, manda
 * para o login. Toda página e toda ação do painel passa por aqui.
 */
export async function requireStaff(): Promise<StaffMember> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/painel/entrar");

  const { data: staff } = await supabase
    .from("staff")
    .select("user_id, display_name, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff) redirect("/painel/entrar?erro=sem-acesso");

  return { id: staff.user_id, name: staff.display_name, role: staff.role };
}
