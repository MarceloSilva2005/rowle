"use server";

import { slugify } from "@rowle/core";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../action-form";

export async function createVenue(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const name = String(formData.get("nome") ?? "").trim();
  const address = String(formData.get("endereco") ?? "").trim();
  const regionId = Number(formData.get("regiao"));
  const accessibility = String(formData.get("acessibilidade") ?? "").trim();

  if (name.length < 2) return { error: "Preencha o nome do local." };
  if (address.length < 5) return { error: "Preencha o endereço." };
  if (!Number.isInteger(regionId) || regionId < 1) return { error: "Escolha a região." };

  const supabase = await createClient();
  const { error } = await supabase.from("venues").insert({
    name,
    address,
    region_id: regionId,
    slug: slugify(name),
    accessibility_notes: accessibility || null,
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath("/painel/locais");
  return { ok: `Local "${name}" cadastrado.` };
}
