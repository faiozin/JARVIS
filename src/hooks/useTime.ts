import { useEffect, useState } from 'react';

export function useTime(intervalMs = 1000): { time: Date; tick: number } {
  const [time, setTime] = useState(() => new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(new Date());
      setTick((t) => t + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return { time, tick };
}
