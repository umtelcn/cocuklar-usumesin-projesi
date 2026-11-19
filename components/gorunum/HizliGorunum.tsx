"use client";

import { useCallback, useId, useState } from "react";
import { useBagisAkisi } from "@/lib/useBagisAkisi";
import SekmeMenusu, { type Sekme } from "@/components/SekmeMenusu";
import BagisAdimlari from "@/components/bagis/BagisAdimlari";
import IadeTalebi from "@/components/IadeTalebi";
import BagisListesi from "@/components/BagisListesi";
import Calismalarimiz from "@/components/Calismalarimiz";
import TalepFormu from "@/components/TalepFormu";
import Hakkimizda from "@/components/Hakkimizda";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import { paraFormati } from "@/lib/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faImages,
  faHandHoldingHeart,
  faCircleInfo,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

type HizliSekme = "bagis" | "calismalar" | "talep" | "hakkimizda";

const SEKMELER: Sekme<HizliSekme>[] = [
  { id: "bagis", etiket: "Bağış Yap", ikon: faHeart },
  { id: "calismalar", etiket: "Çalışmalarımız", ikon: faImages },
  { id: "talep", etiket: "Yardım Talebi", ikon: faHandHoldingHeart },
  { id: "hakkimizda", etiket: "Hakkımızda", ikon: faCircleInfo },
];

export default function HizliGorunum() {
  const [aktifSekme, setAktifSekme] = useState<HizliSekme>("bagis");
  const ilkSekmeyeDon = useCallback(() => setAktifSekme("bagis"), []);
  const akis = useBagisAkisi({ nakdiTamSayi: true, onAnaSayfa: ilkSekmeyeDon });

  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `hizli-bagis-gradyan-${benzersizId}`;
  const tutarInputId = `hizli-tutar-${benzersizId}`;

  const odemeyeGecilebilir = akis.genelToplam > 0;

  return (
    <div className="w-full space-y-3 pb-10">
      <GradyanTanimi id={gradyanId} />

      {/* 4'LÜ MİNİMALİST ÜST SEKME MENÜSÜ */}
      <SekmeMenusu
        sekmeler={SEKMELER}
        aktifSekme={aktifSekme}
        setAktifSekme={(sekme) => {
          if (akis.step === 3) akis.akisiSifirla();
          setAktifSekme(sekme);
        }}
      />

      {/* 1. SEKME: BAĞIŞ YAP */}
      {aktifSekme === "bagis" &&
        (akis.step === 0 ? (
          <div className="space-y-3">
            {/* Üstte Sadece En Son Gönderimiz */}
            <Calismalarimiz limit={1} onTumCalismalar={() => { setAktifSekme("calismalar"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

            {/* Ortada Sade ve Profesyonel Bağış Yap Kartı (Hazır Tutar Butonları Yok) */}
            <section
              aria-label="Bağış Yap"
              className="donation-panel relative overflow-hidden p-4 pb-5"
            >
              {/* Başlık ve Slogan */}
              <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
                <div>
                  <h2 className="text-[18px] font-extrabold leading-6 tracking-tight text-gray-900">
                    Bağış Yap
                  </h2>
                  <p className="mt-0.5 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-xs font-bold text-transparent">
                    Bir çocuğumuzun kışına güneş ol
                  </p>
                </div>

                <div
                  key={akis.nakdiSayi}
                  className="basket-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-red-50"
                >
                  <GradyenIkon
                    icon={faHandHoldingHeart}
                    className="h-6 w-6"
                    gradyanId={gradyanId}
                  />
                </div>
              </div>

              {/* Serbest Tutar Giriş Kutusu */}
              <div className="mt-3.5">
                <label
                  htmlFor={tutarInputId}
                  className="mb-1.5 block text-xs font-medium text-gray-600"
                >
                  Bağış yapmak istediğiniz tutarı giriniz
                </label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-orange-500"
                  >
                    ₺
                  </span>
                  <input
                    id={tutarInputId}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="0,00"
                    value={akis.nakdiTutar}
                    onChange={(e) => akis.setNakdiTutar(e.target.value)}
                    className="donation-amount h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-lg font-bold tabular-nums text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* Alt Toplam ve Ödemeye Geç Satırı */}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Bağış Tutarı
                  </p>
                  <p className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-[22px] font-extrabold leading-7 tracking-tight text-transparent tabular-nums">
                    {paraFormati.format(akis.genelToplam)} ₺
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => akis.adimaGit(1)}
                  disabled={!odemeyeGecilebilir}
                  className="ui-focus flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 disabled:shadow-none sm:text-[13px]"
                >
                  <span>Ödemeye Geç</span>
                  <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
                </button>
              </div>

              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
              />
            </section>

            <IadeTalebi />
            <BagisListesi gorunum="nakdi" />
          </div>
        ) : (
          <BagisAdimlari akis={akis} />
        ))}

      {/* 2. SEKME: ÇALIŞMALARIMIZ */}
      {aktifSekme === "calismalar" && <Calismalarimiz />}

      {/* 3. SEKME: YARDIM TALEBİ */}
      {aktifSekme === "talep" && <TalepFormu />}

      {/* 4. SEKME: HAKKIMIZDA VE SSS */}
      {aktifSekme === "hakkimizda" && <Hakkimizda />}
    </div>
  );
}
