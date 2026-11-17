"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCircleQuestion,
  faHandHoldingHeart,
  faHeart,
  faImages,
  faRotateLeft,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { supabase } from "@/lib/supabaseClient";
import { adminIstek, YetkiHatasi, hataMesaji } from "@/lib/adminApi";
import { GradyanTanimi } from "@/components/ui/GradyenIkon";
import { ADMIN_GRADYAN, BildirimSaglayici } from "@/components/admin/ortak";
import AdminGiris from "@/components/admin/AdminGiris";
import OzetBari, { type Ozet } from "@/components/admin/OzetBari";
import GonderiYonetimi from "@/components/admin/GonderiYonetimi";
import TalepYonetimi from "@/components/admin/TalepYonetimi";
import IadeYonetimi from "@/components/admin/IadeYonetimi";
import UrunYonetimi from "@/components/admin/UrunYonetimi";
import BagisYonetimi from "@/components/admin/BagisYonetimi";
import SssYonetimi from "@/components/admin/SssYonetimi";

type ModulId = "gonderiler" | "talepler" | "iadeler" | "urunler" | "bagislar" | "sss";

// Mobil sütunda 3x2 ızgara olarak gösterilir; sıra bilinçli seçilmiştir.
const MODULLER: { id: ModulId; etiket: string; ikon: IconDefinition }[] = [
  { id: "gonderiler", etiket: "Gönderiler", ikon: faImages },
  { id: "talepler", etiket: "Yardım Talepleri", ikon: faHandHoldingHeart },
  { id: "bagislar", etiket: "Bağışlar", ikon: faHeart },
  { id: "urunler", etiket: "Ürünler", ikon: faBoxOpen },
  { id: "iadeler", etiket: "İade Talepleri", ikon: faRotateLeft },
  { id: "sss", etiket: "SSS", ikon: faCircleQuestion },
];

type Durum = "kontrol" | "giris" | "hazir";

export default function AdminPanel() {
  const [durum, setDurum] = useState<Durum>("kontrol");
  const [girisHatasi, setGirisHatasi] = useState<string | null>(null);
  const [ozet, setOzet] = useState<Ozet | null>(null);
  const [aktifModul, setAktifModul] = useState<ModulId>("gonderiler");
  const menuRef = useRef<HTMLElement>(null);

  /** Oturumu sunucuda doğrular (profiles kaydı) ve özet verisini getirir. */
  const dogrulaVeOzetGetir = useCallback(async () => {
    try {
      const veri = await adminIstek<Ozet>("ozet");
      setOzet(veri);
      setGirisHatasi(null);
      setDurum("hazir");
    } catch (err) {
      if (err instanceof YetkiHatasi) {
        setGirisHatasi(err.message);
        setOzet(null);
        setDurum("giris");
        await supabase.auth.signOut();
      } else {
        // Ağ hatası vb.: oturum geçerli olabilir, panel açık kalsın.
        setGirisHatasi(hataMesaji(err));
        setDurum((d) => (d === "kontrol" ? "giris" : d));
      }
    }
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((olay, oturum) => {
      // Supabase, bu geri çağrının içinde başka auth çağrısı beklenmesini
      // önermez; doğrulama bir sonraki döngüye ertelenir.
      if (olay === "SIGNED_OUT" || !oturum) {
        setTimeout(() => {
          setOzet(null);
          setDurum("giris");
        }, 0);
        return;
      }
      if (olay === "INITIAL_SESSION" || olay === "SIGNED_IN") {
        setTimeout(() => void dogrulaVeOzetGetir(), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [dogrulaVeOzetGetir]);

  const ozetYenile = useCallback(() => {
    adminIstek<Ozet>("ozet")
      .then(setOzet)
      .catch(() => {});
  }, []);

  const cikisYap = async () => {
    await supabase.auth.signOut();
    setGirisHatasi(null);
  };

  const modulSec = (id: ModulId) => {
    setAktifModul(id);
    // Menü ekranın üstünde kalmışsa modül başlangıcı görünür olsun.
    const menu = menuRef.current;
    if (menu && menu.getBoundingClientRect().top < 0) {
      menu.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  return (
    // Panel, kök düzenin dar mobil sütununda (max-w-md) akar; hiçbir öğe yatay taşmaz.
    <div className="w-full min-w-0 max-w-full overflow-x-hidden text-gray-800">
      <GradyanTanimi id={ADMIN_GRADYAN} />
      <BildirimSaglayici>
        {durum === "kontrol" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <FontAwesomeIcon icon={faSpinner} spin className="text-orange-500" />
            Oturum kontrol ediliyor...
          </div>
        )}

        {durum === "giris" && <AdminGiris ilkHata={girisHatasi} />}

        {durum === "hazir" && (
          <div className="min-w-0 space-y-3 pb-10">
            <OzetBari
              ozet={ozet}
              yenile={ozetYenile}
              cikisYap={cikisYap}
              talepleriAc={() => modulSec("talepler")}
              iadeleriAc={() => modulSec("iadeler")}
            />

            <nav ref={menuRef} aria-label="Yönetim modülleri" className="scroll-mt-20">
              <ul className="grid grid-cols-3 gap-1.5">
                {MODULLER.map((m) => {
                  const secili = m.id === aktifModul;
                  const sayac =
                    m.id === "talepler"
                      ? ozet?.bekleyen_talep
                      : m.id === "iadeler"
                        ? ozet?.bekleyen_iade
                        : undefined;
                  return (
                    <li key={m.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => modulSec(m.id)}
                        aria-current={secili ? "page" : undefined}
                        className={`ui-focus relative flex h-full min-h-[68px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2.5 text-center text-[11px] font-semibold leading-tight transition-colors ${
                          secili
                            ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/20"
                            : "border border-slate-200/85 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
                        }`}
                      >
                        <FontAwesomeIcon icon={m.ikon} className={`text-base ${secili ? "text-white" : "text-orange-500"}`} />
                        <span className="block w-full break-words">{m.etiket}</span>
                        {!!sayac && (
                          <span
                            className={`absolute right-1 top-1 min-w-[18px] rounded-full px-1 py-0.5 text-[10px] font-bold leading-none ${
                              secili ? "bg-white text-red-600" : "bg-red-500 text-white"
                            }`}
                          >
                            {sayac > 99 ? "99+" : sayac}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="min-w-0">
              {aktifModul === "gonderiler" && <GonderiYonetimi />}
              {aktifModul === "talepler" && <TalepYonetimi ozetYenile={ozetYenile} />}
              {aktifModul === "iadeler" && <IadeYonetimi ozetYenile={ozetYenile} />}
              {aktifModul === "urunler" && <UrunYonetimi />}
              {aktifModul === "bagislar" && <BagisYonetimi />}
              {aktifModul === "sss" && <SssYonetimi />}
            </div>
          </div>
        )}
      </BildirimSaglayici>
    </div>
  );
}
