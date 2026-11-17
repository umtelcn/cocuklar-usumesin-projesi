import { NextResponse } from "next/server";
import {
  govdeOku,
  hata,
  metin,
  tamSayi,
  uuidKimlik,
  yoneticiDogrula,
} from "@/lib/server/adminYetki";

const TABLO = "sikca_sorulan_sorular";
const ALANLAR = "id, soru, cevap, sira, created_at";

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const { data, error } = await yetki.admin
    .from(TABLO)
    .select(ALANLAR)
    .order("sira", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("SSS okunamadı:", error);
    return hata("Sorular yüklenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  if (!govde) return hata("Geçersiz istek.", 400);

  const soru = metin(govde.soru, 500);
  const cevap = metin(govde.cevap, 5000);
  if (!soru || !cevap) return hata("Soru ve cevap boş olamaz.", 400);

  const { data, error } = await yetki.admin
    .from(TABLO)
    .insert({ soru, cevap, sira: tamSayi(govde.sira) ?? 0 })
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("SSS eklenemedi:", error);
    return hata("Soru eklenemedi.", 500);
  }
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  const id = uuidKimlik(govde?.id);
  if (!govde || !id) return hata("Geçersiz soru.", 400);

  const guncelleme: Record<string, unknown> = {};
  if ("soru" in govde) {
    const soru = metin(govde.soru, 500);
    if (!soru) return hata("Soru boş olamaz.", 400);
    guncelleme.soru = soru;
  }
  if ("cevap" in govde) {
    const cevap = metin(govde.cevap, 5000);
    if (!cevap) return hata("Cevap boş olamaz.", 400);
    guncelleme.cevap = cevap;
  }
  if ("sira" in govde) {
    const sira = tamSayi(govde.sira);
    if (sira === null) return hata("Sıra numarası geçersiz.", 400);
    guncelleme.sira = sira;
  }
  if (Object.keys(guncelleme).length === 0) return hata("Değişiklik yok.", 400);

  const { data, error } = await yetki.admin
    .from(TABLO)
    .update(guncelleme)
    .eq("id", id)
    .select(ALANLAR)
    .single();
  if (error) {
    console.error("SSS güncellenemedi:", error);
    return hata("Soru güncellenemedi.", 500);
  }
  return NextResponse.json({ data });
}

/** Sıralamayı topluca kaydeder: gövde `{ siralama: [id, id, ...] }` → sira 1..n. */
export async function PUT(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin } = yetki;

  const govde = await govdeOku(req);
  const liste = Array.isArray(govde?.siralama) ? govde.siralama : null;
  const idler = (liste ?? []).map(uuidKimlik);
  if (!liste || idler.length === 0 || idler.length > 200 || idler.some((i) => !i)) {
    return hata("Geçersiz sıralama.", 400);
  }

  const sonuclar = await Promise.all(
    idler.map((id, index) =>
      admin
        .from(TABLO)
        .update({ sira: index + 1 })
        .eq("id", id as string)
    )
  );
  const ilkHata = sonuclar.find((s) => s.error)?.error;
  if (ilkHata) {
    console.error("SSS sıralaması kaydedilemedi:", ilkHata);
    return hata("Sıralama kaydedilemedi.", 500);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const id = uuidKimlik(new URL(req.url).searchParams.get("id"));
  if (!id) return hata("Geçersiz soru.", 400);

  const { error } = await yetki.admin.from(TABLO).delete().eq("id", id);
  if (error) {
    console.error("SSS silinemedi:", error);
    return hata("Soru silinemedi.", 500);
  }
  return NextResponse.json({ success: true });
}
