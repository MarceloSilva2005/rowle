import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@rowle/core";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseEnv } from "./env";

/** Cliente do Supabase para Server Components e Server Actions, com a sessão do cookie. */
export async function createClient() {
  // Sessão é sempre por requisição; o cliente consulta o relógio ao validar o token.
  await connection();
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components não gravam cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
