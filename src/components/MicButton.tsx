import { memo, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';
import type { AssistantState } from '@/types';
import { cn } from '@/lib/utils';

interface MicButtonProps {
  state: AssistantState;
  onClick: () => void;
  disabled?: boolean;
}

function MicButtonImpl({ state, onClick, disabled }: MicButtonProps) {
  const controls = useAnimationControls();
  const pressing = useRef(false);

  const listening = state === 'listening';
  const speaking = state === 'speaking';
  const busy = state === 'thinking' || state === 'wake-detected';

  const handlePress = () => {
    if (disabled) return;
    pressing.current = true;
    void controls.start({ scale: 0.92, transition: { duration: 0.1 } });
  };

  const handleRelease = () => {
    if (disabled) return;
    if (pressing.current) {
      pressing.current = false;
      void controls.start({ scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } });
      onClick();
    }
  };

  const ringColor = listening
    ? 'rgba(52, 211, 153, 0.6)'
    : speaking
    ? 'rgba(34, 211, 238, 0.6)'
    : busy
    ? 'rgba(251, 191, 36, 0.5)'
    : state === 'error'
    ? 'rgba(248, 113, 113, 0.5)'
    : 'rgba(56, 189, 248, 0.45)';

  return (
    <div className="relative flex items-center justify-center">
      {listening && (
        <>
          <motion.div
            className="absolute rounded-full border"
            style={{ width: 76, height: 76, borderColor: ringColor }}
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full border"
            style={{ width: 76, height: 76, borderColor: ringColor }}
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
          />
        </>
      )}

      <motion.button
        animate={controls}
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerLeave={() => {
          if (pressing.current) {
            pressing.current = false;
            void controls.start({ scale: 1 });
          }
        }}
        disabled={disabled}
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors',
          listening
            ? 'border-hud-success/60 bg-hud-success/15 text-hud-success'
            : speaking
            ? 'border-hud-accent/60 bg-hud-accent/15 text-hud-accent'
            : busy
            ? 'border-hud-warning/60 bg-hud-warning/15 text-hud-warning'
            : state === 'error'
            ? 'border-hud-error/60 bg-hud-error/15 text-hud-error'
            : 'border-hud-border/50 bg-hud-primary/15 text-hud-primary-bright',
          disabled && 'opacity-50'
        )}
        style={{ boxShadow: `0 0 24px ${ringColor}` }}
        aria-label={
          listening ? 'Parar de ouvir' : speaking ? 'Interromper fala' : 'Iniciar conversa por voz'
        }
        aria-pressed={listening}
      >
        {listening ? (
          <Square size={22} fill="currentColor" />
        ) : speaking ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </motion.button>
    </div>
  );
}

export const MicButton = memo(MicButtonImpl);
