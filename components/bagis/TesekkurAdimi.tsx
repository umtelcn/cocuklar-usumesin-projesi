"use client";

import { useState, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import { paraFormati } from "@/lib/format";
import { panoyaKopyala } from "@/lib/pano";
import MaviTik from "@/components/ui/MaviTik";
import {
  faGift,
  faArrowLeft,
  faLink,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { Urun } from "./types";

interface TesekkurAdimiProps {
  adSoyad?: string;
  urunler?: Urun[];
  sepet?: Record<number, number>;
  nakdiTutar?: string;
  anaSayfayaDon: () => void;
}

function isimFormatla(hamIsim?: string) {
  if (!hamIsim || hamIsim.trim().length === 0) return "Değerli Bağışçımız";
  return hamIsim
    .trim()
    .split(/\s+/)
    .map(
      (kelime) =>
        kelime.charAt(0).toLocaleUpperCase("tr-TR") +
        kelime.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
}

const YAZI_TIPI = "sans-serif";

/** Metni, verilen genişliğe sığacak şekilde kelime kelime satırlara böler. */
function satirlaraBol(
  ctx: CanvasRenderingContext2D,
  metin: string,
  enFazlaGenislik: number
): string[] {
  const satirlar: string[] = [];
  let satir = "";
  for (const kelime of metin.split(/\s+/).filter(Boolean)) {
    const aday = satir ? `${satir} ${kelime}` : kelime;
    if (!satir || ctx.measureText(aday).width <= enFazlaGenislik) {
      satir = aday;
    } else {
      satirlar.push(satir);
      satir = kelime;
    }
  }
  if (satir) satirlar.push(satir);
  return satirlar;
}

/** Tek satıra sığmayan metni "…" ile kısaltır. */
function sigdir(
  ctx: CanvasRenderingContext2D,
  metin: string,
  enFazlaGenislik: number
): string {
  if (ctx.measureText(metin).width <= enFazlaGenislik) return metin;
  let kisa = metin;
  while (
    kisa.length > 1 &&
    ctx.measureText(`${kisa}…`).width > enFazlaGenislik
  ) {
    kisa = kisa.slice(0, -1);
  }
  return `${kisa.trimEnd()}…`;
}

/** Bağış kalemlerini " • " ile birleştirerek genişliğe sığan satırlara dizer. */
function kalemleriDiz(
  ctx: CanvasRenderingContext2D,
  kalemler: string[],
  enFazlaGenislik: number
): string[] {
  const AYRAC = "   •   ";
  const satirlar: string[] = [];
  let satir = "";
  for (const ham of kalemler) {
    const kalem = sigdir(ctx, ham, enFazlaGenislik);
    const aday = satir ? `${satir}${AYRAC}${kalem}` : kalem;
    if (!satir || ctx.measureText(aday).width <= enFazlaGenislik) {
      satir = aday;
    } else {
      satirlar.push(satir);
      satir = kalem;
    }
  }
  if (satir) satirlar.push(satir);
  return satirlar;
}

export default function TesekkurAdimi({
  adSoyad,
  urunler = [],
  sepet = {},
  nakdiTutar = "",
  anaSayfayaDon,
}: TesekkurAdimiProps) {
  const [storyHazirlaniyor, setStoryHazirlaniyor] = useState(false);
  const [kopyaBildirimi, setKopyaBildirimi] = useState(false);

  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `tesekkur-gradyan-${benzersizId}`;

  const seciliUrunler = urunler.filter((u) => (sepet[u.id] || 0) > 0);
  const nakdiSayi = Number(nakdiTutar) || 0;
  const duzenliIsim = isimFormatla(adSoyad);

  const aktifOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const paylasimLinki =
    aktifOrigin && !aktifOrigin.includes("localhost")
      ? aktifOrigin
      : "https://www.cocuklarusumesindestek.com";
  const gorunenSiteAdi = "cocuklarusumesindestek.com";

  const paylasimMetni = `Bugün Çocuklar Üşümesin Derneği aracılığıyla bir çocuğumuzun kışına güneş oldum ☀️ Siz de bir çocuğun hayaline ortak olmak için tıklayın: ${paylasimLinki}`;

  const whatsappPaylas = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(paylasimMetni)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const linkiKopyala = async (sureMs = 2500) => {
    // "Kopyalandı" yalnızca kopyalama gerçekten başarılıysa gösterilir.
    if (!(await panoyaKopyala(paylasimLinki))) return;
    setKopyaBildirimi(true);
    setTimeout(() => setKopyaBildirimi(false), sureMs);
  };

  const instagramHikayePaylas = async () => {
    setStoryHazirlaniyor(true);
    try {
      await linkiKopyala(3500);

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Arka plan
        ctx.fillStyle = "#F4F8FB";
        ctx.fillRect(0, 0, 1080, 1920);

        // Beyaz Kart
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(80, 300, 920, 1320, 56);
        ctx.fill();

        // 1. Dernek Adı
        ctx.textAlign = "center";
        ctx.fillStyle = "#1F2937";
        ctx.font = "600 42px sans-serif";
        ctx.fillText("Çocuklar Üşümesin Derneği", 540, 520);

        const ICERIK_GENISLIGI = 780;
        let y = 670;
        let linkY = 1440;

        // 2. İyi ki Varsınız + İsim (uzun isimler küçültülür, gerekirse alt satıra iner)
        ctx.fillStyle = "#EA580C";
        const selamlama = `İyi ki Varsınız, ${duzenliIsim}`;
        ctx.font = `bold 62px ${YAZI_TIPI}`;
        if (ctx.measureText(selamlama).width <= ICERIK_GENISLIGI) {
          ctx.fillText(selamlama, 540, y);
        } else {
          ctx.fillText("İyi ki Varsınız,", 540, y);
          let isimBoyutu = 62;
          while (
            isimBoyutu > 44 &&
            ctx.measureText(duzenliIsim).width > ICERIK_GENISLIGI
          ) {
            isimBoyutu -= 2;
            ctx.font = `bold ${isimBoyutu}px ${YAZI_TIPI}`;
          }
          const isimSatirlari = satirlaraBol(
            ctx,
            duzenliIsim,
            ICERIK_GENISLIGI
          ).slice(0, 2);
          for (const satir of isimSatirlari) {
            y += isimBoyutu + 16;
            ctx.fillText(sigdir(ctx, satir, ICERIK_GENISLIGI), 540, y);
          }
        }

        // 3. Teşekkür Metni
        y += 140;
        ctx.fillStyle = "#4B5563";
        ctx.font = `400 36px ${YAZI_TIPI}`;
        for (const satir of [
          "Bugün uzattığınız iyilik eliyle bir evladımızın",
          "yüzündeki tebessüme, üşüyen kışına sıcacık",
          "bir güneş oldunuz. Kalbinizin güzelliği için",
          "gönülden teşekkür ederiz.",
        ]) {
          ctx.fillText(satir, 540, y);
          y += 55;
        }

        // 4. Bağış Bilgileri (kutuya sığmayan liste satırlara bölünür, kutu uzar)
        const kalemler = seciliUrunler.map((u) => `${sepet[u.id]} ${u.ad}`);
        if (nakdiSayi > 0) {
          kalemler.push(`${paraFormati.format(nakdiSayi)} ₺ Nakdi Destek`);
        }
        if (kalemler.length > 0) {
          const KUTU_GENISLIGI = 780;
          const KUTU_IC_BOSLUK = 30;
          const SATIR_YUKSEKLIGI = 50;
          const EN_FAZLA_SATIR = 4;

          ctx.font = `600 34px ${YAZI_TIPI}`;
          const tumSatirlar = kalemleriDiz(
            ctx,
            ["🎁  " + kalemler[0], ...kalemler.slice(1)],
            KUTU_GENISLIGI - 72
          );
          const satirlar = tumSatirlar.slice(0, EN_FAZLA_SATIR);
          if (tumSatirlar.length > EN_FAZLA_SATIR) {
            satirlar[EN_FAZLA_SATIR - 1] = "ve diğer destekleriniz";
          }

          const kutuUst = y + 40;
          const kutuYuksekligi =
            satirlar.length * SATIR_YUKSEKLIGI + KUTU_IC_BOSLUK * 2;

          ctx.fillStyle = "#F9FAFB";
          ctx.beginPath();
          ctx.roundRect(150, kutuUst, KUTU_GENISLIGI, kutuYuksekligi, 32);
          ctx.fill();

          ctx.fillStyle = "#1F2937";
          ctx.textBaseline = "middle";
          satirlar.forEach((satir, i) => {
            ctx.fillText(
              satir,
              540,
              kutuUst + KUTU_IC_BOSLUK + SATIR_YUKSEKLIGI * (i + 0.5)
            );
          });
          ctx.textBaseline = "alphabetic";
          linkY = Math.max(linkY, kutuUst + kutuYuksekligi + 90);
        }

        // 5. Web Sitesi Linki (içerik uzarsa aşağı kayar)
        ctx.fillStyle = "#EA580C";
        ctx.font = `600 34px ${YAZI_TIPI}`;
        ctx.fillText(gorunenSiteAdi, 540, linkY);

        const blob: Blob | null = await new Promise((res) =>
          canvas.toBlob(res, "image/png")
        );

        if (blob) {
          const dosya = new File([blob], "cocuklar-usumesin-tesekkur.png", {
            type: "image/png",
          });

          if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
            await navigator.share({
              files: [dosya],
              title: "Çocuklar Üşümesin Derneği",
              text: paylasimMetni,
            });
            return;
          } else {
            const indirUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = indirUrl;
            a.download = "cocuklar-usumesin-tesekkur.png";
            a.click();
            URL.revokeObjectURL(indirUrl);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setStoryHazirlaniyor(false);
    }
  };

  return (
    <section aria-label="Teşekkür Kartı" className="w-full space-y-3">
      <GradyanTanimi id={gradyanId} />

      {/* 1. KART: TEŞEKKÜR KARTI (Tam İstediğin Ortalanmış Hiyerarşi) */}
      <div className="donation-panel relative overflow-hidden px-5 pb-6 pt-6 text-center">
        {/* 1) Yukarıda Tam Ortada Logo */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow-md">
          <div className="h-full w-full overflow-hidden rounded-full bg-white p-0.5">
            <img
              src="/logo.webp"
              alt="Çocuklar Üşümesin Derneği Logosu"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* 2) Logonun Hemen Altında: Çocuklar Üşümesin + İnce Yardımlaşma ve Dayanışma Derneği */}
        <div className="mt-2.5 flex flex-col items-center">
          <div className="inline-flex items-center justify-center gap-1.5">
            <span className="text-base font-bold text-gray-800 tracking-tight">
              Çocuklar Üşümesin
            </span>
            <MaviTik />
          </div>
          <span className="mt-0.5 text-[11px] font-normal text-gray-500">
            Yardımlaşma ve Dayanışma Derneği
          </span>
        </div>

        {/* 3) Onun Altında: Üstte Siyah 'İyi ki Varsınız', Altında Hafif Şerit İçinde İsim */}
        <div className="mt-3.5 flex flex-col items-center">
          <span className="text-xs font-semibold tracking-wide text-gray-800 sm:text-[13px]">
            İyi ki Varsınız
          </span>

          <div className="mt-1.5 inline-flex items-center justify-center rounded-xl border border-orange-100/80 bg-gradient-to-r from-orange-50/80 via-red-50/60 to-orange-50/80 px-5 py-1.5 shadow-2xs">
            <h2 className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-lg font-bold tracking-tight text-transparent sm:text-xl">
              {duzenliIsim}
            </h2>
          </div>
        </div>

        {/* 4) Altında: Teşekkür Metni */}
        <p className="mx-auto mt-2.5 max-w-[310px] text-xs font-normal leading-relaxed text-gray-600 sm:text-[13px]">
          Bugün uzattığınız iyilik eliyle bir evladımızın yüzündeki tebessüme, üşüyen kışına sıcacık bir güneş oldunuz. Kalbinizin güzelliği için gönülden teşekkür ederiz.
        </p>

        {/* 5) Metnin Altında: Bağış Bilgileri */}
        {(seciliUrunler.length > 0 || nakdiSayi > 0) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {seciliUrunler.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-800"
              >
                <GradyenIkon
                  icon={faGift}
                  className="h-3.5 w-3.5"
                  gradyanId={gradyanId}
                />
                <span>
                  {sepet[u.id]} {u.ad}
                </span>
              </span>
            ))}

            {nakdiSayi > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-800">
                <GradyenIkon
                  icon={faHandHoldingHeart}
                  className="h-3.5 w-3.5"
                  gradyanId={gradyanId}
                />
                <span>{paraFormati.format(nakdiSayi)} ₺ Nakdi Destek</span>
              </span>
            )}
          </div>
        )}

        {/* 6) En Altında: Web Sitesi Linki */}
        <div className="mt-5 border-t border-gray-100 pt-3.5 flex justify-center">
          <button
            type="button"
            onClick={() => linkiKopyala()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50/80 px-3.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <GradyenIkon icon={faLink} className="h-3 w-3" gradyanId={gradyanId} />
            <span>{gorunenSiteAdi}</span>
            {kopyaBildirimi && (
              <span className="ml-1 text-[10px] font-medium text-emerald-600">
                (Kopyalandı ✓)
              </span>
            )}
          </button>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
        />
      </div>

      {/* 2. KART: AYRI PAYLAŞMA KARTI (Paylaşma Metni + Instagram & WhatsApp Butonları) */}
      <div className="donation-panel p-4 space-y-3">
        <p className="text-center text-xs font-normal leading-relaxed text-gray-600">
          Teşekkür kartınızı hikayenizde paylaşarak arkadaşlarınızın da bir çocuğumuza umut olmasına vesile olabilirsiniz.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={instagramHikayePaylas}
            disabled={storyHazirlaniyor}
            className="ui-focus flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-xs font-medium text-gray-800 transition-colors hover:border-pink-200 hover:bg-pink-50/40 disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faInstagram}
              className="text-sm text-pink-600"
            />
            <span>
              {storyHazirlaniyor
                ? "Hazırlanıyor..."
                : "Instagram Hikayende Paylaş"}
            </span>
          </button>

          <button
            type="button"
            onClick={whatsappPaylas}
            className="ui-focus flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-xs font-medium text-gray-800 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
          >
            <FontAwesomeIcon
              icon={faWhatsapp}
              className="text-sm text-emerald-600"
            />
            <span>WhatsApp&apos;ta Paylaş</span>
          </button>
        </div>

        <button
          type="button"
          onClick={anaSayfayaDon}
          className="ui-focus flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
          <span>Ana Sayfaya Dön</span>
        </button>
      </div>
    </section>
  );
}
