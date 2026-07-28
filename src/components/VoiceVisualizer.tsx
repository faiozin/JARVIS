import { memo, useEffect, useRef } from 'react';
import type { AssistantState } from '@/types';

interface VoiceVisualizerProps {
  state: AssistantState;
  active: boolean;
  barCount?: number;
}

function VoiceVisualizerImpl({ state, active, barCount = 32 }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const activeRef = useRef(active);
  stateRef.current = state;
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const phases = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      const barW = w / barCount;
      const color = colorForState(stateRef.current);

      for (let i = 0; i < barCount; i++) {
        const phase = phases[i] + time * (activeRef.current ? 6 : 1.2);
        const base = activeRef.current ? 0.5 : 0.15;
        const amp = activeRef.current ? 0.42 : 0.08;
        const normalized = base + amp * (0.5 + 0.5 * Math.sin(phase));
        const barH = normalized * h;
        const x = i * barW + barW * 0.2;
        const y = (h - barH) / 2;
        const bw = barW * 0.6;

        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, color.bright);
        grad.addColorStop(1, color.primary);
        ctx.fillStyle = grad;
        ctx.beginPath();
        const r = bw / 2;
        ctx.roundRect(x, y, bw, barH, r);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [barCount]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden="true"
    />
  );
}

function colorForState(state: AssistantState) {
  switch (state) {
    case 'listening': return { bright: '#6ee7b7', primary: '#10b981' };
    case 'speaking': return { bright: '#67e8f9', primary: '#06b6d4' };
    case 'thinking': return { bright: '#fcd34d', primary: '#f59e0b' };
    case 'wake-detected': return { bright: '#bae6fd', primary: '#0ea5e9' };
    case 'error': return { bright: '#fca5a5', primary: '#ef4444' };
    default: return { bright: '#7dd3fc', primary: '#0ea5e9' };
  }
}

export const VoiceVisualizer = memo(VoiceVisualizerImpl);
