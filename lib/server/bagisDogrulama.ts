import type { SupabaseClient } from "@supabase/supabase-js";

export const ANONIM_AD = "Anonim Bağışçı";
export const AD_SOYAD_SINIRI = 80;
export const MESAJ_SINIRI = 500;

/** Gerçek adların tutulduğu, anonim erişime kapalı tablo (bkz. supabase/guvenlik.sql). */
const GIZLI_TABLO = "bagis_gizli_bilgiler";

export function metinTemizle(deger: unknown, sinir: number): string {
  return typeof deger === "string" ? deger.trim().slice(0, sinir) : "";
}

/** "@ad", "instagram.com/ad/" gibi girişleri sade kullanıcı adına indirger; geçersizse null. */
export function instagramTemizle(deger: unknown): string | null {
  const sade = metinTemizle(deger, 120)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .trim();
  return /^[A-Za-z0-9._]{1,30}$/.test(sade) ? sade : null;
}

/**
 * Anonim bağışçı için herkese açık gösterim: yalnızca ad ve soyadın baş harfi.
 * "Ahmet Can Yılmaz" → "A. Y.", "zeynep" → "Z."; harf yoksa ANONIM_AD.
 */
export function anonimBasHarfler(adSoyad: string): string {
  const sade = adSoyad.trim();
  if (sade === ANONIM_AD || sade === "Gizli Kahraman") return ANONIM_AD;
  const parcalar = sade
    .split(/\s+/)
    .map((p) => p.match(/\p{L}/u)?.[0] ?? "")
    .filter(Boolean);
  if (parcalar.length === 0) return ANONIM_AD;
  const secilen =
    parcalar.length === 1 ? [parcalar[0]] : [parcalar[0], parcalar[parcalar.length - 1]];
  return secilen.map((h) => `${h.toLocaleUpperCase("tr-TR")}.`).join(" ");
}

/** Herkese açık `bagislar` satırına yazılacak alanları üretir. */
export function herkeseAcikAlanlar(girdi: {
  ad_soyad: string;
  instagram: string | null;
  mesaj: string;
  anonim: boolean;
}) {
  return {
    ad_soyad: girdi.anonim
      ? anonimBasHarfler(girdi.ad_soyad)
      : girdi.ad_soyad || ANONIM_AD,
    instagram_kullanici_adi: girdi.anonim ? null : girdi.instagram,
    mesaj: girdi.mesaj || null,
    is_anonymous: girdi.anonim,
  };
}

/** Gizli tablodaki gerçek adı okur; yoksa boş metin döner. */
export async function gercekAdiGetir(
  admin: SupabaseClient,
  bagisId: number
): Promise<string> {
  const { data } = await admin
    .from(GIZLI_TABLO)
    .select("gercek_ad_soyad")
    .eq("bagis_id", bagisId)
    .maybeSingle();
  return typeof data?.gercek_ad_soyad === "string" ? data.gercek_ad_soyad : "";
}

/**
 * Bağışçının gerçek adını anonim erişime kapalı tabloda saklar.
 * Tablo henüz oluşturulmadıysa bağış akışını bozmaz, yalnızca uyarı yazar.
 */
export async function gercekAdiSakla(
  admin: SupabaseClient,
  bagisId: number,
  gercekAd: string
) {
  if (!gercekAd) return;
  const { error } = await admin
    .from(GIZLI_TABLO)
    .upsert(
      { bagis_id: bagisId, gercek_ad_soyad: gercekAd },
      { onConflict: "bagis_id" }
    );
  if (error) {
    console.warn(
      `Gerçek ad saklanamadı (${GIZLI_TABLO}). supabase/guvenlik.sql çalıştırıldı mı?`,
      error.message
    );
  }
}
