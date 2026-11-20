import { after, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ayarlariOku,
  cevapUret,
  etkinAnahtarlar,
  gecmiseEkle,
  INSANA_DEVRET,
} from "@/lib/dmStorage";

// Gecikme + yapay zeka + gönderim süresi için.
export const maxDuration = 60;

/** Meta webhook doğrulaması. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const mode = p.get("hub.mode");
  const token = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge") ?? "";

  const ayar = await ayarlariOku();
  const beklenen = ayar.instagram_verify_token || process.env.INSTAGRAM_VERIFY_TOKEN || "";
  if (mode === "subscribe" && beklenen && token === beklenen) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

/** INSTAGRAM_APP_SECRET tanımlıysa X-Hub-Signature-256 imzasını doğrular. */
function imzaGecerli(ham: string, imza: string | null): boolean {
  const sir = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;
  if (!sir) return true;
  if (!imza?.startsWith("sha256=")) return false;
  const beklenen = Buffer.from(`sha256=${createHmac("sha256", sir).update(ham).digest("hex")}`);
  const gelen = Buffer.from(imza);
  return beklenen.length === gelen.length && timingSafeEqual(beklenen, gelen);
}

type Mesajlasma = {
  sender?: { id?: string };
  message?: {
    text?: string;
    is_echo?: boolean;
    attachments?: unknown[];
  };
};

async function mesajGonder(token: string, aliciId: string, metin: string) {
  const yanit = await fetch("https://graph.instagram.com/v21.0/me/messages", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: aliciId }, message: { text: metin } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!yanit.ok) {
    const detay = await yanit.text().catch(() => "");
    throw new Error(`Instagram gönderim hatası (${yanit.status}): ${detay}`);
  }
}

async function isle(olay: Mesajlasma) {
  const mesaj = olay.message;
  const gonderen = olay.sender?.id ?? null;
  if (!mesaj || mesaj.is_echo || !gonderen) return;

  const metin = (mesaj.text ?? "").trim();

  // Görsel / dekont: cevap verilmez, ekip ilgilenir.
  if (Array.isArray(mesaj.attachments) && mesaj.attachments.length > 0) {
    await gecmiseEkle({
      gonderen_id: gonderen,
      kullanici_mesaji: metin || "[Görsel / ek gönderildi]",
      ai_cevabi: "",
      durum: "insana_devredildi",
      not: "Ek / dekont içeriyor",
    });
    return;
  }
  if (!metin) return;

  const ayar = await ayarlariOku();
  if (!ayar.aktif) return;

  try {
    const cevap = await cevapUret(ayar, metin);
    if (cevap.includes(INSANA_DEVRET)) {
      await gecmiseEkle({
        gonderen_id: gonderen,
        kullanici_mesaji: metin,
        ai_cevabi: cevap,
        durum: "insana_devredildi",
      });
      return;
    }

    const { instagram } = etkinAnahtarlar(ayar);
    if (!instagram) throw new Error("Instagram erişim anahtarı tanımlı değil.");

    await new Promise((r) => setTimeout(r, ayar.gecikme_saniye * 1000));
    await mesajGonder(instagram, gonderen, cevap);
    await gecmiseEkle({
      gonderen_id: gonderen,
      kullanici_mesaji: metin,
      ai_cevabi: cevap,
      durum: "cevaplandi",
    });
  } catch (err) {
    console.error("Instagram DM işlenemedi:", err);
    await gecmiseEkle({
      gonderen_id: gonderen,
      kullanici_mesaji: metin,
      ai_cevabi: "",
      durum: "hata",
      not: err instanceof Error ? err.message.slice(0, 300) : "Bilinmeyen hata",
    });
  }
}

export async function POST(req: Request) {
  const ham = await req.text();
  if (!imzaGecerli(ham, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let govde: { entry?: { messaging?: Mesajlasma[] }[] } | null = null;
  try {
    govde = JSON.parse(ham);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const olay = govde?.entry?.[0]?.messaging?.[0];
  // Meta'ya hemen 200 dönülür; gecikme ve cevap gönderimi yanıt sonrasında yapılır.
  if (olay) after(() => isle(olay));
  return NextResponse.json({ ok: true });
}
