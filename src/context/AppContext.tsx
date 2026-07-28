import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AssistantState } from '@/types';

interface AppContextValue {
  assistantState: AssistantState;
  interim: string;
  streamingText: string;
  onMicClick: () => void;
  onQuickAction: (prompt: string) => void;
  onStopSpeaking: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext deve ser usado dentro de AppContext.Provider');
  return ctx;
}

export function AppContextProvider({
  children,
  assistantState,
  interim,
  streamingText,
  onMicClick,
  onQuickAction,
  onStopSpeaking,
}: AppContextValue & { children: ReactNode }) {
  const value = useMemo<AppContextValue>(
    () => ({ assistantState, interim, streamingText, onMicClick, onQuickAction, onStopSpeaking }),
    [assistantState, interim, streamingText, onMicClick, onQuickAction, onStopSpeaking]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
