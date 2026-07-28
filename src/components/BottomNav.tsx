import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Settings, Brain, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/chat', label: 'Conversa', icon: MessageSquare },
  { to: '/memory', label: 'Memória', icon: Brain },
  { to: '/settings', label: 'Ajustes', icon: Settings },
  { to: '/help', label: 'Ajuda', icon: HelpCircle },
];

function BottomNavImpl() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom safe-x"
      aria-label="Navegação principal"
    >
      <div className="mx-3 mb-3 flex max-w-md items-center justify-around gap-1 rounded-full glass-strong px-2 py-1.5 glow-border">
        {ITEMS.map((item) => {
          const active = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-hud-primary/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={cn(
                  'relative z-10 transition-colors',
                  active ? 'text-hud-primary-bright' : 'text-hud-text-dim'
                )}
              />
              <span
                className={cn(
                  'relative z-10 text-[10px] font-medium transition-colors',
                  active ? 'text-hud-primary-bright' : 'text-hud-text-dim'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export const BottomNav = memo(BottomNavImpl);
