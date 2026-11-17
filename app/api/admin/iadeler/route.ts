import { NextResponse } from "next/server";
import {
  aramaTemizle,
  govdeOku,
  hata,
  uuidKimlik,
  yoneticiDogrula,
} from "@/lib/server/adminYetki";

const TABLO = "iade_talepleri";
const DURUMLAR = ["beklemede", "tamamlandi", "reddedildi"];

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const parametreler = new URL(req.url).searchParams;
  const durum = parametreler.get("durum") || "tumu";
  const arama = aramaTemizle(parametreler.get("q"));

  let sorgu = yetki.admin
    .from(TABLO)
    .select("id, ad_soyad, iban, tutar, mesaj, dekont_url, durum, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // Varsayılan değer "Bekliyor"; tamamlanmamış her kayıt beklemede sayılır.
  if (durum === "beklemede") {
    sorgu = sorgu.or("durum.is.null,durum.not.in.(tamamlandi,reddedildi,Reddedildi)");
  } else if (durum === "tamamlandi") {
    sorgu = sorgu.eq("durum", "tamamlandi");
  } else if (durum === "reddedildi") {
    sorgu = sorgu.in("durum", ["reddedildi", "Reddedildi"]);
  }

  if (arama) {
    const desen = `*${arama}*`;
    sorgu = sorgu.or(`ad_soyad.ilike.${desen},iban.ilike.${desen}`);
  }

  const { data, error } = await sorgu;
  if (error) {
    console.error("İade talepleri okunamadı:", error);
    return hata("İade talepleri yüklenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  const id = uuidKimlik(govde?.id);
  const durum = govde?.durum;
  if (!id) return hata("Geçersiz iade talebi.", 400);
  if (typeof durum !== "string" || !DURUMLAR.includes(durum)) {
    return hata("Geçersiz durum.", 400);
  }

  const { data, error } = await yetki.admin
    .from(TABLO)
    .update({ durum })
    .eq("id", id)
    .select("id, durum")
    .single();
  if (error) {
    console.error("İade talebi güncellenemedi:", error);
    return hata("İade talebi güncellenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const id = uuidKimlik(new URL(req.url).searchParams.get("id"));
  if (!id) return hata("Geçersiz iade talebi.", 400);

  const { error } = await yetki.admin.from(TABLO).delete().eq("id", id);
  if (error) {
    console.error("İade talebi silinemedi:", error);
    return hata("İade talebi silinemedi.", 500);
  }
  return NextResponse.json({ success: true });
}
