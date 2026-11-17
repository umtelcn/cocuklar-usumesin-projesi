import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdminOlustur } from "@/lib/server/supabaseAdmin";

export function hata(mesaj: string, durum: number) {
  return NextResponse.json({ error: mesaj }, { status: durum });
}

export type YoneticiBaglami = {
  admin: SupabaseClient;
  kullaniciId: string;
  email: string | null;
};

/**
 * `Authorization: Bearer <access_token>` başlığını doğrular, kullanıcının
 * `public.profiles` tablosunda kayıtlı bir yönetici olduğunu kontrol eder ve
 * tam yetkili (service_role) istemciyi döndürür. Başarısızsa hazır bir hata
 * yanıtı (NextResponse) döner.
 */
export async function yoneticiDogrula(
  req: Request
): Promise<YoneticiBaglami | NextResponse> {
  const baslik = req.headers.get("authorization") || "";
  const eslesme = /^Bearer\s+(.+)$/i.exec(baslik.trim());
  const token = eslesme?.[1]?.trim();
  if (!token) return hata("Oturum bulunamadı. Lütfen giriş yapın.", 401);

  const admin = supabaseAdminOlustur();
  if (!admin) return hata("Sunucu yapılandırma hatası.", 500);

  const { data: kullaniciVerisi, error: kullaniciHatasi } =
    await admin.auth.getUser(token);
  const kullanici = kullaniciVerisi?.user;
  if (kullaniciHatasi || !kullanici) {
    return hata("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.", 401);
  }

  const { data: profil, error: profilHatasi } = await admin
    .from("profiles")
    .select("id")
    .eq("id", kullanici.id)
    .maybeSingle();
  if (profilHatasi) {
    console.error("Yönetici profili okunamadı:", profilHatasi);
    return hata("Yetki kontrolü yapılamadı.", 500);
  }
  if (!profil) return hata("Bu hesabın yönetici yetkisi yok.", 403);

  return { admin, kullaniciId: kullanici.id, email: kullanici.email ?? null };
}

/** JSON gövdesini nesne olarak okur; geçersizse null. */
export async function govdeOku(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const ham: unknown = await req.json();
    if (typeof ham !== "object" || ham === null || Array.isArray(ham)) {
      return null;
    }
    return ham as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Pozitif tam sayı kimlik (bigint) doğrulaması. */
export function sayiKimlik(deger: unknown): number | null {
  const sayi = typeof deger === "string" ? Number(deger) : deger;
  return typeof sayi === "number" && Number.isSafeInteger(sayi) && sayi > 0
    ? sayi
    : null;
}

const UUID_DESENI =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuidKimlik(deger: unknown): string | null {
  return typeof deger === "string" && UUID_DESENI.test(deger) ? deger : null;
}

/** Tam sayı alanı (sıra, fiyat, beğeni); geçersizse null. */
export function tamSayi(
  deger: unknown,
  { min = 0, max = 2_000_000_000 }: { min?: number; max?: number } = {}
): number | null {
  const sayi =
    typeof deger === "string" && deger.trim() !== "" ? Number(deger) : deger;
  if (typeof sayi !== "number" || !Number.isFinite(sayi)) return null;
  const yuvarlak = Math.round(sayi);
  return yuvarlak >= min && yuvarlak <= max ? yuvarlak : null;
}

export function metin(deger: unknown, sinir: number): string {
  return typeof deger === "string" ? deger.trim().slice(0, sinir) : "";
}

/** PostgREST `or()` filtresini bozabilecek karakterleri temizler. */
export function aramaTemizle(deger: string | null): string {
  return (deger || "")
    .replace(/[,()*%\\:"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Herkese açık Storage URL'inden bucket içindeki dosya yolunu çıkarır. */
export function depolamaYolu(url: unknown, bucket: string): string | null {
  if (typeof url !== "string") return null;
  const isaret = `/storage/v1/object/public/${bucket}/`;
  const konum = url.indexOf(isaret);
  if (konum === -1) return null;
  const yol = url.slice(konum + isaret.length).split("?")[0];
  try {
    return decodeURIComponent(yol) || null;
  } catch {
    return null;
  }
}

/** Storage dosyalarını en iyi çabayla siler; hata akışı bozmaz. */
export async function dosyalariSil(
  admin: SupabaseClient,
  bucket: string,
  urller: unknown[]
) {
  const yollar = urller
    .map((u) => depolamaYolu(u, bucket))
    .filter((y): y is string => Boolean(y));
  if (yollar.length === 0) return;
  const { error } = await admin.storage.from(bucket).remove(yollar);
  if (error) console.warn(`Storage dosyaları silinemedi (${bucket}):`, error.message);
}
