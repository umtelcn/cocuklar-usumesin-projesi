"use client";

import { useState, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import { paraFormati } from "@/lib/format";
import { panoyaKopyala } from "@/lib/pano";
import {
  faCopy,
  faCheck,
  faArrowLeft,
  faArrowRight,
  faGift,
  faCircleExclamation,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";
import { Urun } from "./types";

interface OdemeAdimiProps {
  urunler: Urun[];
  sepet: Record<number, number>;
  nakdiTutar: string;
  genelToplam: number;
  geriDon: () => void;
  ileriGit: () => void;
}

function KopyalanabilirKart({
  etiket,
  deger,
  uyariNotu,
  gradyanId,
}: {
  etiket: string;
  deger: string;
  uyariNotu?: string;
  gradyanId: string;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);

  const kopyala = async () => {
    const temizDeger = etiket.includes("IBAN")
      ? deger.replace(/\s/g, "")
      : deger;
    // Bildirim yalnızca kopyalama gerçekten başarılıysa gösterilir.
    if (!(await panoyaKopyala(temizDeger))) {
      alert("Kopyalanamadı. Lütfen metni elle seçip kopyalayın.");
      return;
    }
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  return (
    <div className="donation-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400">
            {etiket}
          </span>
          <p className="mt-1 break-words text-[13px] font-medium leading-5 text-gray-800 sm:text-sm tabular-nums">
            {deger}
          </p>
        </div>

        <button
          type="button"
          onClick={kopyala}
          aria-label={`${etiket} bilgisini kopyala`}
          className={`ui-focus flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all ${
            kopyalandi
              ? "border-green-200 bg-green-50 text-green-600"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200 hover:bg-orange-50/50"
          }`}
        >
          {kopyalandi ? (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-xs text-green-600" />
              <span>Kopyalandı</span>
            </>
          ) : (
            <>
              <GradyenIkon icon={faCopy} className="h-3.5 w-3.5" gradyanId={gradyanId} />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>

      {uyariNotu && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-orange-100/80 bg-orange-50/40 px-3 py-2 text-xs font-normal text-gray-600">
          <GradyenIkon
            icon={faCircleExclamation}
            className="h-3.5 w-3.5 shrink-0"
            gradyanId={gradyanId}
          />
          <span>{uyariNotu}</span>
        </div>
      )}
    </div>
  );
}

export default function OdemeAdimi({
  urunler,
  sepet,
  nakdiTutar,
  genelToplam,
  geriDon,
  ileriGit,
}: OdemeAdimiProps) {
  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `odeme-gradyan-${benzersizId}`;

  const seciliUrunler = urunler.filter((u) => (sepet[u.id] || 0) > 0);
  const nakdiSayi = Number(nakdiTutar) || 0;

  return (
    <section aria-label="Ödeme Bilgileri" className="w-full space-y-2.5">
      {/* Ortak SVG Gradyan */}
      <GradyanTanimi id={gradyanId} />

      {/* 1. KART: BAŞLIK VE SEPET ÖZETİ (Üst Şeritsiz, Zarif Fontlu) */}
      <div className="donation-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Ödenecek Toplam Tutar
            </span>
            <p className="mt-0.5 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-2xl font-bold leading-7 text-transparent tabular-nums">
              {paraFormati.format(genelToplam)} ₺
            </p>
          </div>

          <button
            type="button"
            onClick={geriDon}
            className="ui-focus inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-[10px] text-gray-400" />
            <span>Sepete Dön</span>
          </button>
        </div>

        {/* Seçilen Ürünler ve Nakdi Yardım */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
          {seciliUrunler.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/70 bg-gray-50/80 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              <GradyenIkon icon={faGift} className="h-3.5 w-3.5" gradyanId={gradyanId} />
              <span>
                {sepet[u.id]} {u.ad}
              </span>
            </span>
          ))}

          {nakdiSayi > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/70 bg-gray-50/80 px-2.5 py-1 text-xs font-medium text-gray-700">
              <GradyenIkon
                icon={faHandHoldingHeart}
                className="h-3.5 w-3.5"
                gradyanId={gradyanId}
              />
              <span>{paraFormati.format(nakdiSayi)} ₺ Nakdi Yardım</span>
            </span>
          )}
        </div>
      </div>

            {/* 2. KART: ZİRAAT BANKASI LOGOLU TL IBAN KARTI */}
      <div className="donation-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-red-50/60 via-white to-white px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            {/* Ziraat Bankası Kırmızı Başak Amblemi (SVG) */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E30613] text-white shadow-2xs">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
              >
                <path d="M12 2L9.5 6.5 12 9l2.5-2.5L12 2zm0 8l-3.5-2.5L6 10l6 4 6-4-2.5-2.5L12 10zm0 5l-3.5-2.5L6 15l6 4 6-4-2.5-2.5L12 15zm-1 4.5V22h2v-2.5l-1 .5-1-.5z" />
              </svg>
            </div>
            <div>
              <span className="block text-xs font-bold tracking-tight text-gray-800">
                T.C. Ziraat Bankası
              </span>
              <span className="block text-[10px] font-normal text-gray-500">
                Resmi Dernek Bağış Hesabı (TL)
              </span>
            </div>
          </div>
          <span className="rounded-md border border-red-100 bg-red-50/70 px-2 py-0.5 text-[10px] font-semibold text-[#E30613]">
            TR / Havale & EFT
          </span>
        </div>
      </div>

      {/* 2. KART: TL IBAN */}
      <KopyalanabilirKart
        etiket="TL IBAN Numaramız"
        deger="TR36 0001 0011 5098 1058 3050 01"
        gradyanId={gradyanId}
      />

      {/* 3. KART: ALICI ADI */}
      <KopyalanabilirKart
        etiket="Alıcı Adı"
        deger="Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği"
        uyariNotu='Lütfen açıklama kısmına "Bağış" yazınız.'
        gradyanId={gradyanId}
      />

      {/* 4. KART: ÖDEMEYİ YAPTIM DEVAM ET */}
      <div className="donation-panel relative overflow-hidden p-3.5 pb-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={geriDon}
            aria-label="Sepete geri dön"
            className="ui-focus flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          </button>

          <button
            type="button"
            onClick={ileriGit}
            className="ui-focus flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 text-xs font-medium text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600 sm:text-[13px]"
          >
            <span>Ödemeyi Yaptım, Devam Et</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </button>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
        />
      </div>
    </section>
  );
}
