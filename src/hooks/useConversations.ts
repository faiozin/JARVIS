import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';
import { STORAGE_KEYS } from '@/types';
import { uid } from '@/lib/utils';

const CONV_TABLE = 'conversations';
const MSG_TABLE = 'messages';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(CONV_TABLE)
        .select('*')
        .order('updated_at', { ascending: false });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const list = (data as Conversation[]) ?? [];
      setConversations(list);
      const stored = localStorage.getItem(STORAGE_KEYS.currentConversation);
      const resume = list.find((c) => c.id === stored);
      if (resume) setCurrentId(resume.id);
      else if (list.length > 0) setCurrentId(list[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!currentId) {
      setMessages([]);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.currentConversation, currentId);
    void (async () => {
      const { data, error: err } = await supabase
        .from(MSG_TABLE)
        .select('*')
        .eq('conversation_id', currentId)
        .order('created_at', { ascending: true });
      if (err) {
        setError(err.message);
        return;
      }
      setMessages((data as Message[]) ?? []);
    })();
  }, [currentId]);

  const createConversation = useCallback(async (title = 'Nova Conversa'): Promise<string> => {
    const id = uid();
    const now = new Date().toISOString();
    const row = { id, title, created_at: now, updated_at: now };
    const { error: insErr } = await supabase.from(CONV_TABLE).insert(row);
    if (insErr) {
      setError(insErr.message);
      return currentId ?? id;
    }
    setConversations((prev) => [{ ...row } as Conversation, ...prev]);
    setCurrentId(id);
    return id;
  }, [currentId]);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (currentId) return currentId;
    return createConversation();
  }, [currentId, createConversation]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    const { error: upErr } = await supabase
      .from(CONV_TABLE)
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const addMessage = useCallback(
    async (role: Message['role'], content: string): Promise<Message | null> => {
      const convId = await ensureConversation();
      if (!convId) return null;
      const id = uid();
      const now = new Date().toISOString();
      const row: Message = {
        id,
        conversation_id: convId,
        role,
        content,
        created_at: now,
      };
      setMessages((prev) => {
        const next = [...prev, row];
        messagesRef.current = next;
        return next;
      });
      const { error: insErr } = await supabase.from(MSG_TABLE).insert({
        id,
        conversation_id: convId,
        role,
        content,
        created_at: now,
      });
      if (insErr) {
        setError(insErr.message);
        return row;
      }
      const { error: upErr } = await supabase
        .from(CONV_TABLE)
        .update({ updated_at: now })
        .eq('id', convId);
      if (upErr) setError(upErr.message);

      // Title the conversation from the first user message.
      if (role === 'user') {
        const isFirst = messagesRef.current.filter((m) => m.role === 'user').length === 1;
        if (isFirst) {
          const title = content.length > 40 ? content.slice(0, 40) + '...' : content;
          void renameConversation(convId, title);
        }
      }
      return row;
    },
    [ensureConversation, renameConversation]
  );

  const deleteConversation = useCallback(async (id: string) => {
    const { error: delErr } = await supabase.from(CONV_TABLE).delete().eq('id', id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentId === id) setCurrentId(null);
  }, [currentId]);

  const clearAll = useCallback(async () => {
    const { error: delErr } = await supabase.from(CONV_TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setConversations([]);
    setMessages([]);
    setCurrentId(null);
  }, []);

  return {
    conversations,
    currentId,
    messages,
    loading,
    error,
    setCurrentId,
    createConversation,
    ensureConversation,
    addMessage,
    deleteConversation,
    renameConversation,
    clearAll,
  };
}
