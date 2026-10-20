import type { ReportReason } from '@rowle/core';
import { supabase } from '../supabase';

export type ReportResult = 'ok' | 'limite' | 'indisponivel' | 'erro';

/** Envia a denúncia anônima (função submit_report do banco). */
export async function sendReport(eventId: string, sessionId: string | undefined, reason: ReportReason, details: string): Promise<ReportResult> {
  const { error } = await supabase.rpc('submit_report', {
    p_event_id: eventId,
    p_reason: reason,
    p_details: details.trim() || undefined,
    p_session_id: sessionId,
  });
  if (!error) return 'ok';
  if (error.code === 'P0429') return 'limite';
  if (error.code === 'P0002') return 'indisponivel';
  return 'erro';
}
