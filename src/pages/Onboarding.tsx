import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Mic, Brain, Sparkles, Zap } from 'lucide-react';
import { AICore } from '@/components/AICore';
import { GlassCard } from '@/components/GlassCard';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const STEPS = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao J.A.R.V.I.S.',
    text: 'Seu assistente de IA pessoal, inspirado em Iron Man. Interface holográfica, voz em português e muito mais.',
  },
  {
    icon: Mic,
    title: 'Converse por Voz',
    text: 'Toque no microfone e fale naturalmente. Ative a palavra-chave "Jarvis" para ativar por voz a qualquer momento.',
  },
  {
    icon: Zap,
    title: 'Palavra-chave Inteligente',
    text: 'Diga "Jarvis" quando o app estiver aberto e o assistente começará a ouvir automaticamente.',
  },
  {
    icon: Brain,
    title: 'Memória Persistente',
    text: 'O J.A.R.V.I.S. lembra de suas preferências, conversas e informações importantes entre sessões.',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const isLast = step === STEPS.length;

  const next = () => {
    if (isLast) {
      onComplete(name.trim());
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-hud-bg/90 p-6 backdrop-blur-xl">
      <AnimatePresence mode="wait">
        {!isLast ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex w-full max-w-md flex-col items-center gap-6 text-center"
          >
            <AICore state="idle" size={180} animationsEnabled />
            <div className="flex flex-col items-center gap-3">
              {(() => {
                const Icon = STEPS[step].icon;
                return (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hud-primary/15 text-hud-primary-bright">
                    <Icon size={24} />
                  </div>
                );
              })()}
              <h2 className="text-xl font-bold text-hud-text">{STEPS[step].title}</h2>
              <p className="max-w-xs text-sm leading-relaxed text-hud-text-dim">
                {STEPS[step].text}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-6 bg-hud-primary-bright' : 'w-1.5 bg-hud-border/30'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-full bg-hud-primary/25 px-6 py-3 text-sm font-medium text-hud-primary-bright transition-colors hover:bg-hud-primary/35"
            >
              {step === STEPS.length - 1 ? 'Começar' : 'Avançar'}
              <ArrowRight size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="name"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-md flex-col items-center gap-6 text-center"
          >
            <AICore state="wake-detected" size={160} animationsEnabled />
            <GlassCard className="w-full p-5">
              <h2 className="text-lg font-bold text-hud-text">Como devo te chamar?</h2>
              <p className="mt-1 text-sm text-hud-text-dim">
                O J.A.R.V.I.S. pode te chamar pelo seu nome ou por "Senhor".
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome (opcional)"
                className="mt-4 w-full rounded-xl border border-hud-border/20 bg-hud-bg/60 px-4 py-3 text-center text-base text-hud-text outline-none placeholder:text-hud-text-dim focus:border-hud-border/50"
                aria-label="Seu nome"
              />
              <button
                onClick={next}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-hud-primary/25 py-3 text-sm font-medium text-hud-primary-bright hover:bg-hud-primary/35"
              >
                <Check size={16} /> Concluir
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
