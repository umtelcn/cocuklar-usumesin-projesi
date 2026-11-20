import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdminOlustur } from "@/lib/server/supabaseAdmin";

/**
 * DM Asistanı ayarları ve geçmişi — SQL tablosu gerektirmeden Supabase
 * Storage üzerinde JSON dosyaları olarak saklanır.
 *
 * Mevcut bucket'lar (gorseler, urun-gorselleri...) herkese açık olduğu için
 * API anahtarları ve özel mesajlar oraya YAZILMAZ; servis anahtarıyla
 * otomatik oluşturulan özel (private) bir bucket kullanılır.
 */
const BUCKET = "sistem-ozel";
const AYAR_YOLU = "sistem/dm_ayarlar.json";
const GECMIS_YOLU = "sistem/dm_gecmisi.json";
export const GECMIS_SINIRI = 50;

export type DmAyarlar = {
  aktif: boolean;
  gecikme_saniye: number;
  model: string;
  openrouter_api_key: string;
  instagram_access_token: string;
  instagram_verify_token: string;
  guncel_durum: string;
  sistem_talimati: string;
};

export type DmDurum = "cevaplandi" | "insana_devredildi" | "test" | "hata";

export type DmKayit = {
  id: string;
  tarih: string;
  gonderen_id: string | null;
  kullanici_mesaji: string;
  ai_cevabi: string;
  durum: DmDurum;
  not?: string;
};

export const VARSAYILAN_MODEL = "google/gemini-2.5-flash";

export const VARSAYILAN_AYARLAR: DmAyarlar = {
  aktif: true,
  gecikme_saniye: 8,
  model: VARSAYILAN_MODEL,
  openrouter_api_key: "",
  instagram_access_token: "",
  instagram_verify_token: "cocuklar_usumesin_2026",
  guncel_durum:
    "Şu an 9 yaşındaki annesi olmayan kızımızın odasını en sevdiği pembe renge boyuyoruz, inşallah yarın da yeni eşyaları gelecek ve odasını kuracağız.",
  sistem_talimati:
    "Sen 'Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği' (@cocuklar_usumes) Instagram hesabının yöneticisisin. Asla yapay zeka veya bot olduğunu söyleme, gerçek bir insan gibi samimi, sıcak ve kısa (en fazla 1-2 cümle) cevap ver.\nKURALLAR:\n1. Resmi veya robotik cümleler ('Size nasıl yardımcı olabilirim', 'Anlayışınız için teşekkürler') KESİNLİKLE KULLANMA. 'Güzel kalpli kardeşim 🤍', 'Allah razı olsun 🌸', 'Çok geçmiş olsun ablacım/kardeşim 😔' gibi doğal ve içten konuş.\n2. Bağış / IBAN / Destek soranlara: 'Allah razı olsun güzel kalbinizden 🤍 Profilimizdeki linkten (cocuklarusumesindestek.com) hem çalışmalarımızı görebilir hem de güvenle destek olabilirsiniz 🌸' de.\n3. Yardım / erzak / eşya talep edenlere: 'Çok geçmiş olsun 😔 Mesajlar burada çok yoğun olduğu için kaybolabiliyor, profilimizdeki siteden (cocuklarusumesindestek.com) Yardım Talebi bölümünü doldurursanız ekibimiz sırayla dönüş yapıyor 🤍' de.\n4. Elden kıyafet/eşya göndermek isteyenlere: Şu an lojistik ve kargo maliyeti sebebiyle ikinci el eşya kabul edemediğimizi, çocukların bedenlerine göre sıfır alıp ulaştırdığımızı çok nazikçe söyle.\n5. Eğer mesaj karmaşıksa, dekont/hesap soruyorsa, tepkiliyse veya emin değilsen SADECE '[INSANA_DEVRET]' yaz, başka hiçbir şey yazma.",
};

export const INSANA_DEVRET = "[INSANA_DEVRET]";

let bucketHazir = false;

async function istemci(): Promise<SupabaseClient> {
  const admin = supabaseAdminOlustur();
  if (!admin) throw new Error("Supabase sunucu anahtarı tanımlı değil.");
  if (!bucketHazir) {
    const { data } = await admin.storage.getBucket(BUCKET);
    if (!data) {
      const { error } = await admin.storage.createBucket(BUCKET, { public: false });
      if (error && !/exist/i.test(error.message)) {
        throw new Error(`Özel depolama alanı oluşturulamadı: ${error.message}`);
      }
    } else if (data.public) {
      await admin.storage.updateBucket(BUCKET, { public: false });
    }
    bucketHazir = true;
  }
  return admin;
}

async function jsonOku<T>(admin: SupabaseClient, yol: string): Promise<T | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(yol);
  if (error || !data) return null; // dosya henüz yok
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

