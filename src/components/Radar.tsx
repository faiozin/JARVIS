import { memo, useEffect, useRef } from 'react';

function RadarImpl({ size = 120 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = size * dpr;
    canvas.width = px;
    canvas.height = px;
    ctx.scale(dpr, dpr);

    const blips = Array.from({ length: 4 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 20 + Math.random() * (size / 2 - 25),
      life: Math.random(),
      speed: 0.4 + Math.random() * 0.8,
    }));

    const tick = (t: number) => {
      const time = t / 1000;
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const maxR = size / 2 - 2;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      for (let r = maxR / 3; r <= maxR; r += maxR / 3) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(cx, size - 2);
      ctx.moveTo(2, cy);
      ctx.lineTo(size - 2, cy);
      ctx.stroke();

      const sweep = (time * 1.2) % (Math.PI * 2);
      const grad = ctx.createConicGradient(sweep, cx, cy);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
      grad.addColorStop(0.15, 'rgba(56, 189, 248, 0.1)');
      grad.addColorStop(0.3, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      ctx.stroke();

      blips.forEach((b) => {
        b.life += 0.005 * b.speed;
        if (b.life > 1) b.life = 0;
        const bx = cx + Math.cos(b.angle) * b.radius;
        const by = cy + Math.sin(b.angle) * b.radius;
        const alpha = Math.sin(b.life * Math.PI) * 0.8;
        ctx.fillStyle = `rgba(125, 211, 252, ${alpha})`;
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export const Radar = memo(RadarImpl);
