export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  role: Role;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export type Theme = 'holographic' | 'midnight' | 'aurora';
export type Personality = 'polite' | 'friendly' | 'formal' | 'concise';

export interface Preferences {
  id?: string;
  user_name: string | null;
  ai_name: string;
  language: string;
  theme: Theme;
  voice_uri: string | null;
  speech_rate: number;
  speech_pitch: number;
  volume: number;
  wake_word_enabled: boolean;
  wake_word_sensitivity: number;
  hands_free: boolean;
  animations_enabled: boolean;
  high_contrast: boolean;
  personality: Personality;
  custom_instructions: string | null;
  updated_at?: string;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export type AssistantState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'wake-detected'
  | 'error';

export type ConnectionStatus = 'online' | 'offline';

export interface VoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  user_name: null,
  ai_name: 'J.A.R.V.I.S.',
  language: 'pt-BR',
  theme: 'holographic',
  voice_uri: null,
  speech_rate: 1.0,
  speech_pitch: 1.0,
  volume: 1.0,
  wake_word_enabled: true,
  wake_word_sensitivity: 0.5,
  hands_free: false,
  animations_enabled: true,
  high_contrast: false,
  personality: 'polite',
  custom_instructions: null,
};

export const WAKE_WORD = 'jarvis';

export const PERSONALITY_PROMPTS: Record<Personality, string> = {
  polite:
    'Seja sempre educado, profissional e prestativo. Trate o usuário com respeito e cordialidade.',
  friendly:
    'Seja amigável, caloroso e acessível. Use um tom mais descontraído mantendo a inteligência.',
  formal:
    'Mantenha um tom formal e objetivo. Use linguagem técnica e precisa, sem coloquialismos.',
  concise:
    'Seja extremamente conciso. Responda de forma direta e breve, sem enrolação.',
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'time', label: 'Que horas são?', prompt: 'Que horas são agora?', icon: 'Clock' },
  { id: 'date', label: 'Data de hoje', prompt: 'Qual é a data de hoje?', icon: 'Calendar' },
  { id: 'weather', label: 'Previsão do tempo', prompt: 'Como está o tempo agora?', icon: 'CloudSun' },
  { id: 'joke', label: 'Conte uma piada', prompt: 'Conte uma piada curta e engraçada.', icon: 'Smile' },
  { id: 'idea', label: 'Dê uma ideia', prompt: 'Me dê uma ideia criativa para hoje.', icon: 'Lightbulb' },
  { id: 'help', label: 'O que você faz?', prompt: 'O que você pode fazer por mim?', icon: 'HelpCircle' },
];

export const STORAGE_KEYS = {
  preferences: 'jarvis.preferences',
  onboardingDone: 'jarvis.onboarding',
  currentConversation: 'jarvis.currentConversation',
} as const;
