import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Calendar, CloudSun, Smile, Lightbulb, HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { QUICK_ACTIONS } from '@/types';

const ICONS: Record<string, LucideIcon> = {
  Clock, Calendar, CloudSun, Smile, Lightbulb, HelpCircle,
};

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
}

function QuickActionsImpl({ onSelect }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((action, i) => {
        const Icon = ICONS[action.icon] ?? HelpCircle;
        return (
          <motion.button
            key={action.id}
            onClick={() => onSelect(action.prompt)}
            className="glass flex items-center gap-2 rounded-full px-3.5 py-2 text-sm text-hud-text/90 transition-colors hover:text-hud-primary-bright hover:border-hud-border/40"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            aria-label={action.label}
          >
            <Icon size={15} className="text-hud-primary" />
            <span>{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export const QuickActions = memo(QuickActionsImpl);
