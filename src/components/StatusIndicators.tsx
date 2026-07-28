import { memo } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Battery, BatteryCharging, Signal } from 'lucide-react';
import type { AssistantState } from '@/types';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatusIndicatorsProps {
  online: boolean;
  batteryLevel: number;
  batteryCharging: boolean;
  batterySupported: boolean;
  assistantState: AssistantState;
  wakeWordActive: boolean;
  time: Date;
}

function StatusIndicatorsImpl({
  online,
  batteryLevel,
  batteryCharging,
  batterySupported,
  assistantState,
  wakeWordActive,
  time,
}: StatusIndicatorsProps) {
  const stateInfo = stateInfoMap[assistantState];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill
        label={stateInfo.label}
        color={stateInfo.color}
        pulsing={assistantState !== 'idle'}
      />
      <Pill
        label={online ? 'Online' : 'Offline'}
        color={online ? 'success' : 'error'}
        icon={online ? <Wifi size={12} /> : <WifiOff size={12} />}
      />
      {batterySupported && (
        <Pill
          label={`${Math.round(batteryLevel * 100)}%`}
          color={batteryLevel <= 0.2 ? 'warning' : 'neutral'}
          icon={
            batteryCharging ? (
              <BatteryCharging size={12} />
            ) : (
              <Battery size={12} />
            )
          }
        />
      )}
      {wakeWordActive && (
        <Pill label="Jarvis" color="accent" icon={<Signal size={12} />} pulsing />
      )}
      <Pill label={formatTime(time)} color="neutral" />
    </div>
  );
}

type PillColor = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';

const pillColorMap: Record<PillColor, string> = {
  primary: 'text-hud-primary-bright',
  accent: 'text-hud-accent',
  success: 'text-hud-success',
  warning: 'text-hud-warning',
  error: 'text-hud-error',
  neutral: 'text-hud-text-dim',
};

function Pill({
  label,
  color,
  icon,
  pulsing,
}: {
  label: string;
  color: PillColor;
  icon?: React.ReactNode;
  pulsing?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border border-hud-border/20 bg-hud-panel/40 px-2.5 py-1 text-[11px] font-medium backdrop-blur',
        pillColorMap[color]
      )}
    >
      {icon}
      <span className="tabular-nums">{label}</span>
      {pulsing && (
        <motion.span
          className={cn('h-1.5 w-1.5 rounded-full bg-current')}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </div>
  );
}

const stateInfoMap: Record<AssistantState, { label: string; color: PillColor }> = {
  idle: { label: 'Pronto', color: 'neutral' },
  listening: { label: 'Ouvindo', color: 'success' },
  thinking: { label: 'Processando', color: 'warning' },
  speaking: { label: 'Falando', color: 'accent' },
  'wake-detected': { label: 'Detectado', color: 'primary' },
  error: { label: 'Erro', color: 'error' },
};

export const StatusIndicators = memo(StatusIndicatorsImpl);
