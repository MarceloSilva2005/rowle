import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatPrice, type DiscoverySession } from '@rowle/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Salvos e preferências ficam só neste aparelho (sem conta, decisão D1). Guardamos
 * uma cópia do que aparece na lista, para mostrar o salvo mesmo se o evento sair da
 * descoberta (passou, foi cancelado).
 */
export interface SavedEvent {
  slug: string;
  title: string;
  categoryId: number;
  venueName: string;
  regionId: number;
  startsAt: string;
  endsAt: string | null;
  timeConfirmed: boolean;
  priceText: string;
  savedAt: string;
}

const SAVED_KEY = 'rowle:salvos:v1';
const REGION_KEY = 'rowle:regiao:v1';

export function snapshot(s: DiscoverySession): SavedEvent {
  return {
    slug: s.eventSlug,
    title: s.title,
    categoryId: s.categoryId,
    venueName: s.venueName,
    regionId: s.regionId,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    timeConfirmed: s.timeConfirmed,
    priceText: formatPrice(s.price),
    savedAt: new Date().toISOString(),
  };
}

interface SavedContextValue {
  saved: SavedEvent[];
  isSaved: (slug: string) => boolean;
  toggle: (event: SavedEvent) => void;
  preferredRegion: number | null;
  setPreferredRegion: (id: number | null) => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<SavedEvent[]>([]);
  const [preferredRegion, setRegion] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([read<SavedEvent[]>(SAVED_KEY, []), read<number | null>(REGION_KEY, null)]).then(([s, r]) => {
      if (!active) return;
      setSaved(Array.isArray(s) ? s : []);
      setRegion(typeof r === 'number' ? r : null);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback((event: SavedEvent) => {
    setSaved((list) => {
      const next = list.some((e) => e.slug === event.slug) ? list.filter((e) => e.slug !== event.slug) : [event, ...list];
      write(SAVED_KEY, next);
      return next;
    });
  }, []);

  const setPreferredRegion = useCallback((id: number | null) => {
    setRegion(id);
    write(REGION_KEY, id);
  }, []);

  const value = useMemo(
    () => ({ saved, isSaved: (slug: string) => saved.some((e) => e.slug === slug), toggle, preferredRegion, setPreferredRegion }),
    [saved, toggle, preferredRegion, setPreferredRegion],
  );
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved fora do SavedProvider');
  return ctx;
}
