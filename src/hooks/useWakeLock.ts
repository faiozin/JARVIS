import { useEffect, useState } from 'react';

export function useWakeLock(active: boolean): boolean {
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!active || !navigator.wakeLock) return;
    let sentinel: WakeLockSentinel | null = null;
    let mounted = true;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
        if (!mounted) {
          await sentinel.release();
          sentinel = null;
          return;
        }
        sentinel.onrelease = () => setHeld(false);
        setHeld(true);
      } catch {
        setHeld(false);
      }
    };

    void acquire();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisible);
      if (sentinel) void sentinel.release();
      setHeld(false);
    };
  }, [active]);

  return held;
}
