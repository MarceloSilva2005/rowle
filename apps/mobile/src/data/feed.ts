import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { buildFeedSections, readDiscoveryRow, type DiscoverySession, type FeedSection } from '@rowle/core';
import { supabase } from '../supabase';

export interface Lookups {
  regions: Map<number, string>;
  categories: Map<number, string>;
}

export type FeedState =
  | { status: 'loading' }
  | { status: 'offline' }
  | { status: 'error' }
  | { status: 'ready'; sections: FeedSection[]; lookups: Lookups; loadedAt: Date };

const MAX_SESSIONS = 300;

async function fetchFeed(): Promise<{ sessions: DiscoverySession[]; lookups: Lookups }> {
  const [sessions, regions, categories] = await Promise.all([
    supabase.from('discoverable_sessions').select('*').order('starts_at').limit(MAX_SESSIONS),
    supabase.from('regions').select('id, name'),
    supabase.from('categories').select('id, name'),
  ]);
  const error = sessions.error ?? regions.error ?? categories.error;
  if (error) throw error;
  return {
    sessions: (sessions.data ?? []).flatMap((row) => readDiscoveryRow(row) ?? []),
    lookups: {
      regions: new Map((regions.data ?? []).map((r) => [r.id, r.name])),
      categories: new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    },
  };
}

async function resolveFeed(): Promise<FeedState> {
  const before = await NetInfo.fetch();
  if (before.isConnected === false) return { status: 'offline' };
  try {
    const { sessions, lookups } = await fetchFeed();
    const now = new Date();
    return { status: 'ready', sections: buildFeedSections(sessions, now), lookups, loadedAt: now };
  } catch {
    const net = await NetInfo.fetch();
    return net.isConnected === false ? { status: 'offline' } : { status: 'error' };
  }
}

/** Feed da tela Descobrir. `refresh` mantém o que já está na tela enquanto recarrega. */
export function useFeed() {
  const [state, setState] = useState<FeedState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    resolveFeed().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setState(await resolveFeed());
    setRefreshing(false);
  }, []);

  const retry = useCallback(async () => {
    setState({ status: 'loading' });
    setState(await resolveFeed());
  }, []);

  return { state, refreshing, refresh, retry };
}
