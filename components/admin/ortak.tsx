"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faSpinner,
  faXmark,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import GradyenIkon from "@/components/ui/GradyenIkon";

/** Paneldeki tüm GradyenIkon'ların paylaştığı gradyan tanımının kimliği. */
export const ADMIN_GRADYAN = "admin-panel-gradyan";

export const ETIKET_SINIFI =
  "mb-1.5 block text-xs font-medium text-gray-700";
export const ALAN_SINIFI =
  "h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none disabled:opacity-60";
export const METIN_ALANI_SINIFI =
  "w-full min-w-0 resize-y rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none disabled:opacity-60";

const BUTON_TEMEL =
  "ui-focus inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const BUTON = {
  ana: `${BUTON_TEMEL} h-10 bg-gradient-to-r from-orange-500 to-red-500 px-4 text-white shadow-sm hover:from-orange-600 hover:to-red-600`,
  ikincil: `${BUTON_TEMEL} h-9 border border-gray-200 bg-white px-3 text-gray-700 hover:bg-gray-50`,
  tehlike: `${BUTON_TEMEL} h-9 border border-red-100 bg-red-50 px-3 text-red-600 hover:bg-red-100`,
  basari: `${BUTON_TEMEL} h-9 border border-emerald-100 bg-emerald-50 px-3 text-emerald-700 hover:bg-emerald-100`,
};

const tarihFormati = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function tarihBicimle(deger: string | null | undefined): string {
  if (!deger) return "—";
  const tarih = new Date(deger);
  return Number.isNaN(tarih.getTime()) ? "—" : tarihFormati.format(tarih);
}

export function videoMu(url: string): boolean {
  return /\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(url);
}

export function pdfMi(url: string): boolean {
  return /\.pdf(\?.*)?$/i.test(url);
}

/** Değeri, değişmeyi bıraktıktan `ms` sonra döndürür (arama kutuları için). */
export function useGecikmeliDeger<T>(deger: T, ms = 400): T {
  const [gecikmeli, setGecikmeli] = useState(deger);
  useEffect(() => {
    const zamanlayici = setTimeout(() => setGecikmeli(deger), ms);
    return () => clearTimeout(zamanlayici);
  }, [deger, ms]);
  return gecikmeli;
}

/* ------------------------------------------------------------------ */
/* Bildirimler (toast)                                                */
/* ------------------------------------------------------------------ */

type Bildirim = { id: number; metin: string; tur: "basari" | "hata" };
type BildirimFonksiyonu = (metin: string, tur?: Bildirim["tur"]) => void;

const BildirimBaglami = createContext<BildirimFonksiyonu>(() => {});

export function BildirimSaglayici({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Bildirim[]>([]);
  const sayac = useRef(0);

  const bildir = useCallback<BildirimFonksiyonu>((metin, tur = "basari") => {
    sayac.current += 1;
    const id = sayac.current;
    setListe((l) => [...l, { id, metin, tur }]);
    setTimeout(() => setListe((l) => l.filter((b) => b.id !== id)), 3500);
  }, []);

  return (
    <BildirimBaglami.Provider value={bildir}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] mx-auto flex max-w-md flex-col items-center gap-2 px-4"
      >
        {liste.map((b) => (
          <div
            key={b.id}
            role="status"
            className={`pointer-events-auto flex w-full min-w-0 items-center gap-2 break-words rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              b.tur === "hata" ? "bg-red-600" : "bg-gray-900"
            }`}
          >
            <FontAwesomeIcon
              icon={b.tur === "hata" ? faCircleExclamation : faCircleCheck}
              className={`shrink-0 ${b.tur === "hata" ? "text-white" : "text-emerald-400"}`}
            />
            <span className="min-w-0 break-words">{b.metin}</span>
          </div>
        ))}
      </div>
    </BildirimBaglami.Provider>
  );
}

export function useBildirim() {
  return useContext(BildirimBaglami);
}

/* ------------------------------------------------------------------ */
/* Ortak görsel parçalar                                               */
/* ------------------------------------------------------------------ */

export function ModulBasligi({
  ikon,
  baslik,
  aciklama,
  sag,
}: {
  ikon: IconDefinition;
  baslik: string;
  aciklama?: string;
  sag?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
        <GradyenIkon icon={ikon} gradyanId={ADMIN_GRADYAN} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="break-words text-base font-bold leading-tight text-gray-800">{baslik}</h2>
        {aciklama && <p className="break-words text-xs text-gray-500">{aciklama}</p>}
      </div>
      {sag && <div className="shrink-0">{sag}</div>}
    </div>
  );
}

export function Yukleniyor({ metin = "Yükleniyor..." }: { metin?: string }) {
  return (
    <div className="donation-panel flex items-center justify-center gap-2 p-8 text-sm text-gray-500">
      <FontAwesomeIcon icon={faSpinner} spin className="text-orange-500" />
      {metin}
    </div>
  );
}

