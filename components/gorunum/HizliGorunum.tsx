"use client";

import { useCallback, useState } from "react";
import { useBagisAkisi } from "@/lib/useBagisAkisi";
import SekmeMenusu, { type Sekme } from "@/components/SekmeMenusu";
import KlasikInstagramGaleri from "@/components/klasik/KlasikInstagramGaleri";
import BagisAdimlari from "@/components/bagis/BagisAdimlari";
import IadeTalebi from "@/components/IadeTalebi";
import BagisListesi from "@/components/BagisListesi";
import TalepFormu from "@/components/TalepFormu";
import Hakkimizda from "@/components/Hakkimizda";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faHandHoldingHeart,
  faCircleInfo,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

type HizliSekme = "bagis" | "talep" | "hakkimizda";

const SEKMELER: Sekme<HizliSekme>[] = [
  { id: "bagis", etiket: "Bağış Yap", ikon: faHeart },
  { id: "talep", etiket: "Yardım Talebi", ikon: faHandHoldingHeart },
  { id: "hakkimizda", etiket: "Hakkımızda", ikon: faCircleInfo },
];

/** `/`: sade, hızlı nakdi bağış görünümü. */
export default function HizliGorunum() {
  const [aktifSekme, setAktifSekme] = useState<HizliSekme>("bagis");

  const ilkSekmeyeDon = useCallback(() => setAktifSekme("bagis"), []);
  const akis = useBagisAkisi({ nakdiTamSayi: true, onAnaSayfa: ilkSekmeyeDon });

  return (
    <div className="w-full space-y-3 pb-10">
      <SekmeMenusu
        sekmeler={SEKMELER}
        aktifSekme={aktifSekme}
        setAktifSekme={(sekme) => {
          // Teşekkür adımından sonra sekme değişimi yeni bir akış başlatır.
          if (akis.step === 3) akis.akisiSifirla();
          setAktifSekme(sekme);
        }}
      />

      {/* 1. SEKME: BAĞIŞ YAP */}
      {aktifSekme === "bagis" &&
        (akis.step === 0 ? (
          <div className="space-y-3.5">
            <KlasikInstagramGaleri />

            {/* Sade nakdi bağış kartı */}
            <div className="donation-panel relative overflow-hidden p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-500">
                  <FontAwesomeIcon icon={faHeart} className="text-base" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight text-gray-800">
                    Bağış Yap
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Bir çocuğumuzun kışına güneş ol
                  </p>
                </div>
              </div>

              <div className="relative mb-3.5">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-orange-500">
                  ₺
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  placeholder="0,00"
                  aria-label="Bağış tutarı (₺)"
                  value={akis.nakdiTutar}
                  onChange={(e) => akis.setNakdiTutar(e.target.value)}
                  className="donation-amount h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-lg font-bold tabular-nums text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={akis.nakdiSayi <= 0}
                onClick={() => akis.adimaGit(1)}
                className="ui-focus flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 disabled:shadow-none sm:text-sm"
              >
                <span>Ödemeye Geç</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </button>

              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
              />
            </div>

            <IadeTalebi />
            <BagisListesi gorunum="nakdi" />
          </div>
        ) : (
          // Adım 1-3: `/destek` ile ortak; galeri ve bağış listesi gizlenir.
          <BagisAdimlari akis={akis} />
        ))}

      {/* 2. SEKME: YARDIM TALEBİ */}
      {aktifSekme === "talep" && <TalepFormu />}

      {/* 3. SEKME: HAKKIMIZDA VE SSS */}
      {aktifSekme === "hakkimizda" && <Hakkimizda />}
    </div>
  );
}
