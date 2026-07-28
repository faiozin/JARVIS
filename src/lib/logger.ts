const isDev = import.meta.env.DEV;

type LogFn = (...args: unknown[]) => void;

function noop(): void {}

function makeFn(prefix: string, color: string, fn: LogFn): LogFn {
  if (!isDev) return noop;
  return (...args: unknown[]) =>
    fn(`%c[JARVIS:${prefix}]`, `color:${color};font-weight:600`, ...args);
}

export const logger = {
  info: makeFn('info', '#38bdf8', console.log),
  warn: makeFn('warn', '#fbbf24', console.warn),
  error: makeFn('error', '#f87171', console.error),
  debug: makeFn('debug', '#a78bfa', console.log),
};
