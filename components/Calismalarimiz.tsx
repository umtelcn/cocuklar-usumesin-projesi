"use client";

import { useState, useEffect, useId } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import {
  faHeart,
  faEye,
  faCircleCheck,
  faChevronLeft,
  faChevronRight,
  faArrowRight,
  faImages,
} from "@fortawesome/free-solid-svg-icons";

interface DilekGonderisi {
  id: string;
  baslik: string;
  kisa_ozet: string | null;
  uzun_metin: string | null;
  kapak_gorseli: string | null;
  medya_url: string[] | null;
  created_at: string;
  goruntulenme: number | null;
  sira: number | null;
  begeni_sayisi: number | null;
}

const sayiFormati = new Intl.NumberFormat("tr-TR");
function videoMu(url: string) {
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

function InstagramGonderiKarti({
  gonderi,
  gradyanId,
  onTumCalismalar,
}: {
  gonderi: DilekGonderisi;
  gradyanId: string;
  onTumCalismalar?: () => void;
}) {
  const [aktifMedyaIndex, setAktifMedyaIndex] = useState(0);
  const [devamiAcik, setDevamiAcik] = useState(false);
  const [begenildi, setBegenildi] = useState(false);
  const [begeniSayisi, setBegeniSayisi] = useState(gonderi.begeni_sayisi ?? 0);

  const tumMedyalar: string[] = [];
  if (gonderi.kapak_gorseli) tumMedyalar.push(gonderi.kapak_gorseli);
  if (Array.isArray(gonderi.medya_url)) {
    gonderi.medya_url.forEach((m) => {
      if (m && !tumMedyalar.includes(m)) tumMedyalar.push(m);
    });
  }

  // "Başlıksız Gönderi" yazısını temizle
  const temizBaslik =
    gonderi.baslik && gonderi.baslik.trim() !== "Başlıksız Gönderi"
      ? gonderi.baslik.trim()
      : "";

  const aciklamaMetni = (gonderi.uzun_metin || gonderi.kisa_ozet || "").trim();
  const uzunMetinMi = aciklamaMetni.length > 140;
  const goruntulenme = gonderi.goruntulenme ?? 0;

  const begeniDegistir = () => {
    if (begenildi) {
      setBegenildi(false);
      setBegeniSayisi((s) => Math.max(0, s - 1));
    } else {
      setBegenildi(true);
      setBegeniSayisi((s) => s + 1);
    }
  };

  return (
    <article className="donation-panel overflow-hidden">
      {/* 1. ÜST BAR: Profil başlığı */}
      <header className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="h-10 w-10 shrink-0 rounded-full border border-gray-200 bg-white p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.webp"
              alt="Çocuklar Üşümesin"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate text-[13px] font-bold leading-4 text-gray-900">
                cocuklar_usumes
              </span>
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="shrink-0 text-[11px] text-sky-500"
              />
            </div>
            <p className="truncate text-[11px] leading-4 text-gray-500">
              {temizBaslik || "Çocuklar Üşümesin"}
            </p>
          </div>
        </div>

        {tumMedyalar.length > 1 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-gray-600">
            <FontAwesomeIcon icon={faImages} className="text-[9px] text-gray-400" />
            {aktifMedyaIndex + 1}/{tumMedyalar.length}
          </span>
        )}
      </header>

      {/* 2. ORTA ALAN: Kırpılmayan medya alanı */}
      {tumMedyalar.length > 0 && (
        <div className="relative flex w-full items-center justify-center overflow-hidden bg-gray-50">
          {videoMu(tumMedyalar[aktifMedyaIndex]) ? (
            <video
              key={tumMedyalar[aktifMedyaIndex]}
              src={tumMedyalar[aktifMedyaIndex]}
              controls
              playsInline
              className="h-auto max-h-[620px] w-full bg-black object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tumMedyalar[aktifMedyaIndex]}
              alt={temizBaslik || "Çocuklar Üşümesin Gönderisi"}
              loading="lazy"
              className="block h-auto w-full object-contain"
            />
          )}

          {/* Sol / Sağ kaydırma okları */}
          {tumMedyalar.length > 1 && (
            <>
              {aktifMedyaIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setAktifMedyaIndex((i) => i - 1)}
                  aria-label="Önceki görsel"
                  className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-xs transition hover:bg-white"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-[11px]" />
                </button>
              )}

              {aktifMedyaIndex < tumMedyalar.length - 1 && (
                <button
                  type="button"
                  onClick={() => setAktifMedyaIndex((i) => i + 1)}
                  aria-label="Sonraki görsel"
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-xs transition hover:bg-white"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-[11px]" />
                </button>
              )}

              {/* Alt nokta göstergeleri */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 backdrop-blur-xs">
                {tumMedyalar.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAktifMedyaIndex(idx)}
                    aria-label={`${idx + 1}. görsele git`}
                    className={`h-1.5 cursor-pointer rounded-full transition-all ${
                      idx === aktifMedyaIndex ? "w-4 bg-white" : "w-1.5 bg-white/55"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. ALT ALAN: Beğeni, görüntülenme, Tüm Gönderiler ve açıklama */}
      <div className="space-y-2.5 px-3.5 pb-3.5 pt-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={begeniDegistir}
              aria-pressed={begenildi}
              aria-label={begenildi ? "Beğeniyi geri al" : "Gönderiyi beğen"}
              className={`ui-focus inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold tabular-nums transition-colors ${
                begenildi
                  ? "border-red-100 bg-red-50 text-red-600"
                  : "border-gray-200 bg-white text-gray-700 hover:border-red-100 hover:bg-red-50/60"
              }`}
            >
              {begenildi ? (
                <GradyenIkon icon={faHeart} className="h-3 w-3 scale-110 transition-transform" gradyanId={gradyanId} />
              ) : (
                <FontAwesomeIcon icon={faHeart} className="text-[11px] text-red-400" />
              )}
              {begeniSayisi > 0 ? `${sayiFormati.format(begeniSayisi)} beğeni` : "Beğen"}
            </button>

            {goruntulenme > 0 && (
              <span className="inline-flex min-w-0 items-center gap-1 text-[10.5px] font-medium tabular-nums text-gray-400">
                <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                <span className="truncate">{sayiFormati.format(goruntulenme)}</span>
              </span>
            )}
          </div>

          {onTumCalismalar && (
            <button
              type="button"
              onClick={onTumCalismalar}
              className="ui-focus group inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white pl-3 pr-2.5 text-[11px] font-semibold text-gray-700 transition-colors hover:border-orange-200 hover:text-orange-600"
            >
              Tüm Gönderiler
              <FontAwesomeIcon icon={faArrowRight} className="text-[9px] transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Açıklama metni (varsa) */}
        {(temizBaslik || aciklamaMetni) && (
          <div className="break-words text-[12.5px] leading-relaxed text-gray-700 [overflow-wrap:anywhere]">
            <span className="mr-1.5 font-bold text-gray-900">cocuklar_usumes</span>
            {temizBaslik && (
              <span className="font-semibold text-gray-800">
                {temizBaslik}
                {aciklamaMetni ? " — " : ""}
              </span>
            )}
            {aciklamaMetni && (
              <span>
                {uzunMetinMi && !devamiAcik ? `${aciklamaMetni.slice(0, 140)}… ` : aciklamaMetni}
              </span>
            )}
            {uzunMetinMi && (
              <button
                type="button"
                onClick={() => setDevamiAcik(!devamiAcik)}
                className="ml-1 cursor-pointer font-semibold text-orange-500 hover:text-orange-600"
              >
                {devamiAcik ? "daha az" : "devamını oku"}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function Calismalarimiz({
  limit,
  onTumCalismalar,
}: {
  limit?: number;
  onTumCalismalar?: () => void;
} = {}) {
  const [gonderiler, setGonderiler] = useState<DilekGonderisi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `calismalar-gradyan-${benzersizId}`;

  useEffect(() => {
    async function gonderileriGetir() {
      try {
        const { data, error } = await supabase
          .from("gerceklesen_dilekler")
          .select("*")
          .order("sira", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(limit ?? 50);

        if (error) throw error;
        if (data) setGonderiler(data);
      } catch (err) {
        console.error("Çalışmalarımız çekilemedi:", err);
      } finally {
        setYukleniyor(false);
      }
    }
    gonderileriGetir();
  }, [limit]);

  return (
    <section aria-label="Çalışmalarımız" className="w-full space-y-3.5">
      <GradyanTanimi id={gradyanId} />

      {yukleniyor ? (
        <div className="space-y-3.5">
          {(limit === 1 ? [1] : [1, 2]).map((n) => (
            <div key={n} className="donation-panel animate-pulse space-y-3 overflow-hidden p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-gray-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 rounded bg-gray-100" />
                  <div className="h-2.5 w-20 rounded bg-gray-100" />
                </div>
              </div>
              <div className="h-80 w-full rounded-xl bg-gray-100" />
              <div className="flex justify-between">
                <div className="h-7 w-24 rounded-full bg-gray-100" />
                <div className="h-7 w-28 rounded-full bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : gonderiler.length === 0 ? (
        <div className="donation-panel p-6 text-center text-xs text-gray-500">
          Henüz eklenmiş çalışma bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {gonderiler.map((gonderi) => (
            <InstagramGonderiKarti
              key={gonderi.id}
              gonderi={gonderi}
              gradyanId={gradyanId}
              onTumCalismalar={onTumCalismalar}
            />
          ))}
        </div>
      )}
    </section>
  );
}
