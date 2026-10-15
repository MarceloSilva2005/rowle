"use server";

import { canChangeReport, reportRequiresNote, type ReportStatus } from "@rowle/core";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../action-form";

export async function changeReportStatus(
  id: string,
  from: ReportStatus,
  to: ReportStatus,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  if (!canChangeReport(from, to)) return { error: "Essa mudança não é permitida." };
  const note = String(formData.get("nota") ?? "").trim() || null;
  if (reportRequiresNote(to) && !note) return { error: "Escreva o que foi feito." };

  const closing = reportRequiresNote(to);
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      status: to,
      ...(closing ? { resolution_note: note, resolved_by: staff.id, resolved_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .eq("status", from);
  if (error) return { error: friendlyError(error) };

  revalidatePath("/painel/denuncias");
  return { ok: "Denúncia atualizada." };
}
