import { NextResponse } from "next/server";
import {
  aramaTemizle,
  dosyalariSil,
  govdeOku,
  hata,
  sayiKimlik,
  tamSayi,
  yoneticiDogrula,
} from "@/lib/server/adminYetki";

const TABLO = "yardim_talepleri";
const SAYFA_BOYUTU = 20;
const DURUMLAR = ["beklemede", "incelendi", "tamamlandi"];

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const parametreler = new URL(req.url).searchParams;
  const durum = parametreler.get("durum") || "tumu";
  const arama = aramaTemizle(parametreler.get("q"));
  const baslangic = tamSayi(parametreler.get("baslangic")) ?? 0;

  let sorgu = yetki.admin
    .from(TABLO)
    .select(
      "id, created_at, ad_soyad, telefon, il, ilce, mesaj, gorsel_yollari, durum",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(baslangic, baslangic + SAYFA_BOYUTU - 1);

  // Eski kayıtlarda "Yeni Talep" gibi değerler var; tanınmayanlar beklemede sayılır.
  if (durum === "beklemede") {
    sorgu = sorgu.or("durum.is.null,durum.not.in.(incelendi,tamamlandi)");
  } else if (durum === "incelendi" || durum === "tamamlandi") {
    sorgu = sorgu.eq("durum", durum);
  }

  if (arama) {
    const desen = `*${arama}*`;
    sorgu = sorgu.or(
      `ad_soyad.ilike.${desen},il.ilike.${desen},ilce.ilike.${desen},telefon.ilike.${desen}`
    );
  }

  const { data, error, count } = await sorgu;
  if (error) {
    console.error("Yardım talepleri okunamadı:", error);
    return hata("Talepler yüklenemedi.", 500);
  }
  return NextResponse.json({
    data,
    toplam: count ?? 0,
    sayfaBoyutu: SAYFA_BOYUTU,
  });
}

export async function PATCH(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  const id = sayiKimlik(govde?.id);
  const durum = govde?.durum;
  if (!id) return hata("Geçersiz talep.", 400);
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
    console.error("Talep güncellenemedi:", error);
    return hata("Talep güncellenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const id = sayiKimlik(new URL(req.url).searchParams.get("id"));
  if (!id) return hata("Geçersiz talep.", 400);

  const { data, error } = await admin
    .from(TABLO)
    .delete()
    .eq("id", id)
    .select("gorsel_yollari")
    .maybeSingle();
  if (error) {
    console.error("Talep silinemedi:", error);
    return hata("Talep silinemedi.", 500);
  }
  // Başvuranın fotoğrafları kişisel veri içerir; kayıtla birlikte kaldırılır.
  if (data && Array.isArray(data.gorsel_yollari)) {
    await dosyalariSil(admin, "talep-gorselleri", data.gorsel_yollari);
  }
  return NextResponse.json({ success: true });
}
