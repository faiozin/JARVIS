import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  strong?: boolean;
  glow?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, strong, glow, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          strong ? 'glass-strong' : 'glass',
          glow && 'glow-border',
          'rounded-3xl',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = 'GlassCard';
