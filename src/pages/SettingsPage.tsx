import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Trash2, Volume2, Mic2, Brain, Eye, Zap } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { GlassCard } from '@/components/GlassCard';
import type { Personality, Preferences, Theme, VoiceOption } from '@/types';
import { cn } from '@/lib/utils';

interface SettingsPageProps {
  preferences: Preferences;
  voices: VoiceOption[];
  onUpdate: (patch: Partial<Preferences>) => void;
  onClearAll: () => void;
  onChangeName: (name: string) => void;
}

export function SettingsPage({
  preferences,
  voices,
  onUpdate,
  onClearAll,
  onChangeName,
}: SettingsPageProps) {
  const [nameInput, setNameInput] = useState(preferences.user_name ?? '');

  const ptVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-28 pt-2 safe-top">
      <PageHeader
        title="Ajustes"
        subtitle="Personalize seu assistente"
        icon={<SettingsIcon size={18} />}
      />

      <Section icon={<Mic2 size={16} />} title="Voz">
        <Field label="Nome do assistente">
          <input
            value={preferences.ai_name}
            onChange={(e) => onUpdate({ ai_name: e.target.value })}
            className="input"
            aria-label="Nome do assistente"
          />
        </Field>
        <Field label="Como devo te chamar">
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Seu nome"
              className="input flex-1"
              aria-label="Seu nome"
            />
            <button
              onClick={() => onChangeName(nameInput.trim() || '')}
              className="rounded-xl bg-hud-primary/25 px-4 text-sm font-medium text-hud-primary-bright hover:bg-hud-primary/35"
            >
              Salvar
            </button>
          </div>
        </Field>
        <Field label="Voz">
          <select
            value={preferences.voice_uri ?? ''}
            onChange={(e) => onUpdate({ voice_uri: e.target.value || null })}
            className="input"
            aria-label="Selecionar voz"
          >
            <option value="">Voz padrão (pt-BR)</option>
            {ptVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {ptVoices.length === 0 && (
            <p className="mt-1 text-xs text-hud-warning">
              Nenhuma voz em português encontrada no dispositivo.
            </p>
          )}
        </Field>
        <Slider
          label="Velocidade da fala"
          min={0.5}
          max={2}
          step={0.05}
          value={preferences.speech_rate}
          onChange={(v) => onUpdate({ speech_rate: v })}
          display={preferences.speech_rate.toFixed(2)}
        />
        <Slider
          label="Tom da voz"
          min={0.5}
          max={2}
          step={0.05}
          value={preferences.speech_pitch}
          onChange={(v) => onUpdate({ speech_pitch: v })}
          display={preferences.speech_pitch.toFixed(2)}
        />
        <Slider
          label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={preferences.volume}
          onChange={(v) => onUpdate({ volume: v })}
          display={`${Math.round(preferences.volume * 100)}%`}
        />
      </Section>

      <Section icon={<Zap size={16} />} title="Reconhecimento de Voz">
        <Toggle
          label="Palavra-chave 'Jarvis'"
          description="Detecte 'Jarvis' para ativar por voz"
          checked={preferences.wake_word_enabled}
          onChange={(v) => onUpdate({ wake_word_enabled: v })}
        />
        <Slider
          label="Sensibilidade da palavra-chave"
          min={0.2}
          max={1}
          step={0.05}
          value={preferences.wake_word_sensitivity}
          onChange={(v) => onUpdate({ wake_word_sensitivity: v })}
          display={preferences.wake_word_sensitivity.toFixed(2)}
        />
        <Toggle
          label="Modo mãos livres"
          description="Continue ouvindo após responder"
          checked={preferences.hands_free}
          onChange={(v) => onUpdate({ hands_free: v })}
        />
      </Section>

      <Section icon={<Brain size={16} />} title="Personalidade">
        <Field label="Estilo de personalidade">
          <div className="grid grid-cols-2 gap-2">
            {(['polite', 'friendly', 'formal', 'concise'] as Personality[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ personality: p })}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm capitalize transition-colors',
                  preferences.personality === p
                    ? 'border-hud-primary/50 bg-hud-primary/15 text-hud-primary-bright'
                    : 'border-hud-border/20 text-hud-text-dim hover:border-hud-border/40'
                )}
              >
                {personalityLabel(p)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Instruções personalizadas">
          <textarea
            value={preferences.custom_instructions ?? ''}
            onChange={(e) => onUpdate({ custom_instructions: e.target.value || null })}
            placeholder="Ex: Sempre inclua exemplos práticos nas respostas"
            rows={3}
            className="input resize-none"
            aria-label="Instruções personalizadas"
          />
        </Field>
      </Section>

      <Section icon={<Eye size={16} />} title="Aparência">
        <Field label="Tema">
          <div className="grid grid-cols-3 gap-2">
            {(['holographic', 'midnight', 'aurora'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ theme: t })}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm transition-colors',
                  preferences.theme === t
                    ? 'border-hud-primary/50 bg-hud-primary/15 text-hud-primary-bright'
                    : 'border-hud-border/20 text-hud-text-dim hover:border-hud-border/40'
                )}
              >
                {themeLabel(t)}
              </button>
            ))}
          </div>
        </Field>
        <Toggle
          label="Animações"
          description="Efeitos visuais e partículas"
          checked={preferences.animations_enabled}
          onChange={(v) => onUpdate({ animations_enabled: v })}
        />
        <Toggle
          label="Alto contraste"
          description="Melhor legibilidade"
          checked={preferences.high_contrast}
          onChange={(v) => onUpdate({ high_contrast: v })}
        />
      </Section>

      <Section icon={<Volume2 size={16} />} title="Dados">
        <button
          onClick={onClearAll}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-hud-error/30 bg-hud-error/10 px-4 py-3 text-sm font-medium text-hud-error hover:bg-hud-error/20"
        >
          <Trash2 size={16} />
          Apagar todas as conversas
        </button>
      </Section>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          background: rgba(15, 22, 38, 0.6);
          border: 1px solid rgba(56, 189, 248, 0.18);
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(var(--hud-text));
          outline: none;
        }
        .input:focus {
          border-color: rgba(56, 189, 248, 0.5);
        }
        .input option {
          background: rgb(15, 22, 38);
        }
      `}</style>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard className="p-4">
        <div className="mb-3 flex items-center gap-2 text-hud-primary-bright">
          {icon}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </GlassCard>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-hud-text-dim">{label}</span>
      {children}
    </label>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  display,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-hud-text-dim">{label}</span>
        <span className="text-xs tabular-nums text-hud-text">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="jarvis-range"
        aria-label={label}
      />
      <style>{`
        .jarvis-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.2);
          outline: none;
        }
        .jarvis-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgb(125, 211, 252);
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.6);
          cursor: pointer;
        }
        .jarvis-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 50%;
          background: rgb(125, 211, 252);
          box-shadow: 0 0 10px rgba(14, 165, 233, 0.6);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-hud-text">{label}</p>
        {description && <p className="text-xs text-hud-text-dim">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-hud-primary/60' : 'bg-hud-panel/60'
        )}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

function personalityLabel(p: Personality): string {
  return { polite: 'Educado', friendly: 'Amigável', formal: 'Formal', concise: 'Conciso' }[p];
}

function themeLabel(t: Theme): string {
  return { holographic: 'Holográfico', midnight: 'Meia-noite', aurora: 'Aurora' }[t];
}
