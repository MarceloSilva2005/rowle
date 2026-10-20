"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@rowle/core";
import { supabaseEnv } from "./env";

let client: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Cliente anônimo no navegador, para os formulários públicos. Chama o banco direto
 * do aparelho do visitante: o limite por origem conta o IP dele, não o do servidor.
 */
export function browserClient() {
  if (!client) {
    const { url, key } = supabaseEnv();
    client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
