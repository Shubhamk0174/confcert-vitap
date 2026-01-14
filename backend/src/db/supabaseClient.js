import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/env.js";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

export const createAnonClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: "confcert-vitap",
    },
    auth: {
      persistSession: false,
    },
  });
