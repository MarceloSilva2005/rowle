/** Fuso do DF. Sem horário de verão desde 2019, mas a exibição usa a regra oficial. */
export const TIME_ZONE = 'America/Sao_Paulo';

/**
 * Converte o valor de um campo `datetime-local` (horário de Brasília, sem fuso)
 * em instante ISO com fuso. Ex.: "2026-10-18T21:00" → "2026-10-18T21:00:00-03:00".
 */
export function brasiliaLocalToIso(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) throw new Error(`Data e hora inválidas: "${value}"`);
  const [, date, hm, seconds = '00'] = match;
  return `${date}T${hm}:${seconds}-03:00`;
}

/** Valor para um campo `datetime-local`, no horário de Brasília. */
export function isoToBrasiliaLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Data de uma sessão para exibição: "sáb., 18 de out. · 21h".
 * Sem horário confirmado: "sáb., 18 de out. · horário a confirmar".
 */
export function formatSessionDate(iso: string, timeConfirmed = true): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
  if (!timeConfirmed) return `${day} · horário a confirmar`;
  const [hour, minute] = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(date)
    .split(':');
  const time = minute === '00' ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
  return `${day} · ${time}`;
}
