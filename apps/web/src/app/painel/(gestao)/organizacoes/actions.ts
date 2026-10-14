"use server";

import { slugify } from "@rowle/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../action-form";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;

/** Aceita "@perfil", "perfil" ou o link do perfil. */
function instagramHandle(raw: string): string | null {
  const handle = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  return handle || null;
}

function organizationFields(fd: FormData) {
  return {
    name: text(fd, "nome"),
    website_url: optional(fd, "site"),
    instagram_handle: instagramHandle(text(fd, "instagram")),
  };
}

function checkOrganization(fields: ReturnType<typeof organizationFields>): string | null {
  if (fields.name.length < 2) return "Informe o nome da organização.";
  if (fields.website_url && !fields.website_url.startsWith("https://")) return "O site precisa começar com https://";
  if (fields.instagram_handle && !/^[A-Za-z0-9._]{1,30}$/.test(fields.instagram_handle))
    return "Perfil do Instagram inválido (só letras, números, ponto e sublinhado).";
  return null;
}

function contactFields(fd: FormData) {
  return {
    contact_name: optional(fd, "contato_nome"),
    email: optional(fd, "contato_email"),
    phone: optional(fd, "contato_telefone"),
    notes: optional(fd, "contato_notas"),
  };
}

const hasContact = (c: ReturnType<typeof contactFields>) => Object.values(c).some(Boolean);

export async function createOrganization(_state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const fields = organizationFields(formData);
  const problem = checkOrganization(fields);
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...fields, slug: slugify(fields.name) })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyError(error) };

  const contact = contactFields(formData);
  if (hasContact(contact)) {
    const { error: contactError } = await supabase
      .from("organization_contacts")
      .insert({ organization_id: data.id, ...contact });
    // A organização já existe; o contato pode ser corrigido na página dela.
    if (contactError) redirect(`/painel/organizacoes/${data.id}?aviso=contato`);
  }

  redirect(`/painel/organizacoes/${data.id}`);
}

export async function updateOrganization(id: string, _state: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const fields = organizationFields(formData);
  const problem = checkOrganization(fields);
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ ...fields, ...(staff.role === "admin" ? { verified: formData.get("verificada") === "on" } : {}) })
    .eq("id", id);
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/organizacoes/${id}`);
  revalidatePath("/painel/organizacoes");
  return { ok: "Organização atualizada." };
}

export async function saveContact(id: string, _state: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const contact = contactFields(formData);
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_contacts")
    .upsert({ organization_id: id, ...contact, updated_at: new Date().toISOString() });
  if (error) return { error: friendlyError(error) };

  revalidatePath(`/painel/organizacoes/${id}`);
  return { ok: "Contato salvo." };
}
