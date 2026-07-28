import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

function PageHeaderImpl({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between gap-3 px-1 pt-2"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hud-primary/15 text-hud-primary-bright">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-hud-text leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-hud-text-dim">{subtitle}</p>}
        </div>
      </div>
      {action}
    </motion.header>
  );
}

export const PageHeader = memo(PageHeaderImpl);
