// Certify — Supabase client
//
// Setup:
//   1. Create a Supabase project at https://supabase.com
//   2. Open the SQL editor and run schema.sql
//   3. In Project Settings → API, copy the Project URL and the anon (public) key
//   4. Paste them below
//
// The anon key is safe to expose in client-side code; access is governed
// by the Row Level Security policies defined in schema.sql.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://nhgybyamhmasmvjwjuuo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ3lieWFtaG1hc212andqdXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjg4OTgsImV4cCI6MjA5MzYwNDg5OH0.MvMnCzfLIeUA3qDbTLZ18X99alnGgx8RuoHEj8FySIg";

export const isConfigured =
  SUPABASE_URL.startsWith("https://") &&
  Boolean(SUPABASE_ANON_KEY) &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

// Only create the client when real credentials are present — createClient
// throws an "Invalid URL" error when called with placeholder strings.
export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;
