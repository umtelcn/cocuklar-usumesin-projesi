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

const IBAN = "TR36 0001 0011 5098 1058 3050 01";
const ALICI = "Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği";

/** Banka kutusundaki tek satır: etiket, değer ve küçük kopyala düğmesi. */
function BilgiSatiri({
  etiket,
  deger,
  kopyalanacak = deger,
  iban = false,
  gradyanId,
}: {
  etiket: string;
  deger: string;
  kopyalanacak?: string;
  iban?: boolean;
  gradyanId: string;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);

  const kopyala = async () => {
    // Bildirim yalnızca kopyalama gerçekten başarılıysa gösterilir.
    if (!(await panoyaKopyala(kopyalanacak))) {
      alert("Kopyalanamadı. Lütfen metni elle seçip kopyalayın.");
      return;
    }
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-medium text-gray-400">{etiket}</span>
        <p
          className={`mt-0.5 break-words text-gray-900 ${
            iban
              ? "font-mono text-[13.5px] font-semibold tracking-wide tabular-nums sm:text-sm"
              : "text-[13px] font-semibold leading-5"
          }`}
        >
          {deger}
        </p>
      </div>

      <button
        type="button"
        onClick={kopyala}
        aria-label={`${etiket} bilgisini kopyala`}
        className={`ui-focus inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-colors ${
          kopyalandi
            ? "bg-green-50 text-green-600"
            : "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-orange-600 hover:ring-orange-200"
        }`}
      >
        {kopyalandi ? (
          <>
            <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
            <span>Kopyalandı</span>
          </>
        ) : (
          <>
            <GradyenIkon icon={faCopy} className="h-3 w-3" gradyanId={gradyanId} />
            <span>Kopyala</span>
          </>
        )}
      </button>
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
  // Yalnızca ürün sepetinde içerik dökümü anlamlı; tek nakdi tutarda tekrar olur.
  const dokumGoster = seciliUrunler.length > 0;

  return (
    <section aria-label="Ödeme Bilgileri" className="donation-panel w-full overflow-hidden">
      <GradyanTanimi id={gradyanId} />

      {/* ÜST: Geri + adım bilgisi */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
        <button
          type="button"
          onClick={geriDon}
          className="ui-focus -ml-1 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
          Geri
        </button>
        <span className="text-[11px] font-semibold text-gray-400">Adım 1 / 2</span>
      </div>

      {/* TUTAR */}
      <div className="px-4 pb-4 pt-2 text-center">
        <p className="text-xs font-medium text-gray-500">Göndereceğiniz tutar</p>
        <p className="mt-1 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-[32px] font-extrabold leading-9 tracking-tight text-transparent tabular-nums">
          {paraFormati.format(genelToplam)} ₺
        </p>

        {dokumGoster && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {seciliUrunler.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-100"
              >
                <GradyenIkon icon={faGift} className="h-3 w-3" gradyanId={gradyanId} />
                {sepet[u.id]} {u.ad}
              </span>
            ))}
            {nakdiSayi > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 ring-1 ring-gray-100">
                <GradyenIkon icon={faHandHoldingHeart} className="h-3 w-3" gradyanId={gradyanId} />
                {paraFormati.format(nakdiSayi)} ₺ nakdi
              </span>
            )}
          </div>
        )}
      </div>

      {/* BANKA BİLGİLERİ */}
      <div className="px-4">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-3.5 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E30613] text-white">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M12 2L9.5 6.5 12 9l2.5-2.5L12 2zm0 8l-3.5-2.5L6 10l6 4 6-4-2.5-2.5L12 10zm0 5l-3.5-2.5L6 15l6 4 6-4-2.5-2.5L12 15zm-1 4.5V22h2v-2.5l-1 .5-1-.5z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-bold leading-4 text-gray-800">
                T.C. Ziraat Bankası
              </span>
              <span className="block text-[10.5px] text-gray-500">Havale / EFT · TL hesabı</span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <BilgiSatiri
              etiket="IBAN"
              deger={IBAN}
              kopyalanacak={IBAN.replace(/\s/g, "")}
              iban
              gradyanId={gradyanId}
            />
            <BilgiSatiri etiket="Alıcı adı" deger={ALICI} gradyanId={gradyanId} />
          </div>
        </div>

        <p className="mt-2.5 px-1 text-center text-[11px] leading-4 text-gray-500">
          <span className="font-semibold text-gray-700">Not:</span> Alıcı adına kısaca{" "}
          <span className="font-semibold text-gray-700">“Çocuklar Üşümesin”</span> yazabilirsiniz.
        </p>
      </div>

      {/* DEVAM */}
      <div className="p-4 pt-3.5">
        <button
          type="button"
          onClick={ileriGit}
          className="ui-focus flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600"
        >
          Ödemeyi Yaptım, Devam Et
          <FontAwesomeIcon icon={faArrowRight} className="text-[11px]" />
        </button>
      </div>
    </section>
  );
}
