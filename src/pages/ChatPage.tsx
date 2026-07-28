import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Plus, Menu, X, Mic, Cpu } from 'lucide-react';
import { MessageBubble } from '@/components/MessageBubble';
import { ConversationTimeline } from '@/components/ConversationTimeline';
import { MicButton } from '@/components/MicButton';
import { PageHeader } from '@/components/PageHeader';
import { useAppContext } from '@/context/AppContext';
import type { Conversation, Message, Preferences } from '@/types';
import { cn } from '@/lib/utils';

interface ChatPageProps {
  preferences: Preferences;
  conversations: Conversation[];
  currentId: string | null;
  messages: Message[];
  onSend: (text: string) => void;
  onCreateConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatPage({
  preferences,
  conversations,
  currentId,
  messages,
  onSend,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation,
}: ChatPageProps) {
  const { assistantState, interim, streamingText, onMicClick } = useAppContext();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length, interim, streamingText]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const speakingId =
    assistantState === 'speaking' && messages.length > 0
      ? messages[messages.length - 1].id
      : null;

  return (
    <div className="flex h-full flex-col pb-20 pt-2 safe-top">
      <div className="px-4">
        <PageHeader
          title="Conversa"
          subtitle={currentConversationTitle(conversations, currentId)}
          icon={<Mic size={18} />}
          action={
            <div className="flex gap-2">
              <button
                onClick={onCreateConversation}
                className="flex h-10 w-10 items-center justify-center rounded-xl glass text-hud-primary-bright hover:border-hud-border/40"
                aria-label="Nova conversa"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl glass text-hud-text-dim hover:border-hud-border/40"
                aria-label="Abrir histórico"
              >
                <Menu size={18} />
              </button>
            </div>
          }
        />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  aiName={preferences.ai_name}
                  userName={preferences.user_name ?? ''}
                  speaking={speakingId === msg.id}
                />
              ))}
            </AnimatePresence>
            {interim && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hud-primary/20 text-hud-primary-bright">
                  <Mic size={16} />
                </div>
                <div className="glass max-w-[78%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm italic text-hud-text-dim">
                  {interim}
                </div>
              </div>
            )}
            {streamingText && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hud-accent/20 text-hud-accent">
                  <Cpu size={16} />
                </div>
                <div className="glass max-w-[78%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-hud-text">
                  {streamingText}
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-hud-accent align-middle" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-2">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl glass-strong px-3 py-2 glow-border">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="max-h-[120px] flex-1 resize-none bg-transparent py-2 text-sm text-hud-text placeholder:text-hud-text-dim focus:outline-none scrollbar-thin"
            aria-label="Campo de mensagem"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
              input.trim()
                ? 'bg-hud-primary/25 text-hud-primary-bright hover:bg-hud-primary/35'
                : 'bg-hud-panel/40 text-hud-text-dim'
            )}
            aria-label="Enviar mensagem"
          >
            <Send size={16} />
          </button>
          <MicButton state={assistantState} onClick={onMicClick} />
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-hud-bg/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed bottom-0 left-0 top-0 z-50 w-80 max-w-[85vw] glass-strong p-4 pt-6 safe-top safe-x"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-hud-text">Histórico</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-hud-text-dim hover:text-hud-text"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <ConversationTimeline
                conversations={conversations}
                currentId={currentId}
                onSelect={(id) => {
                  onSelectConversation(id);
                  setSidebarOpen(false);
                }}
                onDelete={onDeleteConversation}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hud-primary/15 text-hud-primary-bright">
        <Mic size={26} />
      </div>
      <p className="text-base font-medium text-hud-text">Inicie uma conversa</p>
      <p className="max-w-xs text-sm text-hud-text-dim">
        Toque no microfone para falar ou digite sua mensagem. Diga "Jarvis" para ativar por voz.
      </p>
    </div>
  );
}

function currentConversationTitle(conversations: Conversation[], currentId: string | null): string {
  if (!currentId) return 'Nenhuma conversa selecionada';
  return conversations.find((c) => c.id === currentId)?.title ?? 'Conversa';
}
