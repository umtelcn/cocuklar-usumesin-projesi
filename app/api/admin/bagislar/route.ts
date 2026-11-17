import { NextResponse } from "next/server";
import {
  aramaTemizle,
  govdeOku,
  hata,
  metin,
  sayiKimlik,
  tamSayi,
  yoneticiDogrula,
} from "@/lib/server/adminYetki";
import {
  AD_SOYAD_SINIRI,
  MESAJ_SINIRI,
  herkeseAcikAlanlar,
  instagramTemizle,
} from "@/lib/server/bagisDogrulama";

const SAYFA_BOYUTU = 20;
const GIZLI_TABLO = "bagis_gizli_bilgiler";
const ALANLAR =
  "id, created_at, ad_soyad, instagram_kullanici_adi, mesaj, nakdi_tutar, toplam_tutar, is_anonymous";

type Detay = {
  id: number;
  bagis_id: number;
  urun_id: number;
  adet: number;
  o_anki_fiyat: number;
};

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const parametreler = new URL(req.url).searchParams;
  const arama = aramaTemizle(parametreler.get("q"));
  const baslangic = tamSayi(parametreler.get("baslangic")) ?? 0;

  let sorgu = admin
    .from("bagislar")
    .select(ALANLAR, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(baslangic, baslangic + SAYFA_BOYUTU - 1);

  if (arama) {
    const desen = `*${arama}*`;
    const kosullar = [
      `ad_soyad.ilike.${desen}`,
      `instagram_kullanici_adi.ilike.${desen}`,
      `mesaj.ilike.${desen}`,
    ];
    if (/^\d{1,15}$/.test(arama)) kosullar.push(`id.eq.${arama}`);

    // Anonim bağışların gerçek adında da ara.
    const { data: gizliEslesmeler } = await admin
      .from(GIZLI_TABLO)
      .select("bagis_id")
      .ilike("gercek_ad_soyad", `%${arama}%`)
      .limit(200);
    const gizliIdler = (gizliEslesmeler ?? []).map((g) => g.bagis_id);
    if (gizliIdler.length > 0) kosullar.push(`id.in.(${gizliIdler.join(",")})`);

    sorgu = sorgu.or(kosullar.join(","));
  }

  const { data: bagislar, error, count } = await sorgu;
  if (error) {
    console.error("Bağışlar okunamadı:", error);
    return hata("Bağışlar yüklenemedi.", 500);
  }

  const idler = (bagislar ?? []).map((b) => b.id);
  let detaylar: Detay[] = [];
  let gizliler: { bagis_id: number; gercek_ad_soyad: string }[] = [];
  let urunAdlari = new Map<number, string>();

  if (idler.length > 0) {
    const [detaySonucu, gizliSonucu, urunSonucu] = await Promise.all([
      admin
        .from("bagis_detaylari")
        .select("id, bagis_id, urun_id, adet, o_anki_fiyat")
        .in("bagis_id", idler),
      admin
        .from(GIZLI_TABLO)
        .select("bagis_id, gercek_ad_soyad")
        .in("bagis_id", idler),
      admin.from("urunler").select("id, ad"),
    ]);
    if (detaySonucu.error) console.error("Bağış detayları okunamadı:", detaySonucu.error);
    if (gizliSonucu.error) console.error("Gizli bilgiler okunamadı:", gizliSonucu.error);
    detaylar = detaySonucu.data ?? [];
    gizliler = gizliSonucu.data ?? [];
    urunAdlari = new Map((urunSonucu.data ?? []).map((u) => [u.id, u.ad]));
  }

  const gizliHarita = new Map(gizliler.map((g) => [g.bagis_id, g.gercek_ad_soyad]));
  const data = (bagislar ?? []).map((b) => ({
    ...b,
    gercek_ad_soyad: gizliHarita.get(b.id) ?? null,
    urunler: detaylar
      .filter((d) => d.bagis_id === b.id)
      .map((d) => ({
        id: d.id,
        urun_id: d.urun_id,
        ad: urunAdlari.get(d.urun_id) ?? `Ürün #${d.urun_id}`,
        adet: d.adet,
        o_anki_fiyat: d.o_anki_fiyat,
      })),
  }));

  return NextResponse.json({ data, toplam: count ?? 0, sayfaBoyutu: SAYFA_BOYUTU });
}

export async function PATCH(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const govde = await govdeOku(req);
  const id = sayiKimlik(govde?.id);
  if (!govde || !id) return hata("Geçersiz bağış.", 400);

  const anonim = govde.is_anonymous === true;
  const gercekAd = metin(govde.gercek_ad_soyad, AD_SOYAD_SINIRI);

  const { data, error } = await admin
    .from("bagislar")
    .update(
      herkeseAcikAlanlar({
        ad_soyad: metin(govde.ad_soyad, AD_SOYAD_SINIRI),
        instagram: instagramTemizle(govde.instagram_kullanici_adi),
        mesaj: metin(govde.mesaj, MESAJ_SINIRI),
        anonim,
      })
    )
    .eq("id", id)
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("Bağış güncellenemedi:", error);
    return hata("Bağış güncellenemedi.", 500);
  }

  const gizliSonucu = gercekAd
    ? await admin
        .from(GIZLI_TABLO)
        .upsert(
          { bagis_id: id, gercek_ad_soyad: gercekAd },
          { onConflict: "bagis_id" }
        )
    : await admin.from(GIZLI_TABLO).delete().eq("bagis_id", id);
  if (gizliSonucu.error) {
    console.error("Gerçek ad güncellenemedi:", gizliSonucu.error);
    return hata("Bağış güncellendi ancak gerçek ad kaydedilemedi.", 500);
  }

  return NextResponse.json({ data: { ...data, gercek_ad_soyad: gercekAd || null } });
}

export async function DELETE(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const id = sayiKimlik(new URL(req.url).searchParams.get("id"));
  if (!id) return hata("Geçersiz bağış.", 400);

  // Önce bağlı kayıtlar silinir (foreign key), ardından bağışın kendisi.
  const detay = await admin.from("bagis_detaylari").delete().eq("bagis_id", id);
  if (detay.error) {
    console.error("Bağış detayları silinemedi:", detay.error);
    return hata("Bağış silinemedi.", 500);
  }
  const gizli = await admin.from(GIZLI_TABLO).delete().eq("bagis_id", id);
  if (gizli.error) console.warn("Gizli bilgi silinemedi:", gizli.error.message);

  const { error } = await admin.from("bagislar").delete().eq("id", id);
  if (error) {
    console.error("Bağış silinemedi:", error);
    return hata("Bağış silinemedi.", 500);
  }
  return NextResponse.json({ success: true });
}
