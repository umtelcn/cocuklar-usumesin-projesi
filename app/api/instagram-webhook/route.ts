import { after, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ayarlariOku,
  cevapUret,
  etkinAnahtarlar,
  gecmisiOku,
  gecmiseEkle,
  gecmisKaydiGuncelle,
  hafizayaEkle,
  INSANA_DEVRET,
  kullaniciSohbeti,
} from "@/lib/dmStorage";

// Gecikme + yapay zeka (büyük modeller yavaş olabilir) + gönderim süresi için.
export const maxDuration = 120;

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
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
    attachments?: unknown[];
  };
};

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mesajGonder(token: string, aliciId: string, metin: string): Promise<string | undefined> {
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
  const veri = (await yanit.json().catch(() => null)) as { message_id?: string } | null;
  return veri?.message_id;
}

const metinEsit = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

/**
 * Yöneticinin telefondan elle yazdığı mesaj (echo): botun kendi gönderdiği
 * mesaj değilse, kullanıcının son sorusuyla birlikte hafızaya kaydedilir.
 */
async function echoIsle(olay: Mesajlasma) {
  const mesaj = olay.message;
  const kullaniciId = olay.recipient?.id;
  const metin = (mesaj?.text ?? "").trim();
  if (!mesaj || !kullaniciId || !metin) return;

  // Botun kendi gönderimi geçmişe yazılırken echo daha önce gelebilir; kısa süre beklenir.
  await bekle(6000);
  const gecmis = await gecmisiOku();
  const simdi = Date.now();

  const botunMesaji = gecmis.some(
    (k) =>
      (mesaj.mid && k.gonderilen_mid === mesaj.mid) ||
      (k.gonderen_id === kullaniciId &&
        k.durum === "cevaplandi" &&
        metinEsit(k.ai_cevabi, metin) &&
        simdi - Date.parse(k.tarih) < 10 * 60 * 1000)
  );
  if (botunMesaji) return;

  const sonSoru = gecmis.find(
    (k) =>
      k.gonderen_id === kullaniciId &&
      k.kullanici_mesaji &&
      !k.kullanici_mesaji.startsWith("[Görsel") &&
      simdi - Date.parse(k.tarih) < 48 * 60 * 60 * 1000
  );
  if (!sonSoru) return;

  // Yönetici art arda birden çok mesaj yazdıysa cevaplar birleştirilir.
  const dogruCevap = sonSoru.admin_cevabi ? `${sonSoru.admin_cevabi}\n${metin}` : metin;
  try {
    await hafizayaEkle(sonSoru.kullanici_mesaji, dogruCevap, "instagram_admin");
    await gecmisKaydiGuncelle(sonSoru.id, { admin_cevabi: dogruCevap });
  } catch (err) {
    console.error("Yönetici cevabı hafızaya kaydedilemedi:", err);
  }
}

async function mesajIsle(olay: Mesajlasma) {
  const mesaj = olay.message;
  const gonderen = olay.sender?.id ?? null;
  if (!mesaj || !gonderen) return;

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
    const sohbet = kullaniciSohbeti(await gecmisiOku(), gonderen);
    const cevap = await cevapUret(ayar, metin, sohbet);
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

    await bekle(ayar.gecikme_saniye * 1000);
    const mid = await mesajGonder(instagram, gonderen, cevap);
    await gecmiseEkle({
      gonderen_id: gonderen,
      kullanici_mesaji: metin,
      ai_cevabi: cevap,
      durum: "cevaplandi",
      gonderilen_mid: mid,
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

  // Meta birden çok olayı tek istekte gönderebilir; hepsi sırayla işlenir.
  const olaylar = (govde?.entry ?? []).flatMap((e) => e.messaging ?? []).filter((o) => o.message);
  // Meta'ya hemen 200 dönülür; gecikme ve cevap gönderimi yanıt sonrasında yapılır.
  if (olaylar.length) {
    after(async () => {
      for (const olay of olaylar) {
        await (olay.message?.is_echo ? echoIsle(olay) : mesajIsle(olay));
      }
    });
  }
  return NextResponse.json({ ok: true });
}
