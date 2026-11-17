import { NextResponse } from "next/server";
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

const VIDEO_DESENI = /\.(mp4|mov|webm|ogg)(\?.*)?$/i;

function medyaListesi(deger: unknown): string[] {
  if (!Array.isArray(deger)) return [];
  return deger
    .filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
    .map((u) => u.trim().slice(0, 1000))
    .slice(0, 30);
}

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const { data, error } = await yetki.admin
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

  // İlk görsel kapak olur; yalnızca video varsa ilk medya kullanılır.
  const kapak = medya.find((u) => !VIDEO_DESENI.test(u)) ?? medya[0];
  const sabitle = govde.sabitle === true;

  if (sabitle) {
    // Mevcut gönderilerin sırasını bir kaydır; yeni gönderi en üste gelsin.
    const { data: mevcut, error } = await admin.from(TABLO).select("id, sira");
    if (error) {
      console.error("Sıra kaydırma için gönderiler okunamadı:", error);
      return hata("Sıralama güncellenemedi.", 500);
    }
    const sonuclar = await Promise.all(
      (mevcut ?? []).map((g) =>
        admin
          .from(TABLO)
          .update({ sira: (g.sira ?? 0) + 1 })
          .eq("id", g.id)
      )
    );
    const kaydirmaHatasi = sonuclar.find((s) => s.error)?.error;
    if (kaydirmaHatasi) {
      console.error("Sıra kaydırılamadı:", kaydirmaHatasi);
      return hata("Sıralama güncellenemedi.", 500);
    }
  }

  const { data, error } = await admin
    .from(TABLO)
    .insert({
      baslik: metin(govde.baslik, 200),
      kisa_ozet: metin(govde.kisa_ozet, 1000),
      uzun_metin: metin(govde.uzun_metin, 10000),
      kapak_gorseli: kapak,
      medya_url: medya,
      begeni_sayisi: tamSayi(govde.begeni_sayisi) ?? 0,
      sira: sabitle ? 1 : (tamSayi(govde.sira) ?? 0),
    })
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("Gönderi eklenemedi:", error);
    return hata("Gönderi eklenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

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
  if ("sira" in govde) {
    const deger = tamSayi(govde.sira);
    if (deger === null) return hata("Sıra numarası geçersiz.", 400);
    guncelleme.sira = deger;
  }
  if (Object.keys(guncelleme).length === 0) return hata("Değişiklik yok.", 400);

  const { data, error } = await yetki.admin
    .from(TABLO)
    .update(guncelleme)
    .eq("id", id)
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("Gönderi güncellenemedi:", error);
    return hata("Gönderi güncellenemedi.", 500);
  }
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
  return NextResponse.json({ success: true });
}
