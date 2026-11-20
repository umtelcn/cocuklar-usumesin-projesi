import { NextResponse } from "next/server";
import { hata, yoneticiDogrula } from "@/lib/server/adminYetki";
import { ayarlariOku, etkinAnahtarlar } from "@/lib/dmStorage";

type HamModel = {
  id?: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
};

export type ModelOzeti = {
  id: string;
  ad: string;
  baglam: number | null;
  /** 1M token başına USD (girdi / çıktı). */
  girdi_fiyat: number | null;
  cikti_fiyat: number | null;
  ucretsiz: boolean;
};

function milyonBasina(deger: string | undefined): number | null {
  const sayi = Number(deger);
  return Number.isFinite(sayi) ? Math.round(sayi * 1_000_000 * 1000) / 1000 : null;
}

/** OpenRouter'daki güncel model listesini döndürür (metin üretebilen modeller). */
export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const { openrouter } = etkinAnahtarlar(await ayarlariOku());

  let veri: { data?: HamModel[] } | null = null;
  try {
    const yanit = await fetch("https://openrouter.ai/api/v1/models", {
      headers: openrouter ? { Authorization: `Bearer ${openrouter}` } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!yanit.ok) return hata(`OpenRouter model listesi alınamadı (${yanit.status}).`, 502);
    veri = await yanit.json();
  } catch (err) {
    console.error("OpenRouter modelleri alınamadı:", err);
    return hata("OpenRouter'a ulaşılamadı.", 502);
  }

  const modeller: ModelOzeti[] = (veri?.data ?? [])
    .filter((m): m is HamModel & { id: string } => typeof m.id === "string" && m.id.length > 0)
    .filter((m) => {
      const cikti = m.architecture?.output_modalities;
      return !cikti || cikti.includes("text");
    })
    .map((m) => {
      const girdi = milyonBasina(m.pricing?.prompt);
      const cikti = milyonBasina(m.pricing?.completion);
      return {
        id: m.id,
        ad: m.name || m.id,
        baglam: typeof m.context_length === "number" ? m.context_length : null,
        girdi_fiyat: girdi,
        cikti_fiyat: cikti,
        ucretsiz: girdi === 0 && cikti === 0,
      };
    })
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

  return NextResponse.json({ data: modeller });
}
