import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Settings as SettingsIcon, Radar as RadarIcon, Sparkles } from 'lucide-react';
import type { AssistantState } from '@/types';
import { AICore } from '@/components/AICore';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { Radar } from '@/components/Radar';
import { StatusIndicators } from '@/components/StatusIndicators';
import { QuickActions } from '@/components/QuickActions';
import { MicButton } from '@/components/MicButton';
import { useAppContext } from '@/context/AppContext';
import { useTime } from '@/hooks/useTime';
import { useBattery } from '@/hooks/useBattery';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatDate } from '@/lib/utils';
import type { Preferences } from '@/types';

interface HomePageProps {
  preferences: Preferences;
  wakeWordActive: boolean;
}

export function HomePage({ preferences, wakeWordActive }: HomePageProps) {
  const { assistantState, interim, streamingText, onMicClick, onQuickAction } = useAppContext();
  const { time } = useTime(1000);
  const battery = useBattery();
  const online = useOnlineStatus();
  const navigate = useNavigate();

  const greeting = greetingForHour(time.getHours(), preferences.user_name);

  return (
    <div className="flex flex-col items-center gap-6 pb-28 pt-6 safe-top">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-4"
      >
        <StatusIndicators
          online={online}
          batteryLevel={battery.level}
          batteryCharging={battery.charging}
          batterySupported={battery.supported}
          assistantState={assistantState}
          wakeWordActive={wakeWordActive}
          time={time}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="flex flex-col items-center gap-2 px-4 text-center"
      >
        <p className="text-sm font-medium tracking-wide text-hud-primary-bright hud-text-glow">
          {greeting}
        </p>
        <h1 className="text-5xl font-bold tabular-nums text-hud-text glow-text sm:text-6xl">
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </h1>
        <p className="text-sm capitalize text-hud-text-dim">{formatDate(time)}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        className="relative"
      >
        <AICore state={assistantState} size={260} animationsEnabled={preferences.animations_enabled} />

        {assistantState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
          >
            <span className="text-sm font-medium text-hud-text-dim">
              {interim || streamingText || stateHint(assistantState)}
            </span>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="h-12 w-full max-w-sm"
      >
        <VoiceVisualizer state={assistantState} active={assistantState !== 'idle'} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
      >
        <MicButton state={assistantState} onClick={onMicClick} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-md px-4"
      >
        <QuickActions onSelect={onQuickAction} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="grid w-full max-w-md grid-cols-3 gap-3 px-4"
      >
        <NavCard
          icon={<MessageSquare size={20} />}
          label="Conversa"
          onClick={() => navigate('/chat')}
        />
        <NavCard
          icon={<RadarIcon size={20} />}
          label="Status"
          onClick={() => navigate('/memory')}
        />
        <NavCard
          icon={<SettingsIcon size={20} />}
          label="Ajustes"
          onClick={() => navigate('/settings')}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="mt-2 flex items-center gap-3"
      >
        <div className="flex items-center gap-2 rounded-xl glass px-3 py-2">
          <Radar size={56} />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-hud-text-dim">Sistemas</span>
            <span className="text-xs font-medium text-hud-success">Operacional</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl glass px-3 py-2">
          <Sparkles size={18} className="text-hud-accent" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-hud-text-dim">IA</span>
            <span className="text-xs font-medium text-hud-accent">Online</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function NavCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="glass flex flex-col items-center gap-1.5 rounded-2xl py-3 text-hud-text/90 hover:border-hud-border/40"
    >
      <span className="text-hud-primary-bright">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </motion.button>
  );
}

function greetingForHour(hour: number, name: string | null): string {
  let period = 'Boa noite';
  if (hour < 12) period = 'Bom dia';
  else if (hour < 18) period = 'Boa tarde';
  return name ? `${period}, ${name}` : period;
}

function stateHint(state: AssistantState): string {
  const hints: Record<AssistantState, string> = {
    idle: 'Toque no microfone para falar',
    listening: 'Estou ouvindo...',
    thinking: 'Processando...',
    speaking: 'Respondendo...',
    'wake-detected': 'Palavra-chave detectada!',
    error: 'Algo deu errado',
  };
  return hints[state];
}
