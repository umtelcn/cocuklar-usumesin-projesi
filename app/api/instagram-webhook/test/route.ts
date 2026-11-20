import { NextResponse } from "next/server";
import { govdeOku, hata, yoneticiDogrula } from "@/lib/server/adminYetki";
import { ayarlariOku, cevapUret, gecmiseEkle, INSANA_DEVRET } from "@/lib/dmStorage";


/** Admin panelindeki Canlı Test Sohbeti: yalnızca yöneticiler kullanabilir. */
export async function POST(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;

  const govde = await govdeOku(req);
  const mesaj = typeof govde?.mesaj === "string" ? govde.mesaj.trim().slice(0, 2000) : "";
  if (!mesaj) return hata("Mesaj boş olamaz.", 400);

  const ayar = await ayarlariOku();
  try {
    const cevap = await cevapUret(ayar, mesaj);
    const devret = cevap.includes(INSANA_DEVRET);
    const kayit = await gecmiseEkle({
      gonderen_id: "admin-test",
      kullanici_mesaji: mesaj,
      ai_cevabi: cevap,
      durum: "test",
      not: devret ? "Gerçekte insana devredilirdi" : undefined,
    });
    return NextResponse.json({ cevap, insana_devret: devret, kayit });
  } catch (err) {
    console.error("DM test cevabı üretilemedi:", err);
    return hata(err instanceof Error ? err.message : "Cevap üretilemedi.", 502);
  }
}
