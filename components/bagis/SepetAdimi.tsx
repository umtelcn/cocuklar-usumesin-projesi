"use client";

import { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import { paraFormati } from "@/lib/format";
import {
  faPlus,
  faMinus,
  faArrowRight,
  faBasketShopping,
  faHandHoldingHeart,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Urun } from "./types";
import { tutarCoz, tutarGirdisiTemizle } from "@/lib/useBagisAkisi";

interface SepetAdimiProps {
  urunler: Urun[];
  yukleniyor: boolean;
  sepet: Record<number, number>;
  adetDegistir: (urunId: number, degisim: number) => void;
  nakdiTutar: string;
  setNakdiTutar: (deger: string) => void;
  genelToplam: number;
  ileriGit: () => void;
}

const adetButonuSinifi =
  "ui-focus relative z-10 flex h-8 w-6 shrink-0 cursor-pointer " +
  "items-center justify-center rounded-lg text-gray-600 " +
  "transition-colors hover:bg-orange-50 hover:text-orange-600 " +
  "focus-visible:-outline-offset-2 motion-reduce:transition-none";

export default function SepetAdimi({
  urunler,
  yukleniyor,
  sepet,
  adetDegistir,
  nakdiTutar,
  setNakdiTutar,
  genelToplam,
  ileriGit,
}: SepetAdimiProps) {
  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `sepet-gradyan-${benzersizId}`;
  const nakdiInputId = `nakdi-tutar-${benzersizId}`;
  const nakdiAciklamaId = `nakdi-aciklama-${benzersizId}`;
  const baslikId = `sepet-baslik-${benzersizId}`;

  const toplamUrunAdedi = Object.values(sepet).reduce(
    (toplam, adet) => toplam + adet,
    0
  );

  const urunlerToplami = urunler.reduce(
    (toplam, urun) =>
      toplam + urun.fiyat * (sepet[urun.id] || 0),
    0
  );

  const nakdiDeger = tutarCoz(nakdiTutar);
  const nakdiDestekVar = nakdiDeger > 0;

  const nakdiTutariDegistir = (deger: string) => {
    setNakdiTutar(tutarGirdisiTemizle(deger));
  };

  return (
    <section
      aria-labelledby={baslikId}
      className="w-full space-y-2.5"
    >
      {/* BAŞLIK KARTI */}
      <div className="donation-panel relative isolate overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 pb-3.5 pt-4">
          <div className="min-w-0">
            <h1
              id={baslikId}
              className="text-[18px] font-extrabold leading-6 tracking-tight text-gray-900"
            >
              Bağış Sepeti
            </h1>

            <p className="mt-1 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-xs font-bold leading-[18px] text-transparent">
              Bir çocuğumuzun kışına güneş ol
            </p>
          </div>

          {/* Adet değişiminde yeniden çalışan kısa animasyonlu renkli sepet */}
          <div
            key={toplamUrunAdedi}
            role="img"
            aria-label={`Bağış sepetinde ${toplamUrunAdedi} adet ürün var`}
            className="basket-pop relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-red-50"
          >
            <GradyanTanimi id={gradyanId} />
            <GradyenIkon
              icon={faBasketShopping}
              className="h-8 w-8"
              gradyanId={gradyanId}
            />

            {toplamUrunAdedi > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-1.5 text-[10px] font-extrabold tabular-nums text-white shadow-sm ring-2 ring-white"
              >
                {toplamUrunAdedi}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ÜRÜNLER: İKİ SÜTUNLU ŞIK KARTLAR */}
      {yukleniyor ? (
        <div
          role="status"
          className="grid grid-cols-2 gap-2.5"
        >
          <span className="sr-only">
            İhtiyaçlar yükleniyor...
          </span>

          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              aria-hidden="true"
              className="donation-panel flex min-w-0 animate-pulse flex-col rounded-2xl p-2.5 motion-reduce:animate-none"
            >
              <div className="h-20 w-full rounded-xl bg-gray-100" />
              <div className="mt-2 h-4 w-3/4 rounded bg-gray-100" />
              <div className="mt-2 flex h-8 items-center justify-between gap-2 pt-1">
                <div className="h-3.5 w-12 rounded bg-orange-50" />
                <div className="h-7 w-14 rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : urunler.length === 0 ? (
        <div className="donation-panel px-4 py-5 text-center">
          <p className="text-sm font-semibold text-gray-700">
            Listelenecek ihtiyaç bulunamadı.
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Aşağıdaki alandan nakdi destek ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <ul
          aria-label="Bağış yapılabilecek ihtiyaçlar"
          className="grid grid-cols-2 items-stretch gap-2.5"
        >
          {urunler.map((urun) => {
            const adet = sepet[urun.id] || 0;
            const secili = adet > 0;

            return (
              <li
                key={urun.id}
                className={`donation-panel group relative flex min-w-0 flex-col rounded-2xl p-2.5 transition-all duration-200 motion-reduce:transition-none ${
                  secili
                    ? "border-orange-400/90 bg-gradient-to-b from-orange-50/50 via-white to-white ring-1 ring-orange-400/30"
                    : "hover:border-gray-300/90 bg-white"
                }`}
              >
                {/* Seçili Rozeti (Sağ Üst Köşe) */}
                {secili && (
                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-4 z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xs"
                  >
                    <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                  </span>
                )}

                {/* Ürün Görsel Alanı (Tıklanabilir ve Zarif Çerçeveli) */}
                <div
                  onClick={() => adet === 0 && adetDegistir(urun.id, 1)}
                  className={`relative flex h-[84px] w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border p-2 transition-colors ${
                    secili
                      ? "border-orange-100 bg-white"
                      : "border-gray-100/80 bg-gradient-to-b from-gray-50/70 to-gray-100/40 group-hover:border-gray-200/80"
                  }`}
                >
                  <img
                    src={urun.gorsel_yolu}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full max-w-[108px] object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Ürün Adı */}
                <h2
                  onClick={() => adet === 0 && adetDegistir(urun.id, 1)}
                  className="mt-2 cursor-pointer break-words px-0.5 text-xs font-bold leading-4 text-gray-800 min-[380px]:text-[13px]"
                >
                  {urun.ad}
                </h2>

                {/* Alt Satır: Fiyat ve Ekle / Adet Kontrolü */}
                <div className="mt-auto flex min-w-0 items-center justify-between gap-1 border-t border-gray-100/90 pt-2 mt-1.5">
                  <p className="min-w-0 break-words pl-0.5 text-[13px] font-extrabold leading-4 tabular-nums text-orange-500 min-[380px]:text-sm">
                    <span className="sr-only">Birim fiyat: </span>
                    {paraFormati.format(urun.fiyat)}{" "}
                    <span className="text-[11px] font-bold">₺</span>
                  </p>

                  {/* Sabit Genişlikli Kontrol Alanı */}
                  <div className="flex h-8 w-[76px] shrink-0 items-center justify-end">
                    {secili ? (
                      <div
                        role="group"
                        aria-label={`${urun.ad} adet kontrolü`}
                        className="relative flex h-8 w-full items-center rounded-xl border border-orange-200/90 bg-white shadow-2xs"
                      >
                        <button
                          type="button"
                          aria-label={`${urun.ad} adedini azalt`}
                          onClick={() => adetDegistir(urun.id, -1)}
                          className={adetButonuSinifi}
                        >
                          <FontAwesomeIcon
                            icon={faMinus}
                            className="text-[9px]"
                            aria-hidden="true"
                          />
                        </button>

                        <span
                          aria-live="polite"
                          aria-atomic="true"
                          className={`relative z-10 min-w-0 flex-1 text-center font-extrabold tabular-nums text-gray-800 ${
                            adet >= 1000 ? "text-[9px]" : "text-xs"
                          }`}
                        >
                          <span className="sr-only">{urun.ad}: </span>
                          {adet}
                        </span>

                        <button
                          type="button"
                          aria-label={`${urun.ad} adedini artır`}
                          onClick={() => adetDegistir(urun.id, 1)}
                          className={adetButonuSinifi}
                        >
                          <FontAwesomeIcon
                            icon={faPlus}
                            className="text-[9px]"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label={`${urun.ad} ürününü sepete ekle`}
                        onClick={() => adetDegistir(urun.id, 1)}
                        className="ui-focus group/btn flex h-8 w-full cursor-pointer items-center justify-end rounded-xl"
                      >
                        <span className="flex h-7 w-[62px] items-center justify-center gap-1 rounded-xl border border-gray-200/90 bg-gray-50/90 text-[11px] font-bold text-gray-700 shadow-2xs transition-all group-hover/btn:border-orange-300 group-hover/btn:bg-orange-50 group-hover/btn:text-orange-600 motion-reduce:transition-none">
                          <FontAwesomeIcon
                            icon={faPlus}
                            className="text-[8px] text-gray-400 transition-colors group-hover/btn:text-orange-500"
                            aria-hidden="true"
                          />
                          Ekle
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* VEYA AYIRACI */}
      <div
        aria-hidden="true"
        className="flex items-center gap-3 px-1 py-0.5"
      >
        <div className="h-px flex-1 bg-gray-200/90" />

        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          veya
        </span>

        <div className="h-px flex-1 bg-gray-200/90" />
      </div>

      {/* NAKDİ YARDIM: BAĞIMSIZ TUTAR GİRİŞ KARTI */}
      <div className="donation-panel overflow-hidden">
        <div className="p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
              <FontAwesomeIcon
                icon={faHandHoldingHeart}
                className="text-sm"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-5 text-gray-800">
                <label
                  htmlFor={nakdiInputId}
                  className="cursor-pointer"
                >
                  Nakdi Yardım
                </label>
              </h2>

              <p
                id={nakdiAciklamaId}
                className="text-[11px] leading-4 text-gray-500"
              >
                Dilediğiniz tutarda nakdi destek ekleyebilirsiniz.
              </p>
            </div>
          </div>

          <div className="relative mt-2.5">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-orange-500"
            >
              ₺
            </span>

            <input
              id={nakdiInputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0,00"
              value={nakdiTutar}
              aria-describedby={nakdiAciklamaId}
              onChange={(e) =>
                nakdiTutariDegistir(e.target.value)
              }
              className={`donation-amount h-10 w-full rounded-xl border pl-9 pr-4 text-base font-bold tabular-nums text-gray-800 transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 motion-reduce:transition-none ${
                nakdiDestekVar
                  ? "border-orange-200 bg-orange-50/30"
                  : "border-gray-200 bg-gray-50"
              }`}
            />
          </div>
        </div>
      </div>

      {/* BAĞIŞ ÖZETİ: ÜRÜNLER VE NAKDİ DESTEK İÇİN ORTAK ÖDEME */}
      <div className="donation-panel relative overflow-hidden">
        <div className="px-3.5 pt-3">
          <h2 className="text-[13px] font-bold leading-5 text-gray-800">
            Bağış Özeti
          </h2>

          <div className="mt-2 grid grid-cols-2 divide-x divide-gray-200/80">
            <div className="min-w-0 pr-3">
              <p className="text-[11px] leading-4 text-gray-500">
                Ürünler ({toplamUrunAdedi})
              </p>

              <p className="mt-0.5 break-words text-[13px] font-semibold leading-5 tabular-nums text-gray-700">
                {paraFormati.format(urunlerToplami)} ₺
              </p>
            </div>

            <div className="min-w-0 pl-3">
              <p className="text-[11px] leading-4 text-gray-500">
                Nakdi yardım
              </p>

              <p className="mt-0.5 break-words text-[13px] font-semibold leading-5 tabular-nums text-gray-700">
                {paraFormati.format(
                  nakdiDestekVar ? nakdiDeger : 0
                )} ₺
              </p>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mx-3.5 mt-2.5 h-px bg-gray-200/80"
        />

        {/* Genel toplam ve tüm bağışlar için ödeme */}
        <div className="flex items-center justify-between gap-3 px-3.5 pb-4 pt-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase leading-4 tracking-wider text-gray-500">
              Genel Toplam
            </p>

            <p
              aria-live="polite"
              aria-atomic="true"
              className="break-words bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-[23px] font-extrabold leading-7 tracking-tight text-transparent tabular-nums"
            >
              <span className="sr-only">
                Toplam tutar:{" "}
              </span>
              {paraFormati.format(genelToplam)} ₺
            </p>
          </div>

          <button
            type="button"
            onClick={ileriGit}
            className="ui-focus flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600 motion-reduce:transition-none min-[380px]:px-4 min-[380px]:text-[13px]"
          >
            <span>Ödemeye Geç</span>

            <FontAwesomeIcon
              icon={faArrowRight}
              className="text-[10px]"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Kartın altındaki gradyen şerit */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
        />
      </div>
    </section>
  );
}
