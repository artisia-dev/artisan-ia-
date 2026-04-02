/*
  # Schéma de base ArtisIA
  
  1. Nouvelles Tables
    - `profiles`
      - `id` (uuid, clé primaire, référence auth.users)
      - `business_name` (texte) - Nom de l'entreprise artisan
      - `phone` (texte) - Téléphone
      - `address` (texte) - Adresse
      - `subscription_plan` (texte) - Plan d'abonnement (starter, pro, premium)
      - `subscription_status` (texte) - Statut abonnement (active, canceled, expired)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `clients`
      - `id` (uuid, clé primaire)
      - `artisan_id` (uuid, référence profiles) - L'artisan propriétaire
      - `name` (texte) - Nom du client
      - `email` (texte) - Email du client
      - `phone` (texte) - Téléphone du client
      - `address` (texte) - Adresse du client
      - `notes` (texte) - Notes sur le client
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `quotes`
      - `id` (uuid, clé primaire)
      - `artisan_id` (uuid, référence profiles)
      - `client_id` (uuid, référence clients)
      - `quote_number` (texte) - Numéro de devis
      - `title` (texte) - Titre du devis
      - `description` (texte) - Description des travaux
      - `amount` (numeric) - Montant total
      - `status` (texte) - Statut (draft, sent, accepted, rejected)
      - `valid_until` (date) - Date de validité
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `quote_items`
      - `id` (uuid, clé primaire)
      - `quote_id` (uuid, référence quotes)
      - `description` (texte) - Description de l'item
      - `quantity` (numeric) - Quantité
      - `unit_price` (numeric) - Prix unitaire
      - `total` (numeric) - Total de la ligne
      - `created_at` (timestamp)
    
    - `appointments`
      - `id` (uuid, clé primaire)
      - `artisan_id` (uuid, référence profiles)
      - `client_id` (uuid, référence clients)
      - `title` (texte) - Titre du rendez-vous
      - `description` (texte) - Description
      - `start_time` (timestamptz) - Heure de début
      - `end_time` (timestamptz) - Heure de fin
      - `status` (texte) - Statut (scheduled, completed, canceled)
      - `location` (texte) - Lieu
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, clé primaire)
      - `artisan_id` (uuid, référence profiles)
      - `client_id` (uuid, référence clients)
      - `content` (texte) - Contenu du message
      - `sender_type` (texte) - Type d'expéditeur (artisan, client, ai)
      - `is_read` (boolean) - Message lu ou non
      - `created_at` (timestamp)
  
  2. Sécurité
    - Active RLS sur toutes les tables
    - Politiques pour que les artisans ne voient que leurs propres données
*/

-- Création de la table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  subscription_plan text DEFAULT 'starter',
  subscription_status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Création de la table clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les artisans peuvent voir leurs propres clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent créer leurs propres clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent mettre à jour leurs propres clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent supprimer leurs propres clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = artisan_id);

-- Création de la table quotes
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  quote_number text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  amount numeric DEFAULT 0,
  status text DEFAULT 'draft',
  valid_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les artisans peuvent voir leurs propres devis"
  ON quotes FOR SELECT
  TO authenticated
  USING (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent créer leurs propres devis"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent mettre à jour leurs propres devis"
  ON quotes FOR UPDATE
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent supprimer leurs propres devis"
  ON quotes FOR DELETE
  TO authenticated
  USING (auth.uid() = artisan_id);

-- Création de la table quote_items
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric DEFAULT 0,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les artisans peuvent voir les items de leurs devis"
  ON quote_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.artisan_id = auth.uid()
    )
  );

CREATE POLICY "Les artisans peuvent créer des items pour leurs devis"
  ON quote_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.artisan_id = auth.uid()
    )
  );

CREATE POLICY "Les artisans peuvent mettre à jour les items de leurs devis"
  ON quote_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.artisan_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.artisan_id = auth.uid()
    )
  );

CREATE POLICY "Les artisans peuvent supprimer les items de leurs devis"
  ON quote_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.artisan_id = auth.uid()
    )
  );

-- Création de la table appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled',
  location text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les artisans peuvent voir leurs propres rendez-vous"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent créer leurs propres rendez-vous"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent mettre à jour leurs propres rendez-vous"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent supprimer leurs propres rendez-vous"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = artisan_id);

-- Création de la table messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  sender_type text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les artisans peuvent voir leurs propres messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent créer des messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY "Les artisans peuvent mettre à jour leurs messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_artisan_id ON clients(artisan_id);
CREATE INDEX IF NOT EXISTS idx_quotes_artisan_id ON quotes(artisan_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_appointments_artisan_id ON appointments(artisan_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_artisan_id ON messages(artisan_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
