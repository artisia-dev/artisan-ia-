-- ============================================================
-- Migration complète ArtisIA – à exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Compléter la table profiles existante
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS business_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Table clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 3. Table messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  sender_type text DEFAULT 'artisan' CHECK (sender_type IN ('artisan', 'client', 'ai')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 4. Table artisan_ai_settings
CREATE TABLE IF NOT EXISTS artisan_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  ai_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE artisan_ai_settings DISABLE ROW LEVEL SECURITY;

-- 5. Table quotes
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  quote_number text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  valid_until date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- 6. Table quote_items
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE quote_items DISABLE ROW LEVEL SECURITY;

-- 7. Table appointments (schéma avec date + time séparés)
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  status text DEFAULT 'en attente' CHECK (status IN ('confirmé', 'en attente', 'annulé')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;

-- 8. Table leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  source text DEFAULT '',
  status text DEFAULT 'nouveau' CHECK (status IN ('nouveau','contacté','devis_envoyé','converti','perdu')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
