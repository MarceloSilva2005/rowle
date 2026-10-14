import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Database } from './database.types';
import {
  canChangeReport,
  canChangeSubmission,
  readSubmissionPayload,
  reportRequiresNote,
  SUBMISSION_TRANSITIONS,
  type ReportReason,
  type ReportStatus,
  type SubmissionStatus,
} from './queues';

describe('sugestões', () => {
  it('aceita e recusa são situações finais', () => {
    expect(SUBMISSION_TRANSITIONS.accepted).toEqual([]);
    expect(SUBMISSION_TRANSITIONS.rejected).toEqual([]);
  });

  it('pedir informações volta para análise', () => {
    expect(canChangeSubmission('received', 'needs_info')).toBe(true);
    expect(canChangeSubmission('needs_info', 'in_review')).toBe(true);
    expect(canChangeSubmission('accepted', 'in_review')).toBe(false);
  });
});

describe('denúncias', () => {
  it('encerrar exige nota; investigar não', () => {
    expect(reportRequiresNote('resolved')).toBe(true);
    expect(reportRequiresNote('dismissed')).toBe(true);
    expect(reportRequiresNote('investigating')).toBe(false);
  });

  it('denúncia encerrada não reabre', () => {
    expect(canChangeReport('open', 'investigating')).toBe(true);
    expect(canChangeReport('resolved', 'open')).toBe(false);
  });
});

describe('readSubmissionPayload', () => {
  it('fica só com os campos conhecidos e de tipo certo', () => {
    expect(
      readSubmissionPayload({
        title: '  Samba na Laje ',
        categoryId: 3,
        venueName: '',
        ticketUrl: 42,
        extra: 'ignorado',
      }),
    ).toEqual({ title: 'Samba na Laje', categoryId: 3 });
  });

  it('não quebra com JSON inesperado', () => {
    expect(readSubmissionPayload(null)).toEqual({});
    expect(readSubmissionPayload(['a'])).toEqual({});
    expect(readSubmissionPayload({ categoryId: 1.5 })).toEqual({});
  });
});

describe('paridade com o banco', () => {
  it('os enums do core são os mesmos do Postgres', () => {
    type Enums = Database['public']['Enums'];
    expectTypeOf<SubmissionStatus>().toEqualTypeOf<Enums['submission_status']>();
    expectTypeOf<ReportStatus>().toEqualTypeOf<Enums['report_status']>();
    expectTypeOf<ReportReason>().toEqualTypeOf<Enums['report_reason']>();
  });
});
