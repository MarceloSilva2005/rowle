import { createClient } from '@supabase/supabase-js';
import type { Database } from '@rowle/core';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error('Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_KEY em apps/mobile/.env.local.');
}

const TIMEOUT_MS = 10_000;

/** Sem rede, o fetch do Android pode ficar pendurado: corta em 10 s. */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  init?.signal?.addEventListener('abort', () => controller.abort());
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Cliente só de leitura pública (papel anon). O app não tem login: nada de
 * sessão guardada nem renovação de token.
 */
export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: fetchWithTimeout },
});
