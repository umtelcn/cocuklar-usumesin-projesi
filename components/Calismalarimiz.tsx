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

function videoMu(url: string) {
  return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

function InstagramGonderiKarti({
  gonderi,
  gradyanId,
}: {
  gonderi: DilekGonderisi;
  gradyanId: string;
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
      {/* 1. ÜST BAR: Instagram Profil Başlığı */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100/80">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 shrink-0 rounded-full bg-white shadow-sm border border-gray-100 p-0.5">
            <img
              src="/logo.webp"
              alt="Çocuklar Üşümesin"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-900">
                cocuklar_usumes
              </span>
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="text-[11px] text-blue-500"
              />
            </div>
            {temizBaslik && (
              <p className="text-[11px] font-normal text-gray-500 line-clamp-1">
                {temizBaslik}
              </p>
            )}
          </div>
        </div>

        {tumMedyalar.length > 1 && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 tabular-nums">
            {aktifMedyaIndex + 1}/{tumMedyalar.length}
          </span>
        )}
      </div>

      {/* 2. ORTA ALAN: HİÇ KIRPILMAYAN (TAM BOY 4:5 / 3:4) MEDYA ALANI */}
      {tumMedyalar.length > 0 && (
        <div className="relative w-full bg-white flex items-center justify-center overflow-hidden">
          {videoMu(tumMedyalar[aktifMedyaIndex]) ? (
            <video
              key={tumMedyalar[aktifMedyaIndex]}
              src={tumMedyalar[aktifMedyaIndex]}
              controls
              playsInline
              className="w-full h-auto max-h-[620px] object-contain bg-black"
            />
          ) : (
            <img
              src={tumMedyalar[aktifMedyaIndex]}
              alt={temizBaslik || "Çocuklar Üşümesin Gönderisi"}
              loading="lazy"
              className="w-full h-auto block object-contain"
            />
          )}

          {/* Sol / Sağ Kaydırma Okları */}
          {tumMedyalar.length > 1 && (
            <>
              {aktifMedyaIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setAktifMedyaIndex((i) => i - 1)}
                  aria-label="Önceki görsel"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs transition-colors hover:bg-black/70"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>
              )}

              {aktifMedyaIndex < tumMedyalar.length - 1 && (
                <button
                  type="button"
                  onClick={() => setAktifMedyaIndex((i) => i + 1)}
                  aria-label="Sonraki görsel"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs transition-colors hover:bg-black/70"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              )}

              {/* Alt Nokta Göstergeleri */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 backdrop-blur-xs">
                {tumMedyalar.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAktifMedyaIndex(idx)}
                    aria-label={`${idx + 1}. görsele git`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === aktifMedyaIndex
                        ? "w-4 bg-white"
                        : "w-1.5 bg-white/55"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. ALT ALAN: Beğeni ve Açıklama */}
      <div className="p-3.5 space-y-2 border-t border-gray-100/80">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={begeniDegistir}
            aria-pressed={begenildi}
            aria-label={begenildi ? "Beğeniyi geri al" : "Gönderiyi beğen"}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-800"
          >
            <GradyenIkon
              icon={faHeart}
              className={`h-4 w-4 transition-transform ${
                begenildi ? "scale-125" : ""
              }`}
              gradyanId={gradyanId}
            />
            {begeniSayisi > 0 && (
              <span className="tabular-nums">
                {begeniSayisi.toLocaleString("tr-TR")} beğenme
              </span>
            )}
          </button>

          {(gonderi.goruntulenme ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 tabular-nums">
              <FontAwesomeIcon icon={faEye} className="text-[11px]" />
              <span>{gonderi.goruntulenme!.toLocaleString("tr-TR")}</span>
            </span>
          )}
        </div>

        {/* Açıklama Metni (Varsa) */}
        {(temizBaslik || aciklamaMetni) && (
          <div className="text-xs leading-relaxed text-gray-700">
            <span className="font-bold text-gray-900 mr-1.5">
              cocuklar_usumes
            </span>
            {temizBaslik && (
              <span className="font-medium text-gray-800">
                {temizBaslik}
                {aciklamaMetni ? " — " : ""}
              </span>
            )}
            {aciklamaMetni && (
              <span>
                {uzunMetinMi && !devamiAcik
                  ? `${aciklamaMetni.slice(0, 140)}... `
                  : aciklamaMetni}
              </span>
            )}
            {uzunMetinMi && (
              <button
                type="button"
                onClick={() => setDevamiAcik(!devamiAcik)}
                className="ml-1 cursor-pointer font-medium text-gray-400 hover:text-gray-600"
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

export default function Calismalarimiz({ limit }: { limit?: number } = {}) {
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
          .order("sira", { ascending: true }).limit(limit ?? 50);

        if (error) throw error;
        if (data) setGonderiler(data);
      } catch (err) {
        console.error("Çalışmalarımız çekilemedi:", err);
      } finally {
        setYukleniyor(false);
      }
    }
    gonderileriGetir();
  }, []);

  return (
    <section aria-label="Çalışmalarımız" className="w-full space-y-3.5">
      <GradyanTanimi id={gradyanId} />

      {yukleniyor ? (
        <div className="space-y-3.5">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="donation-panel overflow-hidden p-3.5 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-gray-100" />
                <div className="h-4 w-32 rounded bg-gray-100" />
              </div>
              <div className="h-80 w-full rounded-xl bg-gray-100" />
              <div className="h-4 w-3/4 rounded bg-gray-100" />
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
            />
          ))}
        </div>
      )}
    </section>
  );
}