export function BosDurum({ metin }: { metin: string }) {
  return (
    <div className="donation-panel p-8 text-center text-sm text-gray-500">{metin}</div>
  );
}

export function HataKutusu({
  metin,
  yenidenDene,
}: {
  metin: string;
  yenidenDene?: () => void;
}) {
  return (
    <div className="donation-panel flex flex-col items-center gap-3 p-6 text-center text-sm text-red-600">
      <span className="max-w-full break-words">
        <FontAwesomeIcon icon={faCircleExclamation} className="mr-1.5" />
        {metin}
      </span>
      {yenidenDene && (
        <button type="button" onClick={yenidenDene} className={BUTON.ikincil}>
          Tekrar dene
        </button>
      )}
    </div>
  );
}

export function Dugme({
  acik,
  degistir,
  etiket,
  mesgul = false,
}: {
  acik: boolean;
  degistir: (yeni: boolean) => void;
  etiket: string;
  mesgul?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acik}
      aria-label={etiket}
      disabled={mesgul}
      onClick={() => degistir(!acik)}
      className={`ui-focus relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
        acik ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          acik ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/** Filtre çipleri (durum seçimi vb.). */
export function FiltreCipleri<T extends string>({
  secenekler,
  secili,
  sec,
}: {
  secenekler: { deger: T; etiket: string }[];
  secili: T;
  sec: (deger: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {secenekler.map((s) => (
        <button
          key={s.deger}
          type="button"
          onClick={() => sec(s.deger)}
          className={`ui-focus rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            secili === s.deger
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {s.etiket}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal ve galeri                                                     */
/* ------------------------------------------------------------------ */

export function Modal({
  acik,
  kapat,
  baslik,
  children,
  genis = false,
}: {
  acik: boolean;
  kapat: () => void;
  baslik: string;
  children: ReactNode;
  genis?: boolean;
}) {
  const baslikId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const tusDinle = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    document.addEventListener("keydown", tusDinle);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", tusDinle);
  }, [acik, kapat]);

  if (!acik) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-gray-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) kapat();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={baslikId}
        tabIndex={-1}
        className={`flex max-h-[92vh] w-full min-w-0 flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl ${
          genis ? "sm:max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3.5">
          <h3 id={baslikId} className="min-w-0 truncate text-sm font-bold text-gray-800">
            {baslik}
          </h3>
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="ui-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="min-w-0 overflow-y-auto overflow-x-hidden p-4">{children}</div>
      </div>
    </div>
  );
}

/** Fotoğraf/video galerisi; ok tuşları ve butonlarla gezinilir. */
export function GaleriModal({
  medyalar,
  baslangic,
  kapat,
}: {
  medyalar: string[];
  baslangic: number | null;
  kapat: () => void;
}) {
  const [index, setIndex] = useState(baslangic ?? 0);
  const [oncekiBaslangic, setOncekiBaslangic] = useState(baslangic);
  if (baslangic !== oncekiBaslangic) {
    setOncekiBaslangic(baslangic);
    setIndex(baslangic ?? 0);
  }

  const acik = baslangic !== null && medyalar.length > 0;
  const toplam = medyalar.length;
  const onceki = useCallback(() => setIndex((i) => (i - 1 + toplam) % toplam), [toplam]);
  const sonraki = useCallback(() => setIndex((i) => (i + 1) % toplam), [toplam]);

  useEffect(() => {
    if (!acik) return;
    const tusDinle = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
      if (e.key === "ArrowLeft") onceki();
      if (e.key === "ArrowRight") sonraki();
    };
    document.addEventListener("keydown", tusDinle);
    return () => document.removeEventListener("keydown", tusDinle);
  }, [acik, kapat, onceki, sonraki]);

  if (!acik) return null;
  const aktif = medyalar[Math.min(index, toplam - 1)];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Medya galerisi"
      className="fixed inset-0 z-[85] flex flex-col bg-black/90"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) kapat();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {index + 1} / {toplam}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={aktif}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
          >
            Yeni sekmede aç
          </a>
          <button
            type="button"
            onClick={kapat}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
          >
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) kapat();
        }}
      >
        {videoMu(aktif) ? (
          <video key={aktif} src={aktif} controls playsInline className="max-h-full max-w-full rounded-lg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={aktif} alt={`Görsel ${index + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
        )}

        {toplam > 1 && (
          <>
            <button
              type="button"
              onClick={onceki}
              aria-label="Önceki"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              type="button"
              onClick={sonraki}
              aria-label="Sonraki"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Küçük önizleme: video ise oynatılmayan kare, değilse görsel. */
export function MedyaOnizleme({
  url,
  alt,
  className = "h-full w-full object-cover",
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  if (videoMu(url)) {
    return <video src={`${url}#t=0.1`} muted playsInline preload="metadata" className={className} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}
