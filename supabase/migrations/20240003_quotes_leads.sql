-- ============================================================
-- ArtisIA – Créer les tables leads, quotes et quote_items
-- À coller et exécuter dans : Supabase > SQL Editor > New Query
-- ============================================================

-- 1. Table leads (prospects / clients)
CREATE TABLE IF NOT EXISTS leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        text DEFAULT '',
  phone        text DEFAULT '',
  source       text DEFAULT '',
  status       text DEFAULT 'nouveau'
               CHECK (status IN ('nouveau','contacté','devis_envoyé','converti','perdu')),
  notes        text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- 2. Table quotes (devis) — référence leads, statut inclut 'paid'
CREATE TABLE IF NOT EXISTS quotes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id    uuid REFERENCES leads(id) ON DELETE SET NULL,
  quote_number text NOT NULL,
  title        text NOT NULL,
  description  text DEFAULT '',
  amount       numeric(10,2) DEFAULT 0,
  status       text DEFAULT 'draft'
               CHECK (status IN ('draft','sent','accepted','rejected','paid')),
  valid_until  date,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- 3. Table quote_items (lignes du devis)
CREATE TABLE IF NOT EXISTS quote_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description  text NOT NULL,
  quantity     numeric(10,2) DEFAULT 1,
  unit_price   numeric(10,2) DEFAULT 0,
  total        numeric(10,2) DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE quote_items DISABLE ROW LEVEL SECURITY;
