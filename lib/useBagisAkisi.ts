import { useCallback, useEffect, useState } from "react";
import type { Urun } from "@/components/bagis/types";
import { sonBagisKaydet } from "@/lib/sonBagis";
import { ANA_SAYFA_OLAYI } from "@/lib/olaylar";

/** 0: Tutar/Sepet, 1: Ödeme, 2: Bilgileriniz, 3: Teşekkür */
export type BagisAdimi = 0 | 1 | 2 | 3;

/** Tutar kutusunda yalnızca rakam, nokta ve virgüle izin verir. */
export function tutarGirdisiTemizle(deger: string): string {
  return deger.replace(/[^\d.,]/g, "");
}

/**
 * "1.000", "500,00", "1.250,50", "1000.5" gibi girişleri sayıya çevirir.
 * Virgül varsa ondalık ayırıcıdır (noktalar binlik); yalnızca nokta varsa
 * 3'lü gruplar binlik, aksi hâlde son nokta ondalık sayılır.
 * Geçersiz veya boş girişte 0 döner.
 */
export function tutarCoz(deger: string): number {
  let metin = tutarGirdisiTemizle(deger);
  if (!metin) return 0;
  if (metin.includes(",")) {
    const son = metin.lastIndexOf(",");
    metin =
      metin.slice(0, son).replace(/[.,]/g, "") +
      "." +
      metin.slice(son + 1).replace(/[.,]/g, "");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(metin)) {
    metin = metin.replace(/\./g, "");
  } else {
    const son = metin.lastIndexOf(".");
    if (son !== -1) {
      metin =
        metin.slice(0, son).replace(/\./g, "") + "." + metin.slice(son + 1);
    }
  }
  const sayi = Number(metin);
  return Number.isFinite(sayi) && sayi > 0 ? sayi : 0;
}

function yukariKaydir() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * `/` (hızlı nakdi bağış) ve `/destek` (kataloglu sepet) görünümlerinin ortak
 * bağış akışı: adımlar, sepet, bağışçı formu, `/api/bagis` kaydı ve 24 saat
 * geçerli düzenleme token'ının `localStorage`'a yazılması tek yerden yönetilir.
 */
export function useBagisAkisi({
  urunler,
  nakdiTamSayi = false,
  onAnaSayfa,
}: {
  /** Sepete eklenebilen (aktif) ürünler; hızlı görünümde verilmez. */
  urunler?: Urun[];
  /** Nakdi tutarı tam liraya yuvarlar (sunucu da tam lira saklar). */
  nakdiTamSayi?: boolean;
  /** Header logosuna tıklanınca çağrılır (ör. ilk sekmeye dönmek için). */
  onAnaSayfa?: () => void;
} = {}) {
  const [step, setStep] = useState<BagisAdimi>(0);
  const [sepet, setSepet] = useState<Record<number, number>>({});
  const [nakdiTutar, setNakdiTutar] = useState("");

  const [adSoyad, setAdSoyad] = useState("");
  const [instagram, setInstagram] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const adetDegistir = useCallback((urunId: number, degisim: number) => {
    setSepet((onceki) => {
      const yeni = Math.max(0, (onceki[urunId] || 0) + degisim);
      if (yeni === 0) {
        const kopya = { ...onceki };
        delete kopya[urunId];
        return kopya;
      }
      return { ...onceki, [urunId]: yeni };
    });
  }, []);

  const urunlerToplami = (urunler ?? []).reduce(
    (toplam, u) => toplam + u.fiyat * (sepet[u.id] || 0),
    0
  );
  const hamNakdi = tutarCoz(nakdiTutar);
  const nakdiSayi = nakdiTamSayi ? Math.round(hamNakdi) : hamNakdi;
  const genelToplam = urunlerToplami + nakdiSayi;

  const adimaGit = useCallback((adim: BagisAdimi) => {
    setStep(adim);
    yukariKaydir();
  }, []);

  /** Sepeti ve bağışçı formunu temizleyip başlangıç adımına döner. */
  const akisiSifirla = useCallback(() => {
    setStep(0);
    setSepet({});
    setNakdiTutar("");
    setAdSoyad("");
    setInstagram("");
    setMesaj("");
    setIsAnonymous(false);
  }, []);

  const anaSayfayaDon = useCallback(() => {
    akisiSifirla();
    yukariKaydir();
  }, [akisiSifirla]);

  const bagisiTamamla = async () => {
    setKaydediliyor(true);
    try {
      // Kayıt sunucuda yapılır: fiyatlar ve toplam orada hesaplanır,
      // yanıtta 24 saat geçerli HMAC imzalı düzenleme token'ı gelir.
      const yanit = await fetch("/api/bagis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_soyad: adSoyad,
          instagram_kullanici_adi: instagram,
          mesaj,
          is_anonymous: isAnonymous,
          nakdi_tutar: nakdiSayi,
          sepet,
        }),
      });

      const sonuc: {
        id?: number;
        token?: string;
        bitis?: number;
        error?: string;
      } = await yanit.json().catch(() => ({}));

      if (!yanit.ok || !sonuc.id) {
        throw new Error(sonuc.error || "Bağış kaydedilemedi");
      }

      if (sonuc.token && sonuc.bitis) {
        sonBagisKaydet({
          id: Number(sonuc.id),
          token: sonuc.token,
          bitis: sonuc.bitis,
        });
      }

      adimaGit(3);
    } catch (err) {
      console.error("Bağış kayıt hatası:", err);
      alert("Bağışınız kaydedilirken bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setKaydediliyor(false);
    }
  };

  // Header logosuna tıklanınca: başlangıca dön; teşekkür adımındaysa
  // tamamlanmış bağışın sepeti ve formu da temizlenir.
  useEffect(() => {
    const anaSayfa = () => {
      onAnaSayfa?.();
      if (step === 3) akisiSifirla();
      yukariKaydir();
    };
    window.addEventListener(ANA_SAYFA_OLAYI, anaSayfa);
    return () => window.removeEventListener(ANA_SAYFA_OLAYI, anaSayfa);
  }, [step, akisiSifirla, onAnaSayfa]);

  return {
    step,
    adimaGit,
    sepet,
    adetDegistir,
    nakdiTutar,
    setNakdiTutar,
    nakdiSayi,
    genelToplam,
    adSoyad,
    setAdSoyad,
    instagram,
    setInstagram,
    mesaj,
    setMesaj,
    isAnonymous,
    setIsAnonymous,
    kaydediliyor,
    bagisiTamamla,
    akisiSifirla,
    anaSayfayaDon,
  };
}

export type BagisAkisi = ReturnType<typeof useBagisAkisi>;
