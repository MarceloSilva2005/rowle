"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../action-form";

/** A curadoria reconferiu data, local e ingresso na fonte: o prazo recomeça. */
export async function markVerified(eventId: string): Promise<FormState> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_event_verified", { p_event_id: eventId });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/painel/revalidar");
  revalidatePath(`/painel/eventos/${eventId}`);
  return { ok: "Conferido." };
}
