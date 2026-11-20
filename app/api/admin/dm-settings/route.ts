import { NextResponse } from "next/server";
import { govdeOku, hata, yoneticiDogrula } from "@/lib/server/adminYetki";
import {
  ayarlariKaydet,
  ayarlariOku,
  gecmisiOku,
  gecmisiTemizle,
  maskele,
  type DmAyarlar,
} from "@/lib/dmStorage";


const GIZLI_ALANLAR = ["openrouter_api_key", "instagram_access_token"] as const;

function istemciyeHazirla(ayar: DmAyarlar) {
  return {
    ...ayar,
    openrouter_api_key: maskele(ayar.openrouter_api_key),
    instagram_access_token: maskele(ayar.instagram_access_token),
    env_openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    env_instagram: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN),
  };
}

export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const [ayarlar, gecmis] = await Promise.all([ayarlariOku(), gecmisiOku()]);
  return NextResponse.json({ ayarlar: istemciyeHazirla(ayarlar), gecmis });
}

export async function POST(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  if (!govde) return hata("Geçersiz istek.", 400);

  try {
    if (govde.islem === "gecmisi_temizle") {
      await gecmisiTemizle();
      return NextResponse.json({ success: true, gecmis: [] });
    }

    const yeni: Partial<DmAyarlar> = {};
    if (typeof govde.aktif === "boolean") yeni.aktif = govde.aktif;
    if (govde.gecikme_saniye !== undefined) yeni.gecikme_saniye = Number(govde.gecikme_saniye);
    if (typeof govde.guncel_durum === "string") yeni.guncel_durum = govde.guncel_durum.slice(0, 3000);
    if (typeof govde.sistem_talimati === "string") yeni.sistem_talimati = govde.sistem_talimati.slice(0, 10000);
    if (typeof govde.instagram_verify_token === "string") {
      yeni.instagram_verify_token = govde.instagram_verify_token.trim().slice(0, 200);
    }
    for (const alan of GIZLI_ALANLAR) {
      const deger = govde[alan];
      // Maskeli değer (••••) geri gelirse mevcut anahtar korunur.
      if (typeof deger === "string" && !deger.startsWith("••••")) {
        yeni[alan] = deger.trim().slice(0, 2000);
      }
    }

    const kayitli = await ayarlariKaydet(yeni);
    return NextResponse.json({ success: true, ayarlar: istemciyeHazirla(kayitli) });
  } catch (err) {
    console.error("DM ayarları kaydedilemedi:", err);
    return hata(err instanceof Error ? err.message : "Ayarlar kaydedilemedi.", 500);
  }
}
