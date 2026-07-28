import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_PREFERENCES, STORAGE_KEYS, type Preferences } from '@/types';
import { debounce } from '@/lib/utils';

const PREFERENCES_TABLE = 'preferences';
const SINGLE_ID = '00000000-0000-0000-0000-000000000001';

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipSaveRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from(PREFERENCES_TABLE)
      .select('*')
      .eq('id', SINGLE_ID)
      .maybeSingle();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (data) {
      const merged = { ...DEFAULT_PREFERENCES, ...data } as Preferences;
      setPreferences(merged);
      cacheLocal(merged);
    } else {
      const cached = readLocal();
      if (cached) {
        setPreferences(cached);
      }
      await createDefault();
    }
    setLoading(false);
  }, []);

  const createDefault = useCallback(async () => {
    const row = { id: SINGLE_ID, ...DEFAULT_PREFERENCES };
    const { error: insErr } = await supabase.from(PREFERENCES_TABLE).insert(row);
    if (insErr && insErr.code !== '23505') {
      setError(insErr.message);
    }
  }, []);

  const persist = useCallback(
    debounce(async (prefs: Preferences) => {
      const { error: upErr } = await supabase
        .from(PREFERENCES_TABLE)
        .upsert({ id: SINGLE_ID, ...prefs, updated_at: new Date().toISOString() });
      if (upErr) setError(upErr.message);
    }, 600),
    []
  );

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        cacheLocal(next);
        if (!skipSaveRef.current) persist(next);
        return next;
      });
    },
    [persist]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    skipSaveRef.current = false;
  }, []);

  return { preferences, update, loading, error, reload: load };
}

function readLocal(): Preferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.preferences);
    if (!raw) return null;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } as Preferences;
  } catch {
    return null;
  }
}

function cacheLocal(prefs: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(prefs));
  } catch {
    /* storage may be unavailable */
  }
}
