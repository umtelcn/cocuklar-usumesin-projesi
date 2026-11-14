"use client";

import { useState, useEffect, useId } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import {
  faHeart,
  faShieldHalved,
  faHandHoldingHeart,
  faChevronDown,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";

interface SoruCevap {
  id: string;
  soru: string;
  cevap: string;
  sira: number;
}

export default function Hakkimizda() {
  const [sorular, setSorular] = useState<SoruCevap[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [acikSoruId, setAcikSoruId] = useState<string | null>(null);

  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `hakkimizda-gradyan-${benzersizId}`;

  useEffect(() => {
    async function sorulariGetir() {
      try {
        const { data, error } = await supabase
          .from("sikca_sorulan_sorular")
          .select("*")
          .order("sira", { ascending: true });

        if (error) throw error;
        if (data) {
          setSorular(data);
          if (data.length > 0) setAcikSoruId(data[0].id);
        }
      } catch (err) {
        console.error("SSS çekilemedi:", err);
      } finally {
        setYukleniyor(false);
      }
    }
    sorulariGetir();
  }, []);

  return (
    <section aria-label="Hakkımızda ve Sıkça Sorulan Sorular" className="w-full space-y-3">
      <GradyanTanimi id={gradyanId} />

      {/* 1. KART: HAKKIMIZDA VE MİSYONUMUZ */}
      <div className="donation-panel relative overflow-hidden p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-full bg-white shadow-md p-1 shrink-0">
            <img
              src="/logo.webp"
              alt="Çocuklar Üşümesin"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-snug">
              Çocuklar Üşümesin
            </h1>
            <span className="block text-[11px] font-normal text-gray-500">
              Yardımlaşma ve Dayanışma Derneği
            </span>
          </div>
        </div>

        <p className="text-xs font-normal leading-relaxed text-gray-600 sm:text-[13px]">
          Derneğimiz; Türkiye&apos;nin dört bir yanındaki dezavantajlı çocuklarımızın kışlık giyim, bot, mont, gıda ve eğitim materyali ihtiyaçlarını karşılamak, aynı zamanda onların saf hayallerini gerçeğe dönüştürmek misyonuyla yola çıkmış gönüllü bir sosyal yardım hareketidir.
        </p>

        {/* 3'lü Değerlerimiz Bandı */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3.5 text-center">
          <div className="rounded-xl bg-gray-50/80 p-2.5">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center">
              <GradyenIkon
                icon={faShieldHalved}
                className="h-4 w-4"
                gradyanId={gradyanId}
              />
            </div>
            <span className="block text-[11px] font-semibold text-gray-800">
              %100 Şeffaf
            </span>
          </div>

          <div className="rounded-xl bg-gray-50/80 p-2.5">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center">
              <GradyenIkon
                icon={faHandHoldingHeart}
                className="h-4 w-4"
                gradyanId={gradyanId}
              />
            </div>
            <span className="block text-[11px] font-semibold text-gray-800">
              Doğrudan Teslim
            </span>
          </div>

          <div className="rounded-xl bg-gray-50/80 p-2.5">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center">
              <GradyenIkon icon={faHeart} className="h-4 w-4" gradyanId={gradyanId} />
            </div>
            <span className="block text-[11px] font-semibold text-gray-800">
              Gerçek Umutlar
            </span>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
        />
      </div>

      {/* 2. BÖLÜM: SIKÇA SORULAN SORULAR (AKORDEON) */}
      <div className="pt-2">
        <div className="mb-2.5 flex items-center gap-2 px-1">
          <GradyenIkon
            icon={faCircleQuestion}
            className="h-4 w-4"
            gradyanId={gradyanId}
          />
          <h2 className="text-sm font-bold text-gray-800">
            Sıkça Sorulan Sorular
          </h2>
        </div>

        {yukleniyor ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="donation-panel h-12 w-full animate-pulse p-3.5"
              />
            ))}
          </div>
        ) : sorular.length === 0 ? (
          <div className="donation-panel p-5 text-center text-xs text-gray-500">
            Henüz soru eklenmemiş.
          </div>
        ) : (
          <div className="space-y-2">
            {sorular.map((item) => {
              const acik = acikSoruId === item.id;
              return (
                <div
                  key={item.id}
                  className="donation-panel overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setAcikSoruId(acik ? null : item.id)}
                    aria-expanded={acik}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-xs font-semibold text-gray-800 sm:text-[13px]">
                      {item.soru}
                    </span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`text-xs text-gray-400 transition-transform duration-200 ${
                        acik ? "rotate-180 text-orange-500" : ""
                      }`}
                    />
                  </button>

                  {acik && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-xs font-normal leading-relaxed text-gray-600">
                      {item.cevap}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
