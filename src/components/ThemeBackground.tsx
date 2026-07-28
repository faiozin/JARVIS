import { memo } from 'react';

interface ThemeBackgroundProps {
  theme: 'holographic' | 'midnight' | 'aurora';
}

function ThemeBackgroundImpl({ theme }: ThemeBackgroundProps) {
  const gradients: Record<string, string> = {
    holographic:
      'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(14,165,233,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(34,211,238,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 0% 80%, rgba(56,189,248,0.1) 0%, transparent 55%)',
    midnight:
      'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(15,22,38,0.9) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(30,41,59,0.6) 0%, transparent 55%)',
    aurora:
      'radial-gradient(ellipse 70% 50% at 30% 10%, rgba(52,211,153,0.15) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 90%, rgba(34,211,238,0.14) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 10% 70%, rgba(56,189,248,0.1) 0%, transparent 55%)',
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: gradients[theme] }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

export const ThemeBackground = memo(ThemeBackgroundImpl);
