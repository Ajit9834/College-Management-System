"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client, used only to start the Google OAuth redirect.
 * Both values are public by design (the anon key is protected by Supabase RLS);
 * the service role key must never be used here.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  return createBrowserClient(url, anonKey);
}
