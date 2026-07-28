import type { Message, Preferences } from '@/types';
import { PERSONALITY_PROMPTS } from '@/types';
import { logger } from './logger';

export interface ChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  preferences: Preferences;
  memory: Record<string, string>;
}

export interface StreamHandlers {
  onToken: (token: string) => void;
  onDone: (full: string) => void;
  onError: (error: string) => void;
}

const EDGE_FUNCTION = 'ai-chat';

/**
 * Sends the conversation to the edge function and streams the response.
 * The edge function proxies the OpenAI Responses API.
 *
 * If the function returns a 503 (no API key configured) or any non-2xx,
 * we surface a clear error so the caller can show it.
 */
export async function streamChat(
  request: ChatRequest,
  signal: AbortSignal,
  handlers: StreamHandlers
): Promise<void> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v2/${EDGE_FUNCTION}`;
  const headers = {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal,
    });
  } catch (err) {
    if (signal.aborted) return;
    logger.error('ai-chat fetch failed:', err);
    handlers.onError('Não foi possível conectar ao serviço de IA. Verifique sua conexão.');
    return;
  }

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => '');
    logger.warn('ai-chat non-ok:', response.status, body);
    handlers.onError(parseError(response.status, body));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          handlers.onDone(full);
          return;
        }
        try {
          const parsed = JSON.parse(payload) as { token?: string };
          if (parsed.token) {
            full += parsed.token;
            handlers.onToken(parsed.token);
          }
        } catch {
          /* skip malformed */
        }
      }
    }
    if (full) handlers.onDone(full);
    else handlers.onError('O serviço de IA não retornou uma resposta.');
  } catch (err) {
    if (signal.aborted) return;
    logger.error('ai-chat stream error:', err);
    handlers.onError('Erro ao receber a resposta. Tente novamente.');
  }
}

function parseError(status: number, body: string): string {
  if (status === 503) {
    return 'A chave da API de IA não está configurada. Entre em contato com o administrador.';
  }
  if (status === 429) {
    return 'Muitas solicitações. Aguarde um momento e tente novamente.';
  }
  if (status === 401 || status === 403) {
    return 'Erro de autenticação com o serviço de IA.';
  }
  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    /* not json */
  }
  return 'O serviço de IA encontrou um erro. Tente novamente.';
}

/**
 * Builds the message array sent to the edge function, including the system
 * prompt (persona + memory) and the recent conversation history.
 */
export function buildRequestMessages(
  history: Message[],
  preferences: Preferences,
  memory: Record<string, string>
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  const system = buildSystemPrompt(preferences, memory);
  const recent = history.slice(-20).map((m) => ({
    role: m.role === 'system' ? ('assistant' as const) : (m.role as 'user' | 'assistant'),
    content: m.content,
  }));
  return [{ role: 'system', content: system }, ...recent];
}

function buildSystemPrompt(preferences: Preferences, memory: Record<string, string>): string {
  const personality = PERSONALITY_PROMPTS[preferences.personality];
  const name = preferences.user_name ?? 'Senhor';
  const instructions = preferences.custom_instructions
    ? `\n\nInstruções personalizadas do usuário: ${preferences.custom_instructions}`
    : '';

  const memoryEntries = Object.entries(memory);
  const memoryText =
    memoryEntries.length > 0
      ? `\n\nMemória de longo prazo do usuário (use quando relevante):\n${memoryEntries
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n')}`
      : '';

  return [
    `Você é o J.A.R.V.I.S., um assistente de IA inspirado no assistente de Tony Stark.`,
    `Responda sempre em português brasileiro, de forma natural e fluida.`,
    `Trate o usuário como "${name}".`,
    personality,
    `Você pode usar Markdown para formatar respostas, incluindo blocos de código com syntax highlighting.`,
    `Quando não souber algo, seja honesto — nunca invente informações.`,
  ].join(' ') + instructions + memoryText;
}
