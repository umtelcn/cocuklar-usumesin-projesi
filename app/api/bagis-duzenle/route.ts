import { NextResponse } from "next/server";
import { supabaseAdminOlustur } from "@/lib/server/supabaseAdmin";
import { duzenlemeTokeniGecerliMi } from "@/lib/server/duzenlemeToken";
import {
  AD_SOYAD_SINIRI,
  MESAJ_SINIRI,
  gercekAdiGetir,
  gercekAdiSakla,
  herkeseAcikAlanlar,
  instagramTemizle,
  metinTemizle,
} from "@/lib/server/bagisDogrulama";

function hata(mesaj: string, durum: number) {
  return NextResponse.json({ error: mesaj }, { status: durum });
}

/**
 * Bağışçının kendi kartını düzenlemesi. Yalnızca bağış anında verilen,
 * bu bağışa ait ve süresi dolmamış imzalı token ile çalışır.
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

  const bagisId = Number(govde.id);
  if (!Number.isSafeInteger(bagisId) || bagisId <= 0) {
    return hata("Geçersiz bağış ID", 400);
  }

  const admin = supabaseAdminOlustur();
  if (!admin) return hata("Sunucu yapılandırma hatası.", 500);

  if (!duzenlemeTokeniGecerliMi(bagisId, govde.token)) {
    return hata("Düzenleme süresi dolmuş veya yetkiniz yok.", 403);
  }

  const adSoyad = metinTemizle(govde.ad_soyad, AD_SOYAD_SINIRI);
  const anonim = govde.is_anonymous === true;

  try {
    // Anonimde ad alanı kapalı gelir; baş harfler gizli kayıttaki addan üretilir.
    const acikAd = anonim && !adSoyad ? await gercekAdiGetir(admin, bagisId) : adSoyad;

    const { data, error } = await admin
      .from("bagislar")
      .update(
        herkeseAcikAlanlar({
          ad_soyad: acikAd,
          instagram: instagramTemizle(govde.instagram_kullanici_adi),
          mesaj: metinTemizle(govde.mesaj, MESAJ_SINIRI),
          anonim,
        })
      )
      .eq("id", bagisId)
      .select("id, ad_soyad, instagram_kullanici_adi, mesaj, is_anonymous")
      .single();
    if (error) throw error;

    // Ad girildiyse gizli kaydı da güncelle; anonimde boş gelirse eskisi korunur.
    await gercekAdiSakla(admin, bagisId, adSoyad);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Bağış güncelleme hatası:", err);
    return hata("Bilgiler güncellenemedi.", 500);
  }
}
