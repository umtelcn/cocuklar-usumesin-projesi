import { NextResponse } from "next/server";
import { govdeOku, hata, yoneticiDogrula } from "@/lib/server/adminYetki";

/**
 * Yönetici için imzalı yükleme adresi üretir. Dosya tarayıcıdan doğrudan
 * Storage'a gider (büyük videolar sunucu gövde sınırına takılmaz), ancak
 * adres yalnızca doğrulanmış yöneticiye ve izin verilen uzantılara verilir.
 */
const IZINLER: Record<string, { klasor: string; uzantilar: string[] }> = {
  hikayeler: {
    klasor: "gonderiler",
    uzantilar: ["jpg", "jpeg", "png", "webp", "mp4", "mov"],
  },
  "urun-gorselleri": {
    klasor: "urunler",
    uzantilar: ["jpg", "jpeg", "png", "webp"],
  },
};

export async function POST(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  if (!govde) return hata("Geçersiz istek.", 400);

  const bucket = typeof govde.bucket === "string" ? govde.bucket : "";
  const izin = IZINLER[bucket];
  if (!izin) return hata("Bu klasöre yükleme yapılamaz.", 400);

  const dosyaAdi = typeof govde.dosyaAdi === "string" ? govde.dosyaAdi : "";
  const uzanti = (dosyaAdi.split(".").pop() || "").toLowerCase();
  if (!izin.uzantilar.includes(uzanti)) {
    return hata(
      `Desteklenmeyen dosya türü. İzin verilenler: ${izin.uzantilar.join(", ")}`,
      400
    );
  }

  const yol = `${izin.klasor}/${Date.now()}-${crypto.randomUUID()}.${uzanti}`;
  const { data, error } = await yetki.admin.storage
    .from(bucket)
    .createSignedUploadUrl(yol);
  if (error || !data) {
    console.error("İmzalı yükleme adresi üretilemedi:", error);
    return hata("Yükleme başlatılamadı.", 500);
  }

  const {
    data: { publicUrl },
  } = yetki.admin.storage.from(bucket).getPublicUrl(data.path);

  return NextResponse.json({ path: data.path, token: data.token, publicUrl });
}
