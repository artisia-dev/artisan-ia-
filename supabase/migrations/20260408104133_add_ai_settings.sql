/*
  # Add AI Settings Table

  1. New Tables
    - `artisan_ai_settings`
      - `id` (uuid, primary key)
      - `artisan_id` (uuid, foreign key to auth.users)
      - `ai_enabled` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `artisan_ai_settings` table
    - Add policy for artisans to manage their own AI settings
*/

CREATE TABLE IF NOT EXISTS artisan_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(artisan_id)
);

ALTER TABLE artisan_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artisans can manage their own AI settings"
  ON artisan_ai_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);
