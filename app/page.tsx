"use client";

import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabaseClient";
import HizliGorunum from "@/components/gorunum/HizliGorunum";
import SepetGorunumu from "@/components/gorunum/SepetGorunumu";

const SEPET_MODU_ANAHTARI = "hikaye_sepet_modu";
const ZIYARET_ANAHTARI = "site_ziyaret_edildi";

/** `/?destek=1` (veya `?hikaye`, `?sepet`) ile gelindiyse ya da bu oturumda daha önce gelindiyse true. */
function sepetModuAktifMi(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return (
      params.has("destek") ||
      params.has("hikaye") ||
      params.has("sepet") ||
      sessionStorage.getItem(SEPET_MODU_ANAHTARI) === "aktif"
    );
  } catch {
    return false;
  }
}

const aboneOlma = () => () => {};
const sunucudaSepetModu = () => false;

export default function AnaSayfa() {
  const sepetModu = useSyncExternalStore(
    aboneOlma,
    sepetModuAktifMi,
    sunucudaSepetModu
  );

  useEffect(() => {
    try {
      // Oturum boyunca sepet görünümünde kal (sekme/yenileme sonrası da).
      if (sepetModu) sessionStorage.setItem(SEPET_MODU_ANAHTARI, "aktif");

      if (!sessionStorage.getItem(ZIYARET_ANAHTARI)) {
        Promise.resolve({ error: null }).then(({ error }) => {
          if (!error) sessionStorage.setItem(ZIYARET_ANAHTARI, "true");
        });
      }
    } catch {
      // oturum depolaması kapalıysa sayaç ve kalıcı mod devre dışı kalır
    }
  }, [sepetModu]);

  return sepetModu ? <SepetGorunumu /> : <HizliGorunum />;
}
