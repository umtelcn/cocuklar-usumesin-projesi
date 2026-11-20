import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdminOlustur } from "@/lib/server/supabaseAdmin";

/**
 * DM Asistanı ayarları, geçmişi ve öğrenen hafızası — SQL tablosu
 * gerektirmeden Supabase Storage üzerinde JSON dosyaları olarak saklanır.
 *
 * Mevcut bucket'lar (gorseler, urun-gorselleri...) herkese açık olduğu için
 * API anahtarları ve özel mesajlar oraya YAZILMAZ; servis anahtarıyla
 * otomatik oluşturulan özel (private) bir bucket kullanılır.
 */
const BUCKET = "sistem-ozel";
const AYAR_YOLU = "sistem/dm_ayarlar.json";
const GECMIS_YOLU = "sistem/dm_gecmisi.json";
const HAFIZA_YOLU = "sistem/dm_hafiza.json";
export const GECMIS_SINIRI = 50;
const HAFIZA_SINIRI = 300;
/** Sistem promptuna eklenecek en yeni hafıza örneği sayısı. */
const PROMPTA_GIDEN_HAFIZA = 40;
/** Kayıtlı ayarların şema sürümü; eski kayıtlar okunurken otomatik yükseltilir. */
const AYAR_SURUMU = 2;

export type DmAyarlar = {
  surum: number;
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
  /** Botun Instagram'a gönderdiği mesajın kimliği (echo ayırt etmek için). */
  gonderilen_mid?: string;
  /** Yöneticinin telefondan elle yazdığı cevap (echo ile öğrenildi). */
  admin_cevabi?: string;
};

export type HafizaKaynak = "instagram_admin" | "panel_ogreti";

export type DmHafiza = {
  id: string;
  tarih: string;
  soru: string;
  dogru_cevap: string;
  kaynak: HafizaKaynak;
};

export type SohbetMesaji = { role: "user" | "assistant"; content: string };

export const VARSAYILAN_MODEL = "anthropic/claude-sonnet-5.5";
const ESKI_VARSAYILAN_MODEL = "google/gemini-2.5-flash";

const KURAL_TEKRAR_YOK =
  "Önceki mesajlarda söylediğin bilgileri (annesini kaybettiği, Mardin'de yaşadığı vb.) her mesajda tekrar tekrar yazma! Sadece sorulan yeni soruya gerçek bir insan gibi kısa, doğal ve doğrudan cevap ver.";
const KURAL_IBAN =
  "Kullanıcı web sitesinde bağış yapamadığını, hata aldığını veya doğrudan IBAN istediğini söylerse asla 'yoğunluk var' diye geçiştirme; sitede 'Ödemeye Geç' butonuna basabileceğini söyle ve doğrudan resmi banka bilgilerimizi paylaş:\nAlıcı: Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği\nZiraat Bankası TL IBAN: TR36 0001 0011 5098 1058 3050 01";
const IBAN_ISARETI = "TR36 0001 0011 5098 1058 3050 01";

