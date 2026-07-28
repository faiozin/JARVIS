import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, Trash2, KeyRound, Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { GlassCard } from '@/components/GlassCard';
import type { MemoryItem } from '@/types';
import { formatRelative } from '@/lib/utils';

interface MemoryPageProps {
  items: MemoryItem[];
  loading: boolean;
  onSet: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

export function MemoryPage({ items, loading, onSet, onRemove }: MemoryPageProps) {
  const [adding, setAdding] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleSave = () => {
    const k = key.trim();
    const v = value.trim();
    if (!k || !v) return;
    onSet(k, v);
    setKey('');
    setValue('');
    setAdding(false);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-28 pt-2 safe-top">
      <PageHeader
        title="Memória"
        subtitle="O que o J.A.R.V.I.S. lembra sobre você"
        icon={<Brain size={18} />}
        action={
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl glass text-hud-primary-bright hover:border-hud-border/40"
            aria-label="Adicionar memória"
          >
            <Plus size={18} />
          </button>
        }
      />

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="overflow-hidden p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-hud-primary-bright">
                  <KeyRound size={16} />
                  <span className="text-sm font-semibold">Nova memória</span>
                </div>
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Chave (ex: idioma_favorito)"
                  className="input"
                  aria-label="Chave da memória"
                />
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Valor (ex: Python)"
                  className="input"
                  aria-label="Valor da memória"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-hud-primary/25 py-2 text-sm font-medium text-hud-primary-bright hover:bg-hud-primary/35"
                  >
                    <Save size={15} /> Salvar
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="rounded-xl bg-hud-panel/40 px-4 text-sm text-hud-text-dim"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="py-12 text-center text-sm text-hud-text-dim">Carregando memória...</div>
      ) : items.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-2 py-10 text-center">
          <Brain size={32} className="text-hud-text-dim opacity-40" />
          <p className="text-sm text-hud-text-dim">Nenhuma memória armazenada.</p>
          <p className="max-w-xs text-xs text-hud-text-dim">
            Adicione lembretes, preferências e informações que o J.A.R.V.I.S. deve recordar.
          </p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard className="group flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hud-primary/15 text-hud-primary-bright">
                    <KeyRound size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-hud-text">{item.key}</p>
                    <p className="truncate text-sm text-hud-text-dim">{item.value}</p>
                    <p className="text-[10px] text-hud-text-dim/70">{formatRelative(item.updated_at)}</p>
                  </div>
                  <button
                    onClick={() => onRemove(item.key)}
                    className="text-hud-text-dim opacity-0 transition-opacity group-hover:opacity-100 hover:text-hud-error"
                    aria-label={`Remover ${item.key}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          background: rgba(15, 22, 38, 0.6);
          border: 1px solid rgba(56, 189, 248, 0.18);
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(var(--hud-text));
          outline: none;
        }
        .input:focus {
          border-color: rgba(56, 189, 248, 0.5);
        }
      `}</style>
    </div>
  );
}
