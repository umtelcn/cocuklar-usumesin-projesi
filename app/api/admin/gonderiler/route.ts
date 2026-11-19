import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dosyalariSil,
  govdeOku,
  hata,
  metin,
  tamSayi,
  uuidKimlik,
  yoneticiDogrula,
} from "@/lib/server/adminYetki";

const TABLO = "gerceklesen_dilekler";
const BUCKET = "hikayeler";
const ALANLAR =
  "id, baslik, kisa_ozet, uzun_metin, kapak_gorseli, medya_url, created_at, goruntulenme, sira, begeni_sayisi";

function medyaListesi(deger: unknown): string[] {
  if (!Array.isArray(deger)) return [];
  const liste: string[] = [];
  for (const u of deger) {
    if (typeof u !== "string" || !/^https?:\/\//i.test(u)) continue;
    const temiz = u.trim().slice(0, 1000);
    if (!liste.includes(temiz)) liste.push(temiz);
  }
  return liste.slice(0, 30);
}

/**
 * Gönderilere ardışık 1..N sıra numarası verir. `duzenle`, sitenin şu anki
 * gösterim sırasındaki kimlik listesini alıp istenen son sırayı döndürür.
 * Listede olmayan gönderiler mevcut sıralarıyla sona eklenir; yalnızca
 * numarası değişen satırlar güncellenir. Hata varsa mesajını döndürür.
 */
async function yenidenNumarala(
  admin: SupabaseClient,
  duzenle: (idler: string[]) => string[] = (idler) => idler
): Promise<string | null> {
  const { data, error } = await admin
    .from(TABLO)
    .select("id, sira")
    .order("sira", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Sıralama için gönderiler okunamadı:", error);
    return "Sıralama güncellenemedi.";
  }
  const satirlar = (data ?? []) as { id: string; sira: number | null }[];
  const mevcutSira = new Map(satirlar.map((s) => [s.id, s.sira]));
  const mevcutIdler = satirlar.map((s) => s.id);

  const son = [...new Set(duzenle(mevcutIdler).filter((id) => mevcutSira.has(id)))];
  mevcutIdler.forEach((id) => {
    if (!son.includes(id)) son.push(id);
  });

  const sonuclar = await Promise.all(
    son
      .map((id, i) => ({ id, sira: i + 1 }))
      .filter(({ id, sira }) => mevcutSira.get(id) !== sira)
      .map(({ id, sira }) => admin.from(TABLO).update({ sira }).eq("id", id))
  );
  const yazmaHatasi = sonuclar.find((s) => s.error)?.error;
  if (yazmaHatasi) {
    console.error("Sıra numaraları yazılamadı:", yazmaHatasi);
    return "Sıralama güncellenemedi.";
  }
  return null;
}

async function listeYaniti(admin: SupabaseClient) {
  const { data, error } = await admin
    .from(TABLO)
    .select(ALANLAR)
    .order("sira", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Gönderiler okunamadı:", error);
    return hata("Gönderiler yüklenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  return listeYaniti(yetki.admin);
}

export async function POST(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const govde = await govdeOku(req);
  if (!govde) return hata("Geçersiz istek.", 400);

  const medya = medyaListesi(govde.medya_url);
  if (medya.length === 0) {
    return hata("En az bir fotoğraf veya video ekleyin.", 400);
  }
  const sabitle = govde.sabitle === true;

  const { data, error } = await admin
    .from(TABLO)
    .insert({
      baslik: metin(govde.baslik, 200),
      kisa_ozet: metin(govde.kisa_ozet, 1000),
      uzun_metin: metin(govde.uzun_metin, 10000),
      // Yöneticinin belirlediği sıradaki ilk medya kapak olur.
      kapak_gorseli: medya[0],
      medya_url: medya,
      begeni_sayisi: tamSayi(govde.begeni_sayisi) ?? 0,
      sira: 0,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("Gönderi eklenemedi:", error);
    return hata("Gönderi eklenemedi.", 500);
  }

  // Yeni gönderi en üste (sabitle) ya da en sona eklenir; numaralar 1..N kalır.
  const yeniId = data.id as string;
  const siraHatasi = await yenidenNumarala(admin, (idler) => {
    const digerleri = idler.filter((id) => id !== yeniId);
    return sabitle ? [yeniId, ...digerleri] : [...digerleri, yeniId];
  });
  if (siraHatasi) return hata(`Gönderi eklendi ancak ${siraHatasi.toLowerCase()}`, 500);

  const { data: kayit, error: okumaHatasi } = await admin
    .from(TABLO)
    .select(ALANLAR)
    .eq("id", yeniId)
    .single();
  if (okumaHatasi) return hata("Gönderi eklendi ancak okunamadı.", 500);
  return NextResponse.json({ data: kayit });
}

/** Toplu sıralama: `{ siralama: [id1, id2, ...] }` → sira = 1..N. */
export async function PUT(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  const ham = govde?.siralama;
  if (!Array.isArray(ham) || ham.length === 0 || ham.length > 1000) {
    return hata("Geçersiz sıralama.", 400);
  }
  const idler: string[] = [];
  for (const deger of ham) {
    const id = uuidKimlik(deger);
    if (!id) return hata("Geçersiz sıralama.", 400);
    idler.push(id);
  }

  const siraHatasi = await yenidenNumarala(yetki.admin, () => idler);
  if (siraHatasi) return hata(siraHatasi, 500);
  return listeYaniti(yetki.admin);
}

export async function PATCH(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const govde = await govdeOku(req);
  const id = uuidKimlik(govde?.id);
  if (!govde || !id) return hata("Geçersiz gönderi.", 400);

  const guncelleme: Record<string, unknown> = {};
  if ("baslik" in govde) guncelleme.baslik = metin(govde.baslik, 200);
  if ("kisa_ozet" in govde) guncelleme.kisa_ozet = metin(govde.kisa_ozet, 1000);
  if ("uzun_metin" in govde) {
    guncelleme.uzun_metin = metin(govde.uzun_metin, 10000);
  }
  if ("begeni_sayisi" in govde) {
    const deger = tamSayi(govde.begeni_sayisi);
    if (deger === null) return hata("Beğeni sayısı geçersiz.", 400);
    guncelleme.begeni_sayisi = deger;
  }

  let kaldirilanMedya: string[] = [];
  if ("medya_url" in govde) {
    const medya = medyaListesi(govde.medya_url);
    if (medya.length === 0) {
      return hata("Gönderide en az bir fotoğraf veya video kalmalı.", 400);
    }
    const { data: eski, error } = await admin
      .from(TABLO)
      .select("kapak_gorseli, medya_url")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("Gönderi medyası okunamadı:", error);
      return hata("Gönderi güncellenemedi.", 500);
    }
    if (!eski) return hata("Gönderi bulunamadı.", 404);
    const eskiler = [
      eski.kapak_gorseli,
      ...(Array.isArray(eski.medya_url) ? eski.medya_url : []),
    ].filter((u): u is string => typeof u === "string" && u !== "");
    kaldirilanMedya = [...new Set(eskiler)].filter((u) => !medya.includes(u));
    guncelleme.kapak_gorseli = medya[0];
    guncelleme.medya_url = medya;
  }
  if (Object.keys(guncelleme).length === 0) return hata("Değişiklik yok.", 400);

  const { data, error } = await admin
    .from(TABLO)
    .update(guncelleme)
    .eq("id", id)
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("Gönderi güncellenemedi:", error);
    return hata("Gönderi güncellenemedi.", 500);
  }
  // Gönderiden çıkarılan medya dosyaları depodan da silinir.
  if (kaldirilanMedya.length > 0) await dosyalariSil(admin, BUCKET, kaldirilanMedya);
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const id = uuidKimlik(new URL(req.url).searchParams.get("id"));
  if (!id) return hata("Geçersiz gönderi.", 400);

  const { data, error } = await admin
    .from(TABLO)
    .delete()
    .eq("id", id)
    .select("kapak_gorseli, medya_url")
    .maybeSingle();
  if (error) {
    console.error("Gönderi silinemedi:", error);
    return hata("Gönderi silinemedi.", 500);
  }
  if (data) {
    await dosyalariSil(admin, BUCKET, [
      data.kapak_gorseli,
      ...(Array.isArray(data.medya_url) ? data.medya_url : []),
    ]);
  }
  // Silinen gönderinin boşluğu kapanır; numaralar yine 1..N olur.
  const siraHatasi = await yenidenNumarala(admin);
  if (siraHatasi) console.warn("Silme sonrası sıra numaraları güncellenemedi.");
  return NextResponse.json({ success: true });
}
