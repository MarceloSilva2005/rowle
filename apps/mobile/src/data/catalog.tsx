import NetInfo from '@react-native-community/netinfo';
import { NO_FILTERS, brasiliaDay, readDiscoveryRow, type DiscoveryFilters, type DiscoveryNames, type DiscoverySession } from '@rowle/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../supabase';

export interface Catalog extends DiscoveryNames {
  sessions: DiscoverySession[];
  /** Slug da categoria por id (para as capas geradas). */
  categorySlugs: ReadonlyMap<number, string>;
  loadedAt: Date;
}

export type CatalogState =
  | { status: 'loading' }
  | { status: 'offline' }
  | { status: 'error' }
  | { status: 'ready'; catalog: Catalog };

const MAX_SESSIONS = 500;

async function fetchCatalog(): Promise<Catalog> {
  const [sessions, regions, categories] = await Promise.all([
    supabase.from('discoverable_sessions').select('*').order('starts_at').limit(MAX_SESSIONS),
    supabase.from('regions').select('id, name'),
    supabase.from('categories').select('id, slug, name').order('sort_order'),
  ]);
  const error = sessions.error ?? regions.error ?? categories.error;
  if (error) throw error;
  return {
    sessions: (sessions.data ?? []).flatMap((row) => readDiscoveryRow(row) ?? []),
    regions: new Map((regions.data ?? []).map((r) => [r.id, r.name])),
    categories: new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    categorySlugs: new Map((categories.data ?? []).map((c) => [c.id, c.slug])),
    loadedAt: new Date(),
  };
}

async function resolveCatalog(): Promise<CatalogState> {
  const before = await NetInfo.fetch();
  if (before.isConnected === false) return { status: 'offline' };
  try {
    return { status: 'ready', catalog: await fetchCatalog() };
  } catch {
    const net = await NetInfo.fetch();
    return net.isConnected === false ? { status: 'offline' } : { status: 'error' };
  }
}

interface CatalogContextValue {
  state: CatalogState;
  refreshing: boolean;
  /** Recarrega mantendo o que está na tela. */
  refresh: () => Promise<void>;
  /** Volta para "carregando" e tenta de novo (depois de erro ou sem rede). */
  retry: () => Promise<void>;
  filters: DiscoveryFilters;
  setFilters: (f: DiscoveryFilters) => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

/** Catálogo público carregado uma vez e compartilhado pelas abas, com os filtros. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<DiscoveryFilters>(NO_FILTERS);
  const [dayChosen, setDayChosen] = useState(false);

  useEffect(() => {
    let active = true;
    resolveCatalog().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  // Até a pessoa escolher um dia: "Hoje" quando há rolê hoje; senão, todos os próximos.
  const ready = state.status === 'ready' ? state.catalog : null;
  const effective = useMemo(() => {
    if (dayChosen || !ready) return filters;
    const today = brasiliaDay(ready.loadedAt);
    const hasToday = ready.sessions.some((s) => brasiliaDay(s.startsAt) <= today);
    return { ...filters, day: hasToday ? today : null };
  }, [filters, dayChosen, ready]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setState(await resolveCatalog());
    setRefreshing(false);
  }, []);

  const retry = useCallback(async () => {
    setState({ status: 'loading' });
    setState(await resolveCatalog());
  }, []);

  const choose = useCallback((f: DiscoveryFilters) => {
    setDayChosen(true);
    setFilters(f);
  }, []);

  const value = useMemo(() => ({ state, refreshing, refresh, retry, filters: effective, setFilters: choose }), [state, refreshing, refresh, retry, effective, choose]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog fora do CatalogProvider');
  return ctx;
}
