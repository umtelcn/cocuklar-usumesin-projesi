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

/** Herkese açık `bagislar` satırına yazılacak alanları üretir. */
export function herkeseAcikAlanlar(girdi: {
  ad_soyad: string;
  instagram: string | null;
  mesaj: string;
  anonim: boolean;
}) {
  return {
    ad_soyad: girdi.anonim ? ANONIM_AD : girdi.ad_soyad || ANONIM_AD,
    instagram_kullanici_adi: girdi.anonim ? null : girdi.instagram,
    mesaj: girdi.mesaj || null,
    is_anonymous: girdi.anonim,
  };
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
