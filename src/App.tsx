import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { ParticleBackground } from '@/components/ParticleBackground';
import { ThemeBackground } from '@/components/ThemeBackground';
import { BottomNav } from '@/components/BottomNav';
import { FloatingNotification, useNotifications } from '@/components/FloatingNotification';
import { Onboarding } from '@/pages/Onboarding';
import { HomePage } from '@/pages/HomePage';
import { ChatPage } from '@/pages/ChatPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MemoryPage } from '@/pages/MemoryPage';
import { HelpPage } from '@/pages/HelpPage';

import { AppContextProvider } from '@/context/AppContext';
import { usePreferences } from '@/hooks/usePreferences';
import { useConversations } from '@/hooks/useConversations';
import { useMemory } from '@/hooks/useMemory';
import { useVoice } from '@/hooks/useVoice';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useTime } from '@/hooks/useTime';
import { sounds } from '@/lib/sounds';
import { STORAGE_KEYS } from '@/types';
import type { AssistantState } from '@/types';

export default function App() {
  const { preferences, update, loading } = usePreferences();
  const conversations = useConversations();
  const memory = useMemory();
  const { notifications, notify, dismiss } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const { time } = useTime(30000);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEYS.onboardingDone);
    if (!done) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    document.documentElement.classList.toggle('high-contrast', preferences.high_contrast);
    sounds.setVolume(preferences.volume);
  }, [preferences.high_contrast, preferences.volume, loading]);

  const handleAssistantMessage = useCallback(
    (content: string) => {
      void conversations.addMessage('assistant', content);
    },
    [conversations]
  );

  const handleUserMessage = useCallback(
    (content: string) => {
      void conversations.addMessage('user', content);
    },
    [conversations]
  );

  const voice = useVoice({
    preferences,
    history: conversations.messages,
    memory: memory.memory,
    onAssistantMessage: handleAssistantMessage,
    onUserMessage: handleUserMessage,
    onStateChange: (state: AssistantState) => {
      if (state === 'error') {
        notify('error', 'Erro no reconhecimento de voz. Verifique as permissões do microfone.');
      }
    },
    onError: (message: string) => {
      notify('error', message);
    },
  });
  const {
    state: voiceState,
    interim: voiceInterim,
    streamingText: voiceStreamingText,
    voices: voiceVoices,
    supported: voiceSupported,
    mode: voiceMode,
    startListening,
    stopListening,
    stopSpeaking: stopSpeakingVoice,
    respond: respondVoice,
  } = voice;

  // Unlock audio context on first user gesture (Safari autoplay policy).
  useEffect(() => {
    const unlock = () => sounds.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    setWakeWordActive(
      preferences.wake_word_enabled && voiceSupported.wakeWord
    );
  }, [preferences.wake_word_enabled, voiceSupported.wakeWord]);

  useWakeLock(preferences.hands_free);

  useEffect(() => {
    if (!loading && voiceMode === 'unsupported') {
      notify('info', 'Seu navegador não suporta reconhecimento de voz. Use o modo texto para conversar.');
    }
  }, [loading, voiceMode, notify]);

  const onMicClick = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'speaking') {
      stopSpeakingVoice();
    } else {
      const ok = startListening();
      if (!ok) {
        notify('error', 'Não foi possível iniciar o microfone. Verifique as permissões.');
      }
    }
  }, [voiceState, stopListening, stopSpeakingVoice, startListening, notify]);

  const onQuickAction = useCallback(
    (prompt: string) => {
      navigate('/chat');
      void respondVoice(prompt);
    },
    [respondVoice, navigate]
  );

  const onStopSpeaking = useCallback(() => {
    stopSpeakingVoice();
  }, [stopSpeakingVoice]);

  const onSend = useCallback(
    (text: string) => {
      void respondVoice(text);
    },
    [respondVoice]
  );

  const onCompleteOnboarding = useCallback(
    (name: string) => {
      localStorage.setItem(STORAGE_KEYS.onboardingDone, '1');
      update({ user_name: name || null });
      setShowOnboarding(false);
      sounds.play('startup');
    },
    [update]
  );

  const onChangeName = useCallback(
    (name: string) => {
      update({ user_name: name || null });
      memory.set('user_name', name);
      notify('success', name ? `Pronto, ${name}. Lembrei do seu nome.` : 'Nome removido.');
    },
    [update, memory, notify]
  );

  const onClearAll = useCallback(() => {
    void conversations.clearAll().then(() => notify('success', 'Todas as conversas foram apagadas.'));
  }, [conversations, notify]);

  const ctxValue = useMemo(
    () => ({
      assistantState: voiceState,
      interim: voiceInterim,
      streamingText: voiceStreamingText,
      onMicClick,
      onQuickAction,
      onStopSpeaking,
    }),
    [voiceState, voiceInterim, voiceStreamingText, onMicClick, onQuickAction, onStopSpeaking]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-hud-border/30 border-t-hud-primary-bright" />
          <p className="text-sm text-hud-text-dim">Inicializando J.A.R.V.I.S....</p>
        </div>
      </div>
    );
  }

  return (
    <AppContextProvider {...ctxValue}>
      <ThemeBackground theme={preferences.theme} />
      <ParticleBackground enabled={preferences.animations_enabled} />

      <div className="relative mx-auto h-full max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <Routes location={location}>
              <Route
                path="/"
                element={
                  <HomePage
                    preferences={preferences}
                    wakeWordActive={wakeWordActive}
                  />
                }
              />
              <Route
                path="/chat"
                element={
                  <ChatPage
                    preferences={preferences}
                    conversations={conversations.conversations}
                    currentId={conversations.currentId}
                    messages={conversations.messages}
                    onSend={onSend}
                    onCreateConversation={() => void conversations.createConversation()}
                    onSelectConversation={conversations.setCurrentId}
                    onDeleteConversation={(id) => void conversations.deleteConversation(id)}
                  />
                }
              />
              <Route
                path="/memory"
                element={
                  <MemoryPage
                    items={memory.items}
                    loading={memory.loading}
                    onSet={(k, v) => void memory.set(k, v)}
                    onRemove={(k) => void memory.remove(k)}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    preferences={preferences}
                    voices={voiceVoices}
                    onUpdate={update}
                    onClearAll={onClearAll}
                    onChangeName={onChangeName}
                  />
                }
              />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />

      <FloatingNotification notifications={notifications} onDismiss={dismiss} />

      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={onCompleteOnboarding} />}
      </AnimatePresence>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {time.toLocaleTimeString('pt-BR')}
      </span>
    </AppContextProvider>
  );
}
