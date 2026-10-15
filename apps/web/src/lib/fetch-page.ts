import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8_000;

/** `blocked`: o link foi recusado por segurança e não deve virar fonte do evento. */
export type PageResult = { html: string; url: string } | { error: string; blocked?: boolean };

/** Endereços que nunca devem ser buscados a partir do servidor (rede interna, loopback etc.). */
function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number) as [number, number];
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  const v6 = address.toLowerCase();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v6);
  if (mapped) return isPrivateAddress(mapped[1]!);
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("ff");
}

async function checkUrl(raw: string): Promise<URL | string> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Link inválido.";
  }
  if (url.protocol !== "https:") return "Só busco páginas com https://.";
  if (url.username || url.password) return "Link com usuário ou senha não é aceito.";
  if (url.port && url.port !== "443") return "Link com porta diferente não é aceito.";
  const host = url.hostname.replace(/^\[|\]$/g, "");
  try {
    const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
    if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) return "Esse endereço não pode ser consultado.";
  } catch {
    return "Não encontrei esse site. Confira o link.";
  }
  return url;
}

/**
 * Baixa o HTML de uma página pública para o assistente de cadastro. Só https,
 * sem rede interna, com limite de tempo, de tamanho e de redirecionamentos.
 */
export async function fetchPublicPage(raw: string): Promise<PageResult> {
  let target = raw.trim();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await checkUrl(target);
    if (typeof url === "string") return { error: url, blocked: true };

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "text/html,application/xhtml+xml", "accept-language": "pt-BR,pt;q=0.9", "user-agent": "RowleCuradoria/0.1" },
      });
    } catch {
      return { error: "O site não respondeu a tempo." };
    }

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      target = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) return { error: `O site respondeu com erro (${response.status}).` };
    const type = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/i.test(type)) return { error: "O link não é de uma página." };

    const reader = response.body?.getReader();
    if (!reader) return { error: "A página veio vazia." };
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => undefined);
    const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks).subarray(0, MAX_BYTES));
    return { html, url: url.toString() };
  }
  return { error: "O link redireciona vezes demais." };
}