async function jsonYaz(admin: SupabaseClient, yol: string, veri: unknown) {
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(yol, new Blob([JSON.stringify(veri, null, 2)], { type: "application/json" }), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(`Kayıt yazılamadı: ${error.message}`);
}

function ayarlariNormallestir(ham: Partial<DmAyarlar> | null): DmAyarlar {
  const a = { ...VARSAYILAN_AYARLAR, ...(ham ?? {}) };
  const gecikme = Number(a.gecikme_saniye);
  return {
    aktif: Boolean(a.aktif),
    gecikme_saniye: Number.isFinite(gecikme) ? Math.min(Math.max(Math.round(gecikme), 0), 60) : 8,
    openrouter_api_key: String(a.openrouter_api_key ?? ""),
    instagram_access_token: String(a.instagram_access_token ?? ""),
    instagram_verify_token: String(a.instagram_verify_token ?? ""),
    guncel_durum: String(a.guncel_durum ?? ""),
    sistem_talimati: String(a.sistem_talimati ?? ""),
    model: String(a.model ?? "").trim() || VARSAYILAN_MODEL,
  };
}

/** Kayıtlı ayarları okur; hiç kayıt yoksa varsayılanları döner (hata fırlatmaz). */
export async function ayarlariOku(): Promise<DmAyarlar> {
  try {
    const admin = await istemci();
    return ayarlariNormallestir(await jsonOku<Partial<DmAyarlar>>(admin, AYAR_YOLU));
  } catch (err) {
    console.error("DM ayarları okunamadı:", err);
    return { ...VARSAYILAN_AYARLAR };
  }
}

export async function ayarlariKaydet(yeni: Partial<DmAyarlar>): Promise<DmAyarlar> {
  const admin = await istemci();
  const mevcut = ayarlariNormallestir(await jsonOku<Partial<DmAyarlar>>(admin, AYAR_YOLU));
  const birlesik = ayarlariNormallestir({ ...mevcut, ...yeni });
  await jsonYaz(admin, AYAR_YOLU, birlesik);
  return birlesik;
}

/** Ayarlardaki boş anahtarlar için ortam değişkenlerine düşer. */
export function etkinAnahtarlar(ayar: DmAyarlar) {
  return {
    openrouter: ayar.openrouter_api_key || process.env.OPENROUTER_API_KEY || "",
    instagram: ayar.instagram_access_token || process.env.INSTAGRAM_ACCESS_TOKEN || "",
  };
}

export async function gecmisiOku(): Promise<DmKayit[]> {
  try {
    const admin = await istemci();
    const liste = await jsonOku<DmKayit[]>(admin, GECMIS_YOLU);
    return Array.isArray(liste) ? liste : [];
  } catch (err) {
    console.error("DM geçmişi okunamadı:", err);
    return [];
  }
}

export async function gecmiseEkle(
  kayit: Omit<DmKayit, "id" | "tarih">
): Promise<DmKayit> {
  const tam: DmKayit = { id: crypto.randomUUID(), tarih: new Date().toISOString(), ...kayit };
  try {
    const admin = await istemci();
    const liste = (await jsonOku<DmKayit[]>(admin, GECMIS_YOLU)) ?? [];
    await jsonYaz(admin, GECMIS_YOLU, [tam, ...(Array.isArray(liste) ? liste : [])].slice(0, GECMIS_SINIRI));
  } catch (err) {
    console.error("DM geçmişine yazılamadı:", err);
  }
  return tam;
}

export async function gecmisiTemizle() {
  const admin = await istemci();
  await jsonYaz(admin, GECMIS_YOLU, []);
}

/** OpenRouter üzerinden cevap üretir. */
export async function cevapUret(ayar: DmAyarlar, mesaj: string): Promise<string> {
  const { openrouter } = etkinAnahtarlar(ayar);
  if (!openrouter) throw new Error("OpenRouter API anahtarı tanımlı değil.");

  const sistem = [
    ayar.sistem_talimati,
    ayar.guncel_durum
      ? `GÜNCEL DURUM (biri 'ne yapıyorsunuz / bugün ne var' diye sorarsa bunu doğal şekilde anlat): ${ayar.guncel_durum}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const yanit = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openrouter}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://cocuklarusumesindestek.com",
      "X-Title": "Cocuklar Usumesin DM",
    },
    body: JSON.stringify({
      model: ayar.model || VARSAYILAN_MODEL,
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: "system", content: sistem },
        { role: "user", content: mesaj },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const veri = (await yanit.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  } | null;
  if (!yanit.ok) {
    throw new Error(`OpenRouter hatası (${yanit.status}): ${veri?.error?.message ?? "bilinmiyor"}`);
  }
  const metin = veri?.choices?.[0]?.message?.content?.trim();
  if (!metin) throw new Error("OpenRouter boş cevap döndürdü.");
  return metin;
}

/** Anahtarları panelde gösterirken maskeler. */
export function maskele(deger: string): string {
  if (!deger) return "";
  return deger.length <= 8 ? "••••" : `••••${deger.slice(-4)}`;
}
