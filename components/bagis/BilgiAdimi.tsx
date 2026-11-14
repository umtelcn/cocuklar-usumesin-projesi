"use client";

import { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import {
  faArrowLeft,
  faShieldHalved,
  faSpinner,
  faCheck,
  faUser,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";

interface BilgiAdimiProps {
  adSoyad: string;
  setAdSoyad: (v: string) => void;
  instagram: string;
  setInstagram: (v: string) => void;
  mesaj: string;
  setMesaj: (v: string) => void;
  isAnonymous: boolean;
  setIsAnonymous: (v: boolean) => void;
  kaydediliyor: boolean;
  geriDon: () => void;
  bagisiTamamla: () => void;
}

export default function BilgiAdimi({
  adSoyad,
  setAdSoyad,
  instagram,
  setInstagram,
  mesaj,
  setMesaj,
  isAnonymous,
  setIsAnonymous,
  kaydediliyor,
  geriDon,
  bagisiTamamla,
}: BilgiAdimiProps) {
  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `bilgi-gradyan-${benzersizId}`;

  const adId = `bilgi-ad-${benzersizId}`;
  const instagramId = `bilgi-instagram-${benzersizId}`;
  const mesajId = `bilgi-mesaj-${benzersizId}`;

  const isimGirildiMi = adSoyad.trim().length >= 2;

  const formuOnayla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isimGirildiMi) {
      alert("Lütfen adınızı ve soyadınızı giriniz.");
      return;
    }
    bagisiTamamla();
  };

  return (
    <section aria-label="Bilgileriniz" className="w-full space-y-2.5">
      <GradyanTanimi id={gradyanId} />

      <form
        onSubmit={formuOnayla}
        className="donation-panel relative isolate overflow-hidden space-y-3.5 p-4"
      >
        <h2 className="pt-0.5 text-base font-semibold tracking-tight text-gray-800">
          Bilgileriniz
        </h2>

        {/* Ad Soyad (Zorunlu) */}
        <div>
          <label
            htmlFor={adId}
            className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
          >
            <GradyenIkon icon={faUser} className="h-3 w-3" gradyanId={gradyanId} />
            <span>Adınız Soyadınız</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            id={adId}
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            placeholder="Adınız Soyadınız (Zorunlu)"
            value={adSoyad}
            onChange={(e) => setAdSoyad(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>

        {/* Instagram Kullanıcı Adı (İsteğe Bağlı) */}
        <div>
          <label
            htmlFor={instagramId}
            className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
          >
            <GradyenIkon icon={faInstagram} className="h-3.5 w-3.5" gradyanId={gradyanId} />
            <span>Instagram Kullanıcı Adı</span>
            <span className="text-[11px] font-normal text-gray-400">(İsteğe bağlı)</span>
          </label>
          <input
            id={instagramId}
            type="text"
            maxLength={60}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="@kullaniciadi"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>

        {/* Mesaj Alanı (İsteğe Bağlı) */}
        <div>
          <label
            htmlFor={mesajId}
            className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
          >
            <GradyenIkon icon={faComment} className="h-3.5 w-3.5" gradyanId={gradyanId} />
            <span>Mesajınız</span>
            <span className="text-[11px] font-normal text-gray-400">(İsteğe bağlı)</span>
          </label>
          <textarea
            id={mesajId}
            rows={3}
            maxLength={500}
            placeholder="Çocuklarımıza kısa bir not bırakabilirsiniz..."
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>

        {/* Anonim Seçeneği (Listede gizler ama teşekkür kartında ismini gösterir) */}
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 transition-colors hover:bg-gray-100/70">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded accent-orange-500"
          />
          <GradyenIkon
            icon={faShieldHalved}
            className="h-3.5 w-3.5 shrink-0"
            gradyanId={gradyanId}
          />
          <span className="text-xs font-medium text-gray-700">
            İsmimi ana sayfadaki bağış listesinde gizle
          </span>
        </label>

        {/* Alt Butonlar */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={geriDon}
            disabled={kaydediliyor}
            aria-label="Ödeme bilgilerine geri dön"
            className="ui-focus flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" aria-hidden="true" />
          </button>

          <button
            type="submit"
            disabled={kaydediliyor || !isimGirildiMi}
            className="ui-focus flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none sm:text-[13px]"
          >
            {kaydediliyor ? (
              <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
            ) : (
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
            )}
            <span>{kaydediliyor ? "Kaydediliyor..." : "Bağışımı Tamamla"}</span>
          </button>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
        />
      </form>
    </section>
  );
}
