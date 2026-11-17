"use client";

import { supabase } from "@/lib/supabaseClient";

/** Oturumun geçersiz olduğu (401/403) durumlarda fırlatılan hata. */
export class YetkiHatasi extends Error {}

type IstekSecenekleri = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  sorgu?: Record<string, string | number | undefined | null>;
};

async function erisimAnahtari(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new YetkiHatasi("Oturum bulunamadı. Lütfen giriş yapın.");
  return token;
}

/**
 * `/api/admin/...` uçlarına oturum anahtarıyla istek atar. Sunucu yanıtı
 * hata içeriyorsa anlaşılır mesajla fırlatır.
 */
export async function adminIstek<T = unknown>(
  yol: string,
  { method = "GET", body, sorgu }: IstekSecenekleri = {}
): Promise<T> {
  const token = await erisimAnahtari();

  const parametreler = new URLSearchParams();
  Object.entries(sorgu ?? {}).forEach(([anahtar, deger]) => {
    if (deger !== undefined && deger !== null && deger !== "") {
      parametreler.set(anahtar, String(deger));
    }
  });
  const adres = `/api/admin/${yol}${parametreler.size ? `?${parametreler}` : ""}`;

  let yanit: Response;
  try {
    yanit = await fetch(adres, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
  }

  let veri: unknown = null;
  try {
    veri = await yanit.json();
  } catch {
    // gövdesiz yanıt
  }

  if (!yanit.ok) {
    const mesaj =
      (veri as { error?: string } | null)?.error || "İşlem gerçekleştirilemedi.";
    if (yanit.status === 401 || yanit.status === 403) {
      // Oturum geçersiz veya yönetici değil: oturumu kapat, panel giriş ekranına döner.
      void supabase.auth.signOut();
      throw new YetkiHatasi(mesaj);
    }
    throw new Error(mesaj);
  }
  return veri as T;
}

export type DepolamaKlasoru = "hikayeler" | "urun-gorselleri";

/**
 * Dosyayı, sunucunun yalnızca yöneticiye verdiği imzalı adres üzerinden
 * Storage'a yükler ve herkese açık URL'ini döndürür.
 */
export async function dosyaYukle(
  bucket: DepolamaKlasoru,
  dosya: File
): Promise<string> {
  const { path, token, publicUrl } = await adminIstek<{
    path: string;
    token: string;
    publicUrl: string;
  }>("yukleme", { method: "POST", body: { bucket, dosyaAdi: dosya.name } });

  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, dosya, {
      contentType: dosya.type || undefined,
    });
  if (error) throw new Error(`"${dosya.name}" yüklenemedi: ${error.message}`);
  return publicUrl;
}

/** Hata nesnesinden kullanıcıya gösterilecek mesajı çıkarır. */
export function hataMesaji(err: unknown): string {
  return err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.";
}
