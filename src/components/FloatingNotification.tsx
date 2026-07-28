import { memo, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
}

interface FloatingNotificationProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

function FloatingNotificationImpl({ notifications, onDismiss }: FloatingNotificationProps) {
  return (
    <div
      className="pointer-events-none fixed bottom-24 right-4 z-50 flex flex-col gap-2 safe-bottom safe-x"
      role="region"
      aria-label="Notificações"
      aria-live="polite"
    >
      <AnimatePresence>
        {notifications.map((n) => (
          <NotificationCard key={n.id} item={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationCard({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), 4500);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'error' ? AlertCircle : Info;
  const color =
    item.type === 'success'
      ? 'text-hud-success'
      : item.type === 'error'
      ? 'text-hud-error'
      : 'text-hud-primary-bright';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="glass-strong pointer-events-auto flex max-w-xs items-start gap-3 rounded-2xl px-4 py-3 glow-border"
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
      <p className="flex-1 text-sm text-hud-text">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-hud-text-dim hover:text-hud-text"
        aria-label="Fechar notificação"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export const FloatingNotification = memo(FloatingNotificationImpl);

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, notify, dismiss };
}
