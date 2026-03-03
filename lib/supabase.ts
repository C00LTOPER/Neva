import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");

export const supabase = createClient(url, anon || "");

export const supabaseServer = () => {
  if (!serviceRole) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRole);
};