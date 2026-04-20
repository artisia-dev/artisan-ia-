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
