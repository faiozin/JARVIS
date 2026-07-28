/*
# J.A.R.V.I.S. — Schema inicial (single-tenant, sem autenticação)

## Visão geral
Cria as tabelas necessárias para o assistente J.A.R.V.I.S. armazenar
histórico de conversas, memória de longo prazo e preferências do usuário.
Como o aplicativo NÃO possui tela de login, todas as políticas usam
`TO anon, authenticated` para que o cliente anon-key consiga ler e gravar
seus próprios dados.

## Novas tabelas

1. `conversations`
   - `id` (uuid, pk)
   - `title` (text) — título curto da conversa
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

2. `messages`
   - `id` (uuid, pk)
   - `conversation_id` (uuid, fk → conversations, cascade)
   - `role` (text) — 'user' | 'assistant' | 'system'
   - `content` (text)
   - `created_at` (timestamptz)

3. `preferences`
   - `id` (uuid, pk) — linha única controlada pelo app
   - `user_name` (text)
   - `ai_name` (text, default 'J.A.R.V.I.S.')
   - `language` (text, default 'pt-BR')
   - `theme` (text, default 'holographic')
   - `voice_uri` (text)
   - `speech_rate` (real, default 1.0)
   - `speech_pitch` (real, default 1.0)
   - `volume` (real, default 1.0)
   - `wake_word_enabled` (boolean, default true)
   - `wake_word_sensitivity` (real, default 0.5)
   - `hands_free` (boolean, default false)
   - `animations_enabled` (boolean, default true)
   - `high_contrast` (boolean, default false)
   - `personality` (text, default 'polite')
   - `custom_instructions` (text)
   - `updated_at` (timestamptz)

4. `memory`
   - `id` (uuid, pk)
   - `key` (text, unique) — ex: 'favorite_language'
   - `value` (text)
   - `updated_at` (timestamptz)

## Segurança
- RLS habilitado em todas as tabelas.
- Políticas CRUD completas (SELECT/INSERT/UPDATE/DELETE) para
  `anon, authenticated`, já que o app é single-tenant sem login.
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Nova Conversa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations
  FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages
  FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text,
  ai_name text NOT NULL DEFAULT 'J.A.R.V.I.S.',
  language text NOT NULL DEFAULT 'pt-BR',
  theme text NOT NULL DEFAULT 'holographic',
  voice_uri text,
  speech_rate real NOT NULL DEFAULT 1.0,
  speech_pitch real NOT NULL DEFAULT 1.0,
  volume real NOT NULL DEFAULT 1.0,
  wake_word_enabled boolean NOT NULL DEFAULT true,
  wake_word_sensitivity real NOT NULL DEFAULT 0.5,
  hands_free boolean NOT NULL DEFAULT false,
  animations_enabled boolean NOT NULL DEFAULT true,
  high_contrast boolean NOT NULL DEFAULT false,
  personality text NOT NULL DEFAULT 'polite',
  custom_instructions text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_preferences" ON preferences;
CREATE POLICY "anon_select_preferences" ON preferences
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_preferences" ON preferences;
CREATE POLICY "anon_insert_preferences" ON preferences
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_preferences" ON preferences;
CREATE POLICY "anon_update_preferences" ON preferences
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_preferences" ON preferences;
CREATE POLICY "anon_delete_preferences" ON preferences
  FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_memory" ON memory;
CREATE POLICY "anon_select_memory" ON memory
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_memory" ON memory;
CREATE POLICY "anon_insert_memory" ON memory
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_memory" ON memory;
CREATE POLICY "anon_update_memory" ON memory
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_memory" ON memory;
CREATE POLICY "anon_delete_memory" ON memory
  FOR DELETE TO anon, authenticated USING (true);
