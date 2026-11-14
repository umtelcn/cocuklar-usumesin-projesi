"use client";

import OdemeAdimi from "@/components/bagis/OdemeAdimi";
import BilgiAdimi from "@/components/bagis/BilgiAdimi";
import TesekkurAdimi from "@/components/bagis/TesekkurAdimi";
import type { Urun } from "@/components/bagis/types";
import type { BagisAkisi } from "@/lib/useBagisAkisi";

/**
 * Bağış akışının iki görünümde (`/` ve `/destek`) birebir ortak adımları:
 * 1 Ödeme, 2 Bilgileriniz, 3 Teşekkür. Adım 0 görünüme özeldir ve burada
 * çizilmez.
 */
export default function BagisAdimlari({
  akis,
  urunler = [],
}: {
  akis: BagisAkisi;
  /** Sepetteki ürünlerin adları için; hızlı nakdi görünümde verilmez. */
  urunler?: Urun[];
}) {
  // Adımlar, bağışın sunucuya gidecek (gerekirse yuvarlanmış) tutarını gösterir.
  const nakdiTutar = akis.nakdiSayi > 0 ? String(akis.nakdiSayi) : "";

  if (akis.step === 1) {
    return (
      <OdemeAdimi
        urunler={urunler}
        sepet={akis.sepet}
        nakdiTutar={nakdiTutar}
        genelToplam={akis.genelToplam}
        geriDon={() => akis.adimaGit(0)}
        ileriGit={() => akis.adimaGit(2)}
      />
    );
  }

  if (akis.step === 2) {
    return (
      <BilgiAdimi
        adSoyad={akis.adSoyad}
        setAdSoyad={akis.setAdSoyad}
        instagram={akis.instagram}
        setInstagram={akis.setInstagram}
        mesaj={akis.mesaj}
        setMesaj={akis.setMesaj}
        isAnonymous={akis.isAnonymous}
        setIsAnonymous={akis.setIsAnonymous}
        kaydediliyor={akis.kaydediliyor}
        geriDon={() => akis.adimaGit(1)}
        bagisiTamamla={akis.bagisiTamamla}
      />
    );
  }

  if (akis.step === 3) {
    return (
      <TesekkurAdimi
        adSoyad={akis.adSoyad}
        urunler={urunler}
        sepet={akis.sepet}
        nakdiTutar={nakdiTutar}
        anaSayfayaDon={akis.anaSayfayaDon}
      />
    );
  }

  return null;
}
