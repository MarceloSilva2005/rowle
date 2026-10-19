import { isAgeRating, priceFromColumns, sessionIsOver, type AgeRating, type Price } from '@rowle/core';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

export interface EventSession {
  id: string;
  startsAt: string;
  endsAt: string | null;
  timeConfirmed: boolean;
  status: 'scheduled' | 'postponed' | 'cancelled' | 'sold_out';
  price: Price;
  ticketUrl: string | null;
  venue: { name: string; address: string; regionId: number; accessibilityNotes: string | null };
}

export interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  categoryId: number;
  status: 'published' | 'postponed' | 'cancelled' | string;
  statusNote: string | null;
  ageRating: AgeRating | null;
  ageRatingOfficial: boolean;
  accessibilityNotes: string | null;
  organization: { name: string; verified: boolean } | null;
  /** Só as sessões que ainda não acabaram, em ordem. */
  sessions: EventSession[];
  lastVerifiedAt: string | null;
  coverPath: string | null;
}

export type EventState = { status: 'loading' } | { status: 'error' } | { status: 'not-found' } | { status: 'ready'; event: EventDetail };

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  const { data: e, error } = await supabase
    .from('events')
    .select('id, slug, title, description, cover_path, category_id, status, status_note, age_rating, age_rating_official, accessibility_notes, organizations(name, verified)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!e) return null;
  const [sessions, verified] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, starts_at, ends_at, time_confirmed, status, price_kind, price_min_cents, price_max_cents, ticket_url, ticket_url_status, venues(name, address, region_id, accessibility_notes)')
      .eq('event_id', e.id)
      .order('starts_at'),
    supabase.from('event_last_verified').select('last_verified_at').eq('event_id', e.id).maybeSingle(),
  ]);
  if (sessions.error) throw sessions.error;
  const now = new Date();
  const org = Array.isArray(e.organizations) ? e.organizations[0] : e.organizations;
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    description: e.description,
    categoryId: e.category_id,
    status: e.status,
    statusNote: e.status_note,
    ageRating: isAgeRating(e.age_rating) ? e.age_rating : null,
    ageRatingOfficial: e.age_rating_official,
    accessibilityNotes: e.accessibility_notes,
    organization: org ? { name: org.name, verified: org.verified } : null,
    lastVerifiedAt: verified.data?.last_verified_at ?? null,
    coverPath: e.cover_path,
    sessions: (sessions.data ?? [])
      .filter((s) => !sessionIsOver(s.starts_at, s.ends_at, s.time_confirmed, now))
      .flatMap((s) => {
        const v = Array.isArray(s.venues) ? s.venues[0] : s.venues;
        if (!v) return [];
        return [{
          id: s.id,
          startsAt: s.starts_at,
          endsAt: s.ends_at,
          timeConfirmed: s.time_confirmed,
          status: s.status,
          price: priceFromColumns(s.price_kind, s.price_min_cents, s.price_max_cents),
          // Link quebrado ou suspeito não vira botão (mesma regra da descoberta).
          ticketUrl: s.ticket_url_status === 'broken' || s.ticket_url_status === 'suspicious' ? null : s.ticket_url,
          venue: { name: v.name, address: v.address, regionId: v.region_id, accessibilityNotes: v.accessibility_notes },
        }];
      }),
  };
}

export function useEventDetail(slug: string | undefined) {
  const [state, setState] = useState<EventState>({ status: 'loading' });
  const load = useCallback(async () => {
    if (!slug) return { status: 'not-found' } as const;
    try {
      const event = await fetchEvent(slug);
      return event ? ({ status: 'ready', event } as const) : ({ status: 'not-found' } as const);
    } catch {
      return { status: 'error' } as const;
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    load().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, [load]);

  const retry = useCallback(async () => {
    setState({ status: 'loading' });
    setState(await load());
  }, [load]);

  return { state, retry };
}
