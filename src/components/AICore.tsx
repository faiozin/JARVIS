import { memo } from 'react';
import { motion } from 'framer-motion';
import type { AssistantState } from '@/types';
import { cn } from '@/lib/utils';

interface AICoreProps {
  state: AssistantState;
  size?: number;
  animationsEnabled: boolean;
}

function AICoreImpl({ state, size = 280, animationsEnabled }: AICoreProps) {
  const colors = stateColors(state);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Estado do assistente: ${stateLabel(state)}`}
    >
      {/* Halo externo */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
        animate={animationsEnabled ? { scale: [1, 1.08, 1], opacity: [0.6, 0.9, 0.6] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Anéis rotativos */}
      {animationsEnabled && (
        <>
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: size * 0.92,
              height: size * 0.92,
              borderColor: colors.ring,
              borderStyle: 'dashed',
              borderWidth: 1,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute rounded-full border"
            style={{
              width: size * 0.78,
              height: size * 0.78,
              borderColor: colors.ring2,
              borderWidth: 1,
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          />
        </>
      )}

      {/* Núcleo */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: `radial-gradient(circle at 35% 35%, ${colors.bright} 0%, ${colors.primary} 40%, ${colors.dark} 100%)`,
          boxShadow: `0 0 40px ${colors.glow}, inset 0 0 30px ${colors.innerGlow}`,
        }}
        animate={animationsEnabled ? pulseAnimation(state) : {}}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Reflexo interno */}
        <div
          className="absolute rounded-full"
          style={{
            top: '18%',
            left: '22%',
            width: '30%',
            height: '24%',
            background: 'rgba(255,255,255,0.25)',
            filter: 'blur(8px)',
          }}
        />

        {/* Núcleo interno */}
        <motion.div
          className={cn('absolute rounded-full')}
          style={{
            top: '50%',
            left: '50%',
            width: size * 0.18,
            height: size * 0.18,
            transform: 'translate(-50%, -50%)',
            background: colors.core,
            boxShadow: `0 0 20px ${colors.bright}`,
          }}
          animate={animationsEnabled ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Segmentos orbitais */}
      {animationsEnabled &&
        Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              background: colors.bright,
              boxShadow: `0 0 8px ${colors.bright}`,
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            initial={{
              rotate: i * 60,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: size / 2 - 3,
                width: 6,
                height: 6,
              }}
            />
          </motion.div>
        ))}
    </div>
  );
}

interface StateColors {
  glow: string;
  ring: string;
  ring2: string;
  bright: string;
  primary: string;
  dark: string;
  innerGlow: string;
  core: string;
}

function stateColors(state: AssistantState): StateColors {
  switch (state) {
    case 'listening':
      return {
        glow: 'rgba(52, 211, 153, 0.5)',
        ring: 'rgba(52, 211, 153, 0.5)',
        ring2: 'rgba(52, 211, 153, 0.3)',
        bright: '#6ee7b7',
        primary: '#10b981',
        dark: '#064e3b',
        innerGlow: 'rgba(52, 211, 153, 0.4)',
        core: '#34d399',
      };
    case 'speaking':
      return {
        glow: 'rgba(34, 211, 238, 0.6)',
        ring: 'rgba(34, 211, 238, 0.5)',
        ring2: 'rgba(34, 211, 238, 0.3)',
        bright: '#67e8f9',
        primary: '#06b6d4',
        dark: '#083344',
        innerGlow: 'rgba(34, 211, 238, 0.5)',
        core: '#22d3ee',
      };
    case 'thinking':
      return {
        glow: 'rgba(251, 191, 36, 0.5)',
        ring: 'rgba(251, 191, 36, 0.5)',
        ring2: 'rgba(251, 191, 36, 0.3)',
        bright: '#fcd34d',
        primary: '#f59e0b',
        dark: '#451a03',
        innerGlow: 'rgba(251, 191, 36, 0.4)',
        core: '#fbbf24',
      };
    case 'wake-detected':
      return {
        glow: 'rgba(125, 211, 252, 0.7)',
        ring: 'rgba(125, 211, 252, 0.6)',
        ring2: 'rgba(125, 211, 252, 0.4)',
        bright: '#bae6fd',
        primary: '#0ea5e9',
        dark: '#0c4a6e',
        innerGlow: 'rgba(125, 211, 252, 0.6)',
        core: '#7dd3fc',
      };
    case 'error':
      return {
        glow: 'rgba(248, 113, 113, 0.5)',
        ring: 'rgba(248, 113, 113, 0.5)',
        ring2: 'rgba(248, 113, 113, 0.3)',
        bright: '#fca5a5',
        primary: '#ef4444',
        dark: '#450a0a',
        innerGlow: 'rgba(248, 113, 113, 0.4)',
        core: '#f87171',
      };
    default:
      return {
        glow: 'rgba(14, 165, 233, 0.35)',
        ring: 'rgba(56, 189, 248, 0.35)',
        ring2: 'rgba(56, 189, 248, 0.2)',
        bright: '#7dd3fc',
        primary: '#0ea5e9',
        dark: '#0a0e1a',
        innerGlow: 'rgba(14, 165, 233, 0.25)',
        core: '#38bdf8',
      };
  }
}

function pulseAnimation(state: AssistantState) {
  if (state === 'listening') return { scale: [1, 1.06, 1] };
  if (state === 'speaking') return { scale: [1, 1.04, 1.02, 1.06, 1] };
  if (state === 'thinking') return { scale: [1, 0.97, 1.03, 1] };
  if (state === 'wake-detected') return { scale: [1, 1.12, 1] };
  return { scale: [1, 1.02, 1] };
}

function stateLabel(state: AssistantState): string {
  const labels: Record<AssistantState, string> = {
    idle: 'inativo',
    listening: 'ouvindo',
    thinking: 'pensando',
    speaking: 'falando',
    'wake-detected': 'palavra-chave detectada',
    error: 'erro',
  };
  return labels[state];
}

export const AICore = memo(AICoreImpl);
