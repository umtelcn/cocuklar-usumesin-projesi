import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dosyalariSil,
  govdeOku,
  hata,
  metin,
  sayiKimlik,
  tamSayi,
  yoneticiDogrula,
} from "@/lib/server/adminYetki";

const TABLO = "urunler";
const BUCKET = "urun-gorselleri";
const ALANLAR = "id, ad, fiyat, gorsel_yolu, aktif, sira";

function gorselUrl(deger: unknown): string | null {
  return typeof deger === "string" && /^https?:\/\//i.test(deger.trim())
    ? deger.trim().slice(0, 1000)
    : null;
}

/** Gövdedeki ürün alanlarını doğrular; hata varsa mesaj döner. */
function alanlariOku(
  govde: Record<string, unknown>,
  zorunlu: boolean
): { alanlar: Record<string, unknown> } | { hata: string } {
  const alanlar: Record<string, unknown> = {};

  if (zorunlu || "ad" in govde) {
    const ad = metin(govde.ad, 120);
    if (!ad) return { hata: "Ürün adı boş olamaz." };
    alanlar.ad = ad;
  }
  if (zorunlu || "fiyat" in govde) {
    const fiyat = tamSayi(govde.fiyat, { min: 0, max: 10_000_000 });
    if (fiyat === null) return { hata: "Fiyat geçersiz." };
    alanlar.fiyat = fiyat;
  }
  if (zorunlu || "sira" in govde) {
    const sira = tamSayi(govde.sira ?? 0);
    if (sira === null) return { hata: "Sıra numarası geçersiz." };
    alanlar.sira = sira;
  }
  if (zorunlu || "gorsel_yolu" in govde) {
    const gorsel = gorselUrl(govde.gorsel_yolu);
    if (!gorsel) return { hata: "Ürün görseli gerekli." };
    alanlar.gorsel_yolu = gorsel;
  }
  if ("aktif" in govde) {
    if (typeof govde.aktif !== "boolean") return { hata: "Durum geçersiz." };
    alanlar.aktif = govde.aktif;
  } else if (zorunlu) {
    alanlar.aktif = true;
  }
  return { alanlar };
}

/** Görseli başka bir ürün kullanmıyorsa Storage'dan kaldırır. */
async function kullanilmayanGorseliSil(admin: SupabaseClient, url: string) {
  const { count, error } = await admin
    .from(TABLO)
    .select("id", { count: "exact", head: true })
    .eq("gorsel_yolu", url);
  if (!error && count === 0) await dosyalariSil(admin, BUCKET, [url]);
}

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const { data, error } = await yetki.admin
    .from(TABLO)
    .select(ALANLAR)
    .order("sira", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    console.error("Ürünler okunamadı:", error);
    return hata("Ürünler yüklenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  if (!govde) return hata("Geçersiz istek.", 400);

  const sonuc = alanlariOku(govde, true);
  if ("hata" in sonuc) return hata(sonuc.hata, 400);

  const { data, error } = await yetki.admin
    .from(TABLO)
    .insert(sonuc.alanlar)
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("Ürün eklenemedi:", error);
    return hata("Ürün eklenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const govde = await govdeOku(req);
  const id = sayiKimlik(govde?.id);
  if (!govde || !id) return hata("Geçersiz ürün.", 400);

  const sonuc = alanlariOku(govde, false);
  if ("hata" in sonuc) return hata(sonuc.hata, 400);
  if (Object.keys(sonuc.alanlar).length === 0) return hata("Değişiklik yok.", 400);

  // Görsel değişiyorsa eski dosyayı sonradan temizlemek için önce oku.
  let eskiGorsel: string | null = null;
  if ("gorsel_yolu" in sonuc.alanlar) {
    const { data: eski } = await admin
      .from(TABLO)
      .select("gorsel_yolu")
      .eq("id", id)
      .maybeSingle();
    eskiGorsel = eski?.gorsel_yolu ?? null;
  }

  const { data, error } = await admin
    .from(TABLO)
    .update(sonuc.alanlar)
    .eq("id", id)
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("Ürün güncellenemedi:", error);
    return hata("Ürün güncellenemedi.", 500);
  }

  if (eskiGorsel && eskiGorsel !== data.gorsel_yolu) {
    await kullanilmayanGorseliSil(admin, eskiGorsel);
  }
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const id = sayiKimlik(new URL(req.url).searchParams.get("id"));
  if (!id) return hata("Geçersiz ürün.", 400);

  const { data, error } = await admin
    .from(TABLO)
    .delete()
    .eq("id", id)
    .select("gorsel_yolu")
    .maybeSingle();
  if (error) {
    // 23503: bu ürüne bağlı bağış detayları var (foreign key).
    if (error.code === "23503") {
      return hata(
        "Bu ürüne ait geçmiş bağış kayıtları olduğu için silinemez. Bunun yerine ürünü pasif yapın.",
        409
      );
    }
    console.error("Ürün silinemedi:", error);
    return hata("Ürün silinemedi.", 500);
  }
  if (data?.gorsel_yolu) await kullanilmayanGorseliSil(admin, data.gorsel_yolu);
  return NextResponse.json({ success: true });
}