export const VARSAYILAN_AYARLAR: DmAyarlar = {
  surum: AYAR_SURUMU,
  aktif: true,
  gecikme_saniye: 8,
  model: VARSAYILAN_MODEL,
  openrouter_api_key: "",
  instagram_access_token: "",
  instagram_verify_token: "cocuklar_usumesin_2026",
  guncel_durum:
    "Şu an 9 yaşındaki annesi olmayan kızımızın odasını en sevdiği pembe renge boyuyoruz, inşallah yarın da yeni eşyaları gelecek ve odasını kuracağız.",
  sistem_talimati:
    "Sen 'Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği' (@cocuklar_usumes) Instagram hesabının yöneticisisin. Asla yapay zeka veya bot olduğunu söyleme, gerçek bir insan gibi samimi, sıcak ve kısa (en fazla 1-2 cümle) cevap ver.\nKURALLAR:\n1. Resmi veya robotik cümleler ('Size nasıl yardımcı olabilirim', 'Anlayışınız için teşekkürler') KESİNLİKLE KULLANMA. 'Güzel kalpli kardeşim 🤍', 'Allah razı olsun 🌸', 'Çok geçmiş olsun ablacım/kardeşim 😔' gibi doğal ve içten konuş.\n2. Bağış / Destek soranlara: 'Allah razı olsun güzel kalbinizden 🤍 Profilimizdeki linkten (cocuklarusumesindestek.com) hem çalışmalarımızı görebilir hem de güvenle destek olabilirsiniz 🌸' de.\n3. Yardım / erzak / eşya talep edenlere: 'Çok geçmiş olsun 😔 Mesajlar burada çok yoğun olduğu için kaybolabiliyor, profilimizdeki siteden (cocuklarusumesindestek.com) Yardım Talebi bölümünü doldurursanız ekibimiz sırayla dönüş yapıyor 🤍' de.\n4. Elden kıyafet/eşya göndermek isteyenlere: Şu an lojistik ve kargo maliyeti sebebiyle ikinci el eşya kabul edemediğimizi, çocukların bedenlerine göre sıfır alıp ulaştırdığımızı çok nazikçe söyle.\n5. Eğer mesaj karmaşıksa, dekont gönderiyorsa, tepkiliyse veya emin değilsen SADECE '[INSANA_DEVRET]' yaz, başka hiçbir şey yazma.\n6. " +
    KURAL_TEKRAR_YOK +
    "\n7. " +
    KURAL_IBAN,
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

/*
 * Aynı dosyanın üzerine tekrar tekrar yazmak, Storage tarafındaki önbellek
 * nedeniyle bir süre ESKİ içeriğin okunmasına yol açabiliyor (test edildi).
 * Bu yüzden her yazım benzersiz adlı YENİ bir sürüm dosyası oluşturur
 * (`sistem/dm_gecmisi/<zaman>-<rastgele>.json`); okuma, tutarlı olan
 * `list()` (veritabanı sorgusu) ile en yeni sürümü bulup onu indirir.
 * Eski sürümler arka planda silinir. Sürüm klasörü henüz yoksa eski tek
 * dosya (`sistem/dm_gecmisi.json`) okunur — mevcut kayıtlar böylece taşınır.
 */
const SAKLANAN_SURUM = 3;

function surumKlasoru(yol: string): string {
  return yol.replace(/\.json$/, "");
}

async function surumleriListele(admin: SupabaseClient, klasor: string): Promise<string[]> {
  const { data, error } = await admin.storage.from(BUCKET).list(klasor, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  if (error || !data) return [];
  return data
    .map((d) => d.name)
    .filter((ad) => ad.endsWith(".json"))
    .sort()
    .reverse();
}

async function indir<T>(admin: SupabaseClient, yol: string): Promise<T | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(yol);
  if (error || !data) return null; // dosya henüz yok
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

async function jsonOku<T>(admin: SupabaseClient, yol: string): Promise<T | null> {
  const klasor = surumKlasoru(yol);
  const [enYeni] = await surumleriListele(admin, klasor);
  if (enYeni) return indir<T>(admin, `${klasor}/${enYeni}`);
  return indir<T>(admin, yol); // eski tek dosya düzeni
}

async function jsonYaz(admin: SupabaseClient, yol: string, veri: unknown) {
  const klasor = surumKlasoru(yol);
  const ad = `${String(Date.now()).padStart(15, "0")}-${crypto.randomUUID().slice(0, 8)}.json`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(`${klasor}/${ad}`, new Blob([JSON.stringify(veri, null, 2)], { type: "application/json" }), {
      upsert: false,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(`Kayıt yazılamadı: ${error.message}`);

  // Eski sürümleri temizle (en yeni birkaç tanesi güvenlik için kalır).
  const eskiler = (await surumleriListele(admin, klasor)).slice(SAKLANAN_SURUM);
  if (eskiler.length) {
    const { error: silmeHatasi } = await admin.storage
      .from(BUCKET)
      .remove(eskiler.map((e) => `${klasor}/${e}`));
    if (silmeHatasi) console.warn("Eski DM kayıt sürümleri silinemedi:", silmeHatasi.message);
  }
}

function ayarlariNormallestir(ham: Partial<DmAyarlar> | null): DmAyarlar {
  const a = { ...VARSAYILAN_AYARLAR, ...(ham ?? {}) };
  const gecikme = Number(a.gecikme_saniye);
  return {
    surum: AYAR_SURUMU,
    aktif: Boolean(a.aktif),
    gecikme_saniye: Number.isFinite(gecikme) ? Math.min(Math.max(Math.round(gecikme), 0), 60) : 8,
    model: String(a.model ?? "").trim() || VARSAYILAN_MODEL,
    openrouter_api_key: String(a.openrouter_api_key ?? ""),
    instagram_access_token: String(a.instagram_access_token ?? ""),
    instagram_verify_token: String(a.instagram_verify_token ?? ""),
    guncel_durum: String(a.guncel_durum ?? ""),
    sistem_talimati: String(a.sistem_talimati ?? ""),
  };
}

/**
 * Sürüm 1 kayıtlarını yükseltir: eski varsayılan modeli Claude Sonnet 5.5'e
 * taşır, talimata tekrar-etmeme ve IBAN kurallarını ekler, IBAN sorularını
 * insana devreden eski ifadeleri düzeltir.
 */
function surumYukselt(ham: Partial<DmAyarlar>): Partial<DmAyarlar> {
  const yeni = { ...ham };
  if (!yeni.model || yeni.model === ESKI_VARSAYILAN_MODEL) yeni.model = VARSAYILAN_MODEL;

  let talimat = typeof yeni.sistem_talimati === "string" ? yeni.sistem_talimati : "";
  if (talimat) {
    talimat = talimat
      .replace("2. Bağış / IBAN / Destek soranlara:", "2. Bağış / Destek soranlara:")
      .replace("dekont/hesap soruyorsa", "dekont gönderiyorsa");
    const ekler: string[] = [];
    if (!talimat.includes("tekrar tekrar yazma")) ekler.push(KURAL_TEKRAR_YOK);
    if (!talimat.includes(IBAN_ISARETI)) ekler.push(KURAL_IBAN);
    const sonNumara = Math.max(0, ...[...talimat.matchAll(/^(\d+)\./gm)].map((m) => Number(m[1])));
    ekler.forEach((kural, i) => {
      talimat += `\n${sonNumara + i + 1}. ${kural}`;
    });
    yeni.sistem_talimati = talimat;
  }
  yeni.surum = AYAR_SURUMU;
  return yeni;
}

/** Kayıtlı ayarları okur; hiç kayıt yoksa varsayılanları döner (hata fırlatmaz). */
export async function ayarlariOku(): Promise<DmAyarlar> {
  try {
    const admin = await istemci();
    const ham = await jsonOku<Partial<DmAyarlar>>(admin, AYAR_YOLU);
    if (ham && (ham.surum ?? 1) < AYAR_SURUMU) {
      const yukseltilmis = ayarlariNormallestir(surumYukselt(ham));
      await jsonYaz(admin, AYAR_YOLU, yukseltilmis).catch((err) =>
        console.error("DM ayarları yükseltilemedi:", err)
      );
      return yukseltilmis;
    }
    return ayarlariNormallestir(ham);
  } catch (err) {
    console.error("DM ayarları okunamadı:", err);
    return { ...VARSAYILAN_AYARLAR };
  }
}

export async function ayarlariKaydet(yeni: Partial<DmAyarlar>): Promise<DmAyarlar> {
  const admin = await istemci();
  const mevcut = await ayarlariOku();
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

/* ------------------------------------------------------------------ */
/* Geçmiş                                                              */
/* ------------------------------------------------------------------ */

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

export async function gecmisKaydiGuncelle(id: string, alanlar: Partial<DmKayit>) {
  try {
    const admin = await istemci();
    const liste = (await jsonOku<DmKayit[]>(admin, GECMIS_YOLU)) ?? [];
    if (!Array.isArray(liste)) return;
    await jsonYaz(
      admin,
      GECMIS_YOLU,
      liste.map((k) => (k.id === id ? { ...k, ...alanlar } : k))
    );
  } catch (err) {
    console.error("DM geçmiş kaydı güncellenemedi:", err);
  }
}

export async function gecmisiTemizle() {
  const admin = await istemci();
  await jsonYaz(admin, GECMIS_YOLU, []);
}

/** Bir kullanıcıyla geçmişteki son konuşmayı OpenRouter mesaj dizisine çevirir. */
export function kullaniciSohbeti(gecmis: DmKayit[], gonderenId: string, adet = 6): SohbetMesaji[] {
  const sinir = Date.now() - 3 * 24 * 60 * 60 * 1000;
  return gecmis
    .filter((k) => k.gonderen_id === gonderenId && Date.parse(k.tarih) > sinir)
    .slice(0, adet)
    .reverse()
    .flatMap((k): SohbetMesaji[] => {
      const cevap = k.admin_cevabi || (k.durum === "cevaplandi" ? k.ai_cevabi : "");
      const parcalar: SohbetMesaji[] = [];
      if (k.kullanici_mesaji) parcalar.push({ role: "user", content: k.kullanici_mesaji });
      if (cevap) parcalar.push({ role: "assistant", content: cevap });
      return parcalar;
    });
}

/* ------------------------------------------------------------------ */
/* Öğrenen hafıza                                                      */
/* ------------------------------------------------------------------ */

function soruAnahtari(soru: string): string {
  return soru.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
}

export async function hafizaOku(): Promise<DmHafiza[]> {
  try {
    const admin = await istemci();
    const liste = await jsonOku<DmHafiza[]>(admin, HAFIZA_YOLU);
    return Array.isArray(liste) ? liste : [];
  } catch (err) {
    console.error("DM hafızası okunamadı:", err);
    return [];
  }
}

/** Aynı soru zaten varsa cevabını günceller, yoksa en başa ekler. */
export async function hafizayaEkle(
  soru: string,
  dogruCevap: string,
  kaynak: HafizaKaynak
): Promise<DmHafiza[]> {
  const temizSoru = soru.trim().slice(0, 2000);
  const temizCevap = dogruCevap.trim().slice(0, 4000);
  if (!temizSoru || !temizCevap) throw new Error("Soru ve doğru cevap boş olamaz.");

  const admin = await istemci();
  const liste = (await jsonOku<DmHafiza[]>(admin, HAFIZA_YOLU)) ?? [];
  const anahtar = soruAnahtari(temizSoru);
  const digerleri = (Array.isArray(liste) ? liste : []).filter((h) => soruAnahtari(h.soru) !== anahtar);
  const kayit: DmHafiza = {
    id: crypto.randomUUID(),
    tarih: new Date().toISOString(),
    soru: temizSoru,
    dogru_cevap: temizCevap,
    kaynak,
  };
  const yeni = [kayit, ...digerleri].slice(0, HAFIZA_SINIRI);
  await jsonYaz(admin, HAFIZA_YOLU, yeni);
  return yeni;
}

export async function hafizadanSil(id: string): Promise<DmHafiza[]> {
  const admin = await istemci();
  const liste = (await jsonOku<DmHafiza[]>(admin, HAFIZA_YOLU)) ?? [];
  const yeni = (Array.isArray(liste) ? liste : []).filter((h) => h.id !== id);
  await jsonYaz(admin, HAFIZA_YOLU, yeni);
  return yeni;
}

/* ------------------------------------------------------------------ */
/* Cevap üretimi                                                       */
/* ------------------------------------------------------------------ */

function sohbetiTemizle(gecmis: unknown): SohbetMesaji[] {
  if (!Array.isArray(gecmis)) return [];
  return gecmis
    .filter(
      (m): m is SohbetMesaji =>
        !!m &&
        typeof m === "object" &&
        ((m as SohbetMesaji).role === "user" || (m as SohbetMesaji).role === "assistant") &&
        typeof (m as SohbetMesaji).content === "string" &&
        (m as SohbetMesaji).content.trim() !== ""
    )
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
}

/** OpenRouter üzerinden, konuşma geçmişi ve öğrenilmiş hafızayla cevap üretir. */
export async function cevapUret(
  ayar: DmAyarlar,
  mesaj: string,
  gecmis: unknown = []
): Promise<string> {
  const { openrouter } = etkinAnahtarlar(ayar);
  if (!openrouter) throw new Error("OpenRouter API anahtarı tanımlı değil.");

  const hafiza = (await hafizaOku()).slice(0, PROMPTA_GIDEN_HAFIZA);
  const hafizaMetni = hafiza.length
    ? "DAHA ÖNCE BİZİM VERDİĞİMİZ GERÇEK CEVAPLAR (Benzer sorularda bu bilgi ve üslubu birebir örnek al):\n" +
      hafiza.map((h) => `Soru: ${h.soru}\nCevabımız: ${h.dogru_cevap}`).join("\n---\n")
    : "";

  const sistem = [
    ayar.sistem_talimati,
    ayar.guncel_durum
      ? `GÜNCEL DURUM (biri 'ne yapıyorsunuz / bugün ne var' diye sorarsa bunu doğal şekilde anlat): ${ayar.guncel_durum}`
      : "",
    hafizaMetni,
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
      max_tokens: 1500,
      messages: [
        { role: "system", content: sistem },
        ...sohbetiTemizle(gecmis),
        { role: "user", content: mesaj },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
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
