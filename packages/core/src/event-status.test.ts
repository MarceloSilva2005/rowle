import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { canTransition, EVENT_TRANSITIONS, type EventStatus, requiresNote } from './event-status';

const rulesSql = readFileSync(
  fileURLToPath(new URL('../../../supabase/migrations/20261014200200_rules.sql', import.meta.url)),
  'utf8',
);

function transitionsFromSql(): Set<string> {
  const body = rulesSql.slice(
    rulesSql.indexOf('create function public.event_transition_allowed'),
    rulesSql.indexOf('create function public.enforce_event_lifecycle'),
  );
  const pairs = [...body.matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)].map(([, from, to]) => `${from}>${to}`);
  return new Set(pairs);
}

function transitionsFromCore(): Set<string> {
  return new Set(
    Object.entries(EVENT_TRANSITIONS).flatMap(([from, tos]) => tos.map((to) => `${from}>${to}`)),
  );
}

describe('ciclo de vida do evento', () => {
  it('é idêntico ao que o banco aplica', () => {
    const sql = transitionsFromSql();
    expect(sql.size).toBeGreaterThan(0);
    expect(transitionsFromCore()).toEqual(sql);
  });

  it('não deixa um rascunho ir direto para publicado', () => {
    expect(canTransition('draft', 'published')).toBe(false);
    expect(canTransition('in_review', 'published')).toBe(true);
  });

  it('arquivado é final', () => {
    const statuses = Object.keys(EVENT_TRANSITIONS) as EventStatus[];
    expect(statuses.some((s) => canTransition('archived', s))).toBe(false);
  });

  it('exige motivo para rejeitar, cancelar, adiar ou suspender', () => {
    expect(requiresNote('rejected')).toBe(true);
    expect(requiresNote('cancelled')).toBe(true);
    expect(requiresNote('published')).toBe(false);
  });
});
