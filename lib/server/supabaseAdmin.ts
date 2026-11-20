import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Yalnızca sunucuda (route handler) kullanılan tam yetkili Supabase istemcisi.
 * Gizli anahtar tanımlı değilse null döner; anon anahtara ASLA düşmez.
 */
export function supabaseAdminOlustur(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const gizliAnahtar =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !gizliAnahtar) {
    console.error(
      "Supabase sunucu anahtarı eksik: SUPABASE_SERVICE_ROLE_KEY (veya SUPABASE_SECRET_KEY) tanımlanmalı."
    );
    return null;
  }

  return createClient(url, gizliAnahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Next.js fetch'i önbelleğe/tekilleştirmeye alabilir; yönetici verisi
    // (özellikle Storage'daki JSON kayıtları) her zaman taze okunmalı.
    global: { fetch: (girdi, ayar) => fetch(girdi, { ...ayar, cache: "no-store" }) },
  });
}
