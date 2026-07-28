import { motion } from 'framer-motion';
import { HelpCircle, Mic, Volume2, Sparkles, Zap, Shield, Smartphone, Brain } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { GlassCard } from '@/components/GlassCard';

export function HelpPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pb-28 pt-2 safe-top">
      <PageHeader
        title="Ajuda"
        subtitle="Como usar o J.A.R.V.I.S."
        icon={<HelpCircle size={18} />}
      />

      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="mt-0.5 shrink-0 text-hud-accent" />
          <div>
            <h2 className="text-base font-semibold text-hud-text">Bem-vindo, Senhor</h2>
            <p className="mt-1 text-sm leading-relaxed text-hud-text-dim">
              O J.A.R.V.I.S. é seu assistente pessoal de inteligência artificial, inspirado no
              assistente de Tony Stark. Ele conversa, responde perguntas, faz cálculos, gera ideias
              e lembra de suas preferências — tudo em português brasileiro.
            </p>
          </div>
        </div>
      </GlassCard>

      <HelpSection
        icon={<Mic size={18} />}
        title="Reconhecimento de Voz"
        items={[
          'Toque no botão de microfone para iniciar uma conversa por voz.',
          'Fale naturalmente — o assistente transcreve e responde.',
          'Ative o "Modo mãos livres" para conversas contínuas.',
          'Funciona melhor no Chrome, Edge e Safari (iOS 14.5+).',
        ]}
      />

      <HelpSection
        icon={<Zap size={18} />}
        title="Palavra-chave 'Jarvis'"
        items={[
          'Ative a palavra-chave nos Ajustes para detecção contínua.',
          'Diga "Jarvis" em voz alta quando o app estiver aberto.',
          'Após a detecção, o assistente inicia a gravação automaticamente.',
          'Ajuste a sensibilidade se houver detecções incorretas.',
        ]}
      />

      <HelpSection
        icon={<Volume2 size={18} />}
        title="Síntese de Voz"
        items={[
          'As respostas são faladas em português brasileiro.',
          'Escolha a voz e ajuste velocidade, tom e volume nos Ajustes.',
          'No iPhone, use fones ou aumente o volume do sistema.',
        ]}
      />

      <HelpSection
        icon={<Brain size={18} />}
        title="Memória e Contexto"
        items={[
          'O assistente mantém o contexto durante a conversa.',
          'Conversas anteriores ficam salvas no Histórico.',
          'Adicione memórias permanentes na aba Memória.',
          'Preferências são salvas automaticamente.',
        ]}
      />

      <HelpSection
        icon={<Smartphone size={18} />}
        title="Instalação no iPhone"
        items={[
          'Abra o app no Safari e toque no botão Compartilhar.',
          'Selecione "Adicionar à Tela de Início".',
          'Inicie pelo ícone para usar em tela cheia, como um app nativo.',
          'O app funciona offline após o primeiro carregamento.',
        ]}
      />

      <HelpSection
        icon={<Shield size={18} />}
        title="Privacidade"
        items={[
          'Sua voz é processada localmente pelo navegador.',
          'Conversas e preferências são armazenadas com segurança.',
          'Nenhum dado é compartilhado com terceiros.',
        ]}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="py-2 text-center text-xs text-hud-text-dim"
      >
        J.A.R.V.I.S. v1.0 — Feito com tecnologia de ponta
      </motion.div>
    </div>
  );
}

function HelpSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-4">
        <div className="mb-3 flex items-center gap-2 text-hud-primary-bright">
          {icon}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-hud-text/85">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-hud-primary" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
}
