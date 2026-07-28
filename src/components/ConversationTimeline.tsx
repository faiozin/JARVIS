import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Conversation } from '@/types';
import { formatRelative } from '@/lib/utils';

interface ConversationTimelineProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function ConversationTimelineImpl({
  conversations,
  currentId,
  onSelect,
  onDelete,
}: ConversationTimelineProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-hud-text-dim">
        <MessageCircle size={28} className="opacity-40" />
        <p>Nenhuma conversa ainda.</p>
        <p className="text-xs">Inicie uma conversa para vê-la aqui.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      <AnimatePresence initial={false}>
        {conversations.map((conv) => {
          const active = conv.id === currentId;
          return (
            <motion.li
              key={conv.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-hud-border/50 bg-hud-primary/10'
                    : 'border-transparent hover:border-hud-border/20 hover:bg-hud-panel/40'
                }`}
                onClick={() => onSelect(conv.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(conv.id);
                  }
                }}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    active ? 'bg-hud-primary/20 text-hud-primary-bright' : 'bg-hud-panel/50 text-hud-text-dim'
                  }`}
                >
                  <MessageCircle size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${active ? 'text-hud-text' : 'text-hud-text/80'}`}>
                    {conv.title}
                  </p>
                  <p className="truncate text-xs text-hud-text-dim">
                    {formatRelative(conv.updated_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-hud-text-dim hover:text-hud-error"
                  aria-label="Excluir conversa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

export const ConversationTimeline = memo(ConversationTimelineImpl);
