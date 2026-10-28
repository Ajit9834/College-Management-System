import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Server-side Supabase client bound to the Next.js cookie store. The PKCE code
 * verifier written by the browser client lives in a cookie, so the OAuth code
 * can only be exchanged here rather than in the client.
 */
export async function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          store.set(name, value, options);
        }
      },
    },
  });
}
