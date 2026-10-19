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
 *
 * Sem as repetições automáticas do PostgREST: com 3 novas tentativas, o servidor fora
 * do ar levava uns 50 s até a tela de erro. A pessoa tenta de novo pelo botão.
 */
export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  db: { retry: false },
  global: { fetch: fetchWithTimeout },
});

/**
 * Endereço da capa: um link https direto (fotos provisórias do banco local) ou um
 * caminho no bucket público "covers" do Storage.
 */
export function coverUri(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('https://')) return path;
  return `${url}/storage/v1/object/public/covers/${path.split('/').map(encodeURIComponent).join('/')}`;
}
