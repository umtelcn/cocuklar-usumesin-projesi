import { NextResponse } from "next/server";
import { supabaseAdminOlustur } from "@/lib/server/supabaseAdmin";
import { duzenlemeTokeniUret } from "@/lib/server/duzenlemeToken";
import {
  AD_SOYAD_SINIRI,
  MESAJ_SINIRI,
  gercekAdiSakla,
  herkeseAcikAlanlar,
  instagramTemizle,
  metinTemizle,
} from "@/lib/server/bagisDogrulama";

const EN_FAZLA_ADET = 9999;
const EN_FAZLA_NAKDI = 10_000_000;

function hata(mesaj: string, durum: number) {
  return NextResponse.json({ error: mesaj }, { status: durum });
}

/** { "urunId": adet } biçimindeki sepeti doğrulayıp [urunId, adet] listesine çevirir. */
function sepetiCoz(deger: unknown): [number, number][] | null {
  if (deger === undefined || deger === null) return [];
  if (typeof deger !== "object" || Array.isArray(deger)) return null;

  const kalemler: [number, number][] = [];
  for (const [anahtar, adet] of Object.entries(deger)) {
    const urunId = Number(anahtar);
    if (
      !Number.isSafeInteger(urunId) ||
      urunId <= 0 ||
      typeof adet !== "number" ||
      !Number.isInteger(adet) ||
      adet < 0 ||
      adet > EN_FAZLA_ADET
    ) {
      return null;
    }
    if (adet > 0) kalemler.push([urunId, adet]);
  }
  return kalemler;
}

/**
 * Bağışı sunucuda kaydeder: fiyatlar veritabanından okunur, toplam burada
 * hesaplanır, gerçek ad gizli tabloya yazılır ve bağışçıya 24 saat geçerli
 * imzalı bir düzenleme token'ı döner.
 */
export async function POST(req: Request) {
  let govde: Record<string, unknown>;
  try {
    const ham: unknown = await req.json();
    if (typeof ham !== "object" || ham === null) throw new Error("govde");
    govde = ham as Record<string, unknown>;
  } catch {
    return hata("Geçersiz istek.", 400);
  }

  const gercekAd = metinTemizle(govde.ad_soyad, AD_SOYAD_SINIRI);
  if (gercekAd.length < 2) {
    return hata("Lütfen adınızı ve soyadınızı giriniz.", 400);
  }

  const kalemler = sepetiCoz(govde.sepet);
  if (!kalemler) return hata("Sepet bilgisi geçersiz.", 400);

  // nakdi_tutar ve toplam_tutar sütunları tam sayı (₺) tutar.
  const nakdiHam = Number(govde.nakdi_tutar ?? 0);
  if (!Number.isFinite(nakdiHam) || nakdiHam < 0 || nakdiHam > EN_FAZLA_NAKDI) {
    return hata("Nakdi tutar geçersiz.", 400);
  }
  const nakdiTutar = Math.round(nakdiHam);

  const admin = supabaseAdminOlustur();
  if (!admin) return hata("Sunucu yapılandırma hatası.", 500);

  try {
    // Fiyatları istemciden değil, veritabanından al.
    let urunlerToplami = 0;
    const detaylar: { urun_id: number; adet: number; o_anki_fiyat: number }[] =
      [];

    if (kalemler.length > 0) {
      const { data: urunler, error: urunHata } = await admin
        .from("urunler")
        .select("id, fiyat")
        .eq("aktif", true)
        .in(
          "id",
          kalemler.map(([urunId]) => urunId)
        );
      if (urunHata) throw urunHata;

      const fiyatlar = new Map<number, number>(
        (urunler ?? []).map((u) => [Number(u.id), Number(u.fiyat)])
      );

      for (const [urunId, adet] of kalemler) {
        const fiyat = fiyatlar.get(urunId);
        if (fiyat === undefined) {
          return hata("Sepetinizdeki bir ürün artık listede değil.", 400);
        }
        urunlerToplami += fiyat * adet;
        detaylar.push({ urun_id: urunId, adet, o_anki_fiyat: fiyat });
      }
    }

    // Tutar belirtilmeden yapılan serbest bağışlar 0 ₺ ile kaydedilir.
    const toplamTutar = urunlerToplami + nakdiTutar;

    const { data: bagis, error: bagisHata } = await admin
      .from("bagislar")
      .insert({
        ...herkeseAcikAlanlar({
          ad_soyad: gercekAd,
          instagram: instagramTemizle(govde.instagram_kullanici_adi),
          mesaj: metinTemizle(govde.mesaj, MESAJ_SINIRI),
          anonim: govde.is_anonymous === true,
        }),
        nakdi_tutar: nakdiTutar,
        toplam_tutar: toplamTutar,
      })
      .select("id")
      .single();
    if (bagisHata || !bagis) throw bagisHata ?? new Error("Bağış kaydedilemedi");

    const bagisId = Number(bagis.id);

    if (detaylar.length > 0) {
      const { error: detayHata } = await admin
        .from("bagis_detaylari")
        .insert(detaylar.map((d) => ({ ...d, bagis_id: bagisId })));

      if (detayHata) {
        // Yarım kalan kaydı geri al ki tekrar denemede çift kayıt oluşmasın.
        await admin.from("bagislar").delete().eq("id", bagisId);
        throw detayHata;
      }
    }

    await gercekAdiSakla(admin, bagisId, gercekAd);

    return NextResponse.json({
      success: true,
      id: bagisId,
      ...duzenlemeTokeniUret(bagisId),
    });
  } catch (err) {
    console.error("Bağış kayıt hatası:", err);
    return hata("Bağış kaydedilemedi.", 500);
  }
}
