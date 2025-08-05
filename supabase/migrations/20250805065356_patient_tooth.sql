/*
  # Create employees table

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `nama` (text, employee name)
      - `posisi` (text, employee position)
      - `email` (text, employee email)
      - `telepon` (text, employee phone number)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `employees` table
    - Add policy for authenticated users to manage employee data
    - Only authenticated users can read, insert, update, and delete employee records

  3. Changes
    - Creates the main employees table with all required fields
    - Sets up proper indexing for email lookups
    - Adds RLS policies for secure access
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  posisi text NOT NULL,
  email text UNIQUE NOT NULL,
  telepon text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "Authenticated users can read employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete employees"
  ON employees
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS employees_email_idx ON employees(email);

-- Create index for position lookups
CREATE INDEX IF NOT EXISTS employees_posisi_idx ON employees(posisi);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();