import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MemoryItem } from '@/types';

const TABLE = 'memory';

export function useMemory() {
  const [memory, setMemory] = useState<Record<string, string>>({});
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from(TABLE).select('*');
      if (error) {
        setLoading(false);
        return;
      }
      const list = (data as MemoryItem[]) ?? [];
      setItems(list);
      const map: Record<string, string> = {};
      list.forEach((m) => (map[m.key] = m.value));
      setMemory(map);
      setLoading(false);
    })();
  }, []);

  const set = useCallback(async (key: string, value: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(TABLE)
      .upsert({ key, value, updated_at: now });
    if (error) return;
    setMemory((prev) => ({ ...prev, [key]: value }));
    setItems((prev) => {
      const exists = prev.find((m) => m.key === key);
      if (exists) return prev.map((m) => (m.key === key ? { ...m, value, updated_at: now } : m));
      return [{ id: uid(), key, value, updated_at: now }, ...prev];
    });
  }, []);

  const remove = useCallback(async (key: string) => {
    const { error } = await supabase.from(TABLE).delete().eq('key', key);
    if (error) return;
    setMemory((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setItems((prev) => prev.filter((m) => m.key !== key));
  }, []);

  return { memory, items, loading, set, remove };
}

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}`;
}
