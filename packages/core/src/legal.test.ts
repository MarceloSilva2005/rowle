import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatLegalDate, LEGAL_CONTACT_EMAIL, PRIVACY_POLICY, RETENTION, TERMS_OF_USE } from './legal';

const migration = (name: string) => readFileSync(new URL(`../../../supabase/migrations/${name}`, import.meta.url), 'utf8');

describe('textos legais', () => {
  it('os prazos da política são os mesmos que o banco aplica', () => {
    const retention = migration('20261022120000_retention.sql');
    expect(retention).toContain(`interval '${RETENTION.submissionEmailDays} days'`);
    expect(retention).toContain(`interval '${RETENTION.reportDetailsYears} year'`);
    expect(retention).toContain(`interval '${RETENTION.historyYears} years'`);
    expect(retention).toContain(`interval '${RETENTION.rateLimitHours} hours'`);
    expect(migration('20261021120000_automations.sql')).toContain(`interval '${RETENTION.archivedAfterDays} days'`);
  });

  it('os dois documentos trazem o contato e nenhuma seção vazia', () => {
    for (const doc of [PRIVACY_POLICY, TERMS_OF_USE]) {
      expect(doc.sections.map((s) => [...(s.paragraphs ?? []), ...(s.items ?? [])].join(' ')).join(' ')).toContain(LEGAL_CONTACT_EMAIL);
      for (const s of doc.sections) expect((s.paragraphs?.length ?? 0) + (s.items?.length ?? 0)).toBeGreaterThan(0);
    }
  });

  it('formata a data de atualização por extenso', () => {
    expect(formatLegalDate('2026-10-22')).toBe('22 de outubro de 2026');
  });
});
