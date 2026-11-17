"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faArrowsRotate,
  faEye,
  faHandHoldingHeart,
  faRotateLeft,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import GradyenIkon from "@/components/ui/GradyenIkon";
import { ADMIN_GRADYAN } from "@/components/admin/ortak";

export type Ozet = {
  email: string | null;
  toplam_ziyaret: number;
  bekleyen_talep: number;
  bekleyen_iade: number;
};

const sayiFormati = new Intl.NumberFormat("tr-TR");

function Istatistik({
  ikon,
  etiket,
  deger,
  vurgulu = false,
  tikla,
}: {
  ikon: IconDefinition;
  etiket: string;
  deger: number | null;
  vurgulu?: boolean;
  tikla?: () => void;
}) {
  const icerik = (
    <>
      <span className={`flex items-center gap-1 text-[10px] font-medium leading-tight ${vurgulu ? "text-orange-700" : "text-gray-500"}`}>
        <FontAwesomeIcon icon={ikon} className={vurgulu ? "text-orange-500" : "text-gray-400"} />
        <span className="min-w-0 break-words">{etiket}</span>
      </span>
      <span className={`block truncate text-base font-extrabold ${vurgulu ? "text-orange-600" : "text-gray-800"}`}>
        {deger === null ? "…" : sayiFormati.format(deger)}
      </span>
    </>
  );
  const sinif = `flex min-w-0 flex-col items-start gap-0.5 rounded-xl border px-2.5 py-2 text-left ${
    vurgulu ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-gray-50"
  }`;
  return tikla ? (
    <button type="button" onClick={tikla} className={`ui-focus ${sinif} hover:brightness-95`}>
      {icerik}
    </button>
  ) : (
    <div className={sinif}>{icerik}</div>
  );
}

/** Oturum açıkken en üstte duran özet kartı: istatistikler ve çıkış. */
export default function OzetBari({
  ozet,
  yenile,
  cikisYap,
  talepleriAc,
  iadeleriAc,
}: {
  ozet: Ozet | null;
  yenile: () => void;
  cikisYap: () => void;
  talepleriAc: () => void;
  iadeleriAc: () => void;
}) {
  return (
    <header className="donation-panel min-w-0 space-y-3 p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
          <GradyenIkon icon={faShieldHalved} gradyanId={ADMIN_GRADYAN} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight text-gray-800">Yönetim Paneli</p>
          <p className="truncate text-[11px] text-gray-500">{ozet?.email ?? "Çocuklar Üşümesin"}</p>
        </div>
        <button
          type="button"
          onClick={yenile}
          aria-label="Özeti yenile"
          title="Yenile"
          className="ui-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faArrowsRotate} />
        </button>
        <button
          type="button"
          onClick={cikisYap}
          aria-label="Çıkış yap"
          className="ui-focus inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          Çıkış
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <Istatistik ikon={faEye} etiket="Ziyaret" deger={ozet?.toplam_ziyaret ?? null} />
        <Istatistik
          ikon={faHandHoldingHeart}
          etiket="Bekleyen talep"
          deger={ozet?.bekleyen_talep ?? null}
          vurgulu={(ozet?.bekleyen_talep ?? 0) > 0}
          tikla={talepleriAc}
        />
        <Istatistik
          ikon={faRotateLeft}
          etiket="Bekleyen iade"
          deger={ozet?.bekleyen_iade ?? null}
          vurgulu={(ozet?.bekleyen_iade ?? 0) > 0}
          tikla={iadeleriAc}
        />
      </div>
    </header>
  );
}
