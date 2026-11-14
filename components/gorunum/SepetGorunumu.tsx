"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useBagisAkisi } from "@/lib/useBagisAkisi";
import type { Urun } from "@/components/bagis/types";
import SekmeMenusu, { type Sekme } from "@/components/SekmeMenusu";
import SepetAdimi from "@/components/bagis/SepetAdimi";
import BagisAdimlari from "@/components/bagis/BagisAdimlari";
import IadeTalebi from "@/components/IadeTalebi";
import BagisListesi from "@/components/BagisListesi";
import Calismalarimiz from "@/components/Calismalarimiz";
import TalepFormu from "@/components/TalepFormu";
import Hakkimizda from "@/components/Hakkimizda";
import {
  faBasketShopping,
  faImages,
  faHandHoldingHeart,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

type SepetSekmesi = "sepet" | "calismalar" | "talep" | "hakkimizda";

const SEKMELER: Sekme<SepetSekmesi>[] = [
  { id: "sepet", etiket: "Bağış Yap", ikon: faBasketShopping },
  { id: "calismalar", etiket: "Çalışmalarımız", ikon: faImages },
  { id: "talep", etiket: "Yardım Talebi", ikon: faHandHoldingHeart },
  { id: "hakkimizda", etiket: "Hakkımızda", ikon: faCircleInfo },
];

/** `/destek` ve `/?destek=1`: kataloglu bağış sepeti görünümü. */
export default function SepetGorunumu() {
  const [aktifSekme, setAktifSekme] = useState<SepetSekmesi>("sepet");
  // Pasif ürünler de çekilir: geçmiş bağışların ürün adları listede gösterilir.
  const [tumUrunler, setTumUrunler] = useState<Urun[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    let iptal = false;
    supabase
      .from("urunler")
      .select("*")
      .order("sira", { ascending: true })
      .then(({ data, error }) => {
        if (iptal) return;
        if (error) console.error("Ürünler çekilemedi:", error);
        else if (data) setTumUrunler(data);
        setYukleniyor(false);
      });
    return () => {
      iptal = true;
    };
  }, []);

  const urunler = useMemo(
    () => tumUrunler.filter((u) => u.aktif),
    [tumUrunler]
  );

  const ilkSekmeyeDon = useCallback(() => setAktifSekme("sepet"), []);
  const akis = useBagisAkisi({ urunler, onAnaSayfa: ilkSekmeyeDon });

  return (
    <div className="w-full space-y-3 pb-10">
      <SekmeMenusu
        sekmeler={SEKMELER}
        aktifSekme={aktifSekme}
        setAktifSekme={(sekme) => {
          // Teşekkür adımından sonra herhangi bir sekmeye geçiş yeni bir
          // bağış akışı başlatır; eski sepet ve form taşınmaz.
          if (akis.step === 3) akis.akisiSifirla();
          setAktifSekme(sekme);
        }}
      />

      {/* 1. SEKME: BAĞIŞ SEPETİ */}
      {aktifSekme === "sepet" &&
        (akis.step === 0 ? (
          <>
            <SepetAdimi
              urunler={urunler}
              yukleniyor={yukleniyor}
              sepet={akis.sepet}
              adetDegistir={akis.adetDegistir}
              nakdiTutar={akis.nakdiTutar}
              setNakdiTutar={akis.setNakdiTutar}
              genelToplam={akis.genelToplam}
              ileriGit={() => akis.adimaGit(1)}
            />
            <IadeTalebi />
            <BagisListesi
              gorunum="urun"
              urunler={tumUrunler}
              urunlerYukleniyor={yukleniyor}
            />
          </>
        ) : (
          <BagisAdimlari akis={akis} urunler={urunler} />
        ))}

      {/* 2. SEKME: ÇALIŞMALARIMIZ (Instagram Gönderi Akışı) */}
      {aktifSekme === "calismalar" && <Calismalarimiz />}

      {/* 3. SEKME: YARDIM TALEBİ */}
      {aktifSekme === "talep" && <TalepFormu />}

      {/* 4. SEKME: HAKKIMIZDA VE SSS */}
      {aktifSekme === "hakkimizda" && <Hakkimizda />}
    </div>
  );
}
