"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faFloppyDisk,
  faImage,
  faPlus,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { adminIstek, dosyaYukle, hataMesaji } from "@/lib/adminApi";
import {
  ALAN_SINIFI,
  BUTON,
  BosDurum,
  Dugme,
  ETIKET_SINIFI,
  HataKutusu,
  ModulBasligi,
  Yukleniyor,
  useBildirim,
} from "@/components/admin/ortak";

type Urun = {
  id: number;
  ad: string;
  fiyat: number;
  gorsel_yolu: string;
  aktif: boolean;
  sira: number;
};

const GORSEL_TURLERI = "image/jpeg,image/png,image/webp";
const EN_FAZLA_GORSEL = 10 * 1024 * 1024;

function gorselGecerliMi(dosya: File): string | null {
  if (!/\.(jpe?g|png|webp)$/i.test(dosya.name)) return "Yalnızca JPG, PNG veya WEBP görsel yükleyin.";
  if (dosya.size > EN_FAZLA_GORSEL) return "Görsel en fazla 10 MB olabilir.";
  return null;
}

function UrunKarti({
  urun,
  guncelle,
  sil,
}: {
  urun: Urun;
  guncelle: (alanlar: Partial<Omit<Urun, "id">>) => Promise<boolean>;
  sil: () => Promise<void>;
}) {
  const bildir = useBildirim();
  const [ad, setAd] = useState(urun.ad);
  const [fiyat, setFiyat] = useState(String(urun.fiyat));
  const [sira, setSira] = useState(String(urun.sira));
  const [islem, setIslem] = useState<"kaydet" | "aktif" | "gorsel" | "sil" | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const degisti = ad.trim() !== urun.ad || Number(fiyat) !== urun.fiyat || Number(sira) !== urun.sira;

  const kaydet = async (e: FormEvent) => {
    e.preventDefault();
    if (!ad.trim()) return bildir("Ürün adı boş olamaz.", "hata");
    setIslem("kaydet");
    await guncelle({ ad: ad.trim(), fiyat: Number(fiyat), sira: Number(sira) });
    setIslem(null);
  };

  const aktifDegistir = async (aktif: boolean) => {
    setIslem("aktif");
    await guncelle({ aktif });
    setIslem(null);
  };

  const gorselDegistir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;
    const sorun = gorselGecerliMi(dosya);
    if (sorun) return bildir(sorun, "hata");
    setIslem("gorsel");
    try {
      const url = await dosyaYukle("urun-gorselleri", dosya);
      await guncelle({ gorsel_yolu: url });
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    }
    setIslem(null);
  };

  return (
    <article className={`donation-panel min-w-0 space-y-3 p-3 ${urun.aktif ? "" : "bg-gray-50/80"}`}>
      <div className="flex min-w-0 gap-3">
        <button
          type="button"
          onClick={() => dosyaRef.current?.click()}
          disabled={islem !== null}
          aria-label="Görseli değiştir"
          className={`ui-focus relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 ${urun.aktif ? "" : "grayscale"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urun.gorsel_yolu} alt={urun.ad} loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-0.5 text-[10px] font-semibold text-white">
            <FontAwesomeIcon icon={islem === "gorsel" ? faSpinner : faImage} spin={islem === "gorsel"} />
            Değiştir
          </span>
        </button>
        <input ref={dosyaRef} type="file" accept={GORSEL_TURLERI} className="hidden" onChange={gorselDegistir} />

        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={`urun-ad-${urun.id}`}
            aria-label="Ürün adı"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            className={`${ALAN_SINIFI} h-9 font-semibold`}
            maxLength={120}
            form={`urun-form-${urun.id}`}
          />
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-gray-50 px-2.5 py-1.5">
            <span className={`min-w-0 truncate text-[11px] font-semibold ${urun.aktif ? "text-emerald-700" : "text-gray-500"}`}>
              {urun.aktif ? "Aktif · sitede görünür" : "Pasif · gizli"}
            </span>
            <Dugme
              acik={urun.aktif}
              degistir={(yeni) => void aktifDegistir(yeni)}
              etiket={`${urun.ad} aktif`}
              mesgul={islem !== null}
            />
          </div>
        </div>
      </div>

      <form id={`urun-form-${urun.id}`} onSubmit={kaydet} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
        <div className="min-w-0">
          <label className={ETIKET_SINIFI} htmlFor={`urun-fiyat-${urun.id}`}>Fiyat (₺)</label>
          <input
            id={`urun-fiyat-${urun.id}`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={fiyat}
            onChange={(e) => setFiyat(e.target.value)}
            className={`${ALAN_SINIFI} h-9 px-2.5`}
          />
        </div>
        <div className="min-w-0">
          <label className={ETIKET_SINIFI} htmlFor={`urun-sira-${urun.id}`}>Sıra</label>
          <input
            id={`urun-sira-${urun.id}`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={sira}
            onChange={(e) => setSira(e.target.value)}
            className={`${ALAN_SINIFI} h-9 px-2.5`}
          />
        </div>
        <div className="flex gap-1.5">
          <button type="submit" disabled={!degisti || islem !== null} className={`${BUTON.ana} h-9 w-9 px-0`} aria-label="Kaydet">
            <FontAwesomeIcon icon={islem === "kaydet" ? faSpinner : faFloppyDisk} spin={islem === "kaydet"} />
          </button>
          <button
            type="button"
            disabled={islem !== null}
            onClick={async () => {
              setIslem("sil");
              await sil();
              setIslem(null);
            }}
            className={`${BUTON.tehlike} w-9 px-0`}
            aria-label={`${urun.ad} ürününü sil`}
          >
            <FontAwesomeIcon icon={islem === "sil" ? faSpinner : faTrash} spin={islem === "sil"} />
          </button>
        </div>
      </form>
    </article>
  );
}

function YeniUrunFormu({ eklendi, kapat }: { eklendi: (urun: Urun) => void; kapat: () => void }) {
  const bildir = useBildirim();
  const [ad, setAd] = useState("");
  const [fiyat, setFiyat] = useState("");
  const [sira, setSira] = useState("0");
  const [aktif, setAktif] = useState(true);
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => () => {
    if (onizleme) URL.revokeObjectURL(onizleme);
  }, [onizleme]);

  const gorselSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0] ?? null;
    if (dosya) {
      const sorun = gorselGecerliMi(dosya);
      if (sorun) {
        e.target.value = "";
        return bildir(sorun, "hata");
      }
    }
    setGorsel(dosya);
    setOnizleme(dosya ? URL.createObjectURL(dosya) : null);
  };

  const kaydet = async (e: FormEvent) => {
    e.preventDefault();
    if (!gorsel) return bildir("Lütfen ürün görseli seçin.", "hata");
    setKaydediliyor(true);
    try {
      const url = await dosyaYukle("urun-gorselleri", gorsel);
      const { data } = await adminIstek<{ data: Urun }>("urunler", {
        method: "POST",
        body: { ad, fiyat: Number(fiyat), sira: Number(sira), aktif, gorsel_yolu: url },
      });
      eklendi(data);
      bildir("Ürün eklendi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      setKaydediliyor(false);
    }
  };

  return (
    <form onSubmit={kaydet} className="donation-panel min-w-0 space-y-3 p-3.5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-800">Yeni Ürün</h3>
        <button type="button" onClick={kapat} aria-label="Formu kapat" className="ui-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <label className="ui-focus relative flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 hover:border-orange-300">
        {onizleme ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={onizleme} alt="Önizleme" className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          <>
            <FontAwesomeIcon icon={faImage} className="text-2xl text-gray-400" />
            Ürün görseli seç (JPG, PNG, WEBP)
          </>
        )}
        <input type="file" accept={GORSEL_TURLERI} className="sr-only" onChange={gorselSec} required />
      </label>

      <div>
        <label className={ETIKET_SINIFI} htmlFor="yeni-urun-ad">Ürün adı</label>
        <input id="yeni-urun-ad" required maxLength={120} value={ad} onChange={(e) => setAd(e.target.value)} className={ALAN_SINIFI} placeholder="Ör. Mont" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label className={ETIKET_SINIFI} htmlFor="yeni-urun-fiyat">Fiyat (₺)</label>
          <input id="yeni-urun-fiyat" required type="number" min={0} step={1} inputMode="numeric" value={fiyat} onChange={(e) => setFiyat(e.target.value)} className={ALAN_SINIFI} />
        </div>
        <div className="min-w-0">
          <label className={ETIKET_SINIFI} htmlFor="yeni-urun-sira">Sıra</label>
          <input id="yeni-urun-sira" type="number" min={0} step={1} inputMode="numeric" value={sira} onChange={(e) => setSira(e.target.value)} className={ALAN_SINIFI} />
        </div>
      </div>
      <label className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
        <span className="min-w-0 text-xs font-medium text-gray-600">{aktif ? "Aktif (sitede görünür)" : "Pasif (gizli)"}</span>
        <Dugme acik={aktif} degistir={setAktif} etiket="Ürün aktif" />
      </label>
      <button type="submit" disabled={kaydediliyor} className={`${BUTON.ana} w-full`}>
        <FontAwesomeIcon icon={kaydediliyor ? faSpinner : faPlus} spin={kaydediliyor} />
        {kaydediliyor ? "Ekleniyor..." : "Ürünü Ekle"}
      </button>
    </form>
  );
}

export default function UrunYonetimi() {
  const bildir = useBildirim();
  const [liste, setListe] = useState<Urun[]>([]);
  const [yuklendi, setYuklendi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [formAcik, setFormAcik] = useState(false);

  const [yenileme, setYenileme] = useState(0);

  // Açılışta ve "yenile" istendiğinde liste çekilir; bileşen kapanırsa yanıt yok sayılır.
  useEffect(() => {
    let iptal = false;
    adminIstek<{ data: Urun[] }>("urunler")
      .then(
        ({ data }) => {
          if (iptal) return;
          setListe(data);
          setHata(null);
        },
        (err) => {
          if (!iptal) setHata(hataMesaji(err));
        }
      )
      .finally(() => {
        if (!iptal) setYuklendi(true);
      });
    return () => {
      iptal = true;
    };
  }, [yenileme]);

  const getir = useCallback(() => setYenileme((n) => n + 1), []);

  const guncelle = async (id: number, alanlar: Partial<Omit<Urun, "id">>) => {
    try {
      const { data } = await adminIstek<{ data: Urun }>("urunler", { method: "PATCH", body: { id, ...alanlar } });
      setListe((l) => l.map((u) => (u.id === id ? data : u)));
      bildir(
        "aktif" in alanlar ? (data.aktif ? `${data.ad} aktif edildi.` : `${data.ad} pasif yapıldı.`) : "Ürün güncellendi."
      );
      return true;
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      return false;
    }
  };

  const sil = async (urun: Urun) => {
    if (!window.confirm(`"${urun.ad}" ürünü kalıcı olarak silinsin mi?`)) return;
    try {
      await adminIstek("urunler", { method: "DELETE", sorgu: { id: urun.id } });
      setListe((l) => l.filter((u) => u.id !== urun.id));
      bildir("Ürün silindi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    }
  };

  const sirali = [...liste].sort((a, b) => a.sira - b.sira || a.id - b.id);
  const aktifSayisi = liste.filter((u) => u.aktif).length;

  return (
    <section className="min-w-0 space-y-3">
      <ModulBasligi
        ikon={faBoxOpen}
        baslik="Ürünler"
        aciklama={yuklendi ? `${liste.length} ürün · ${aktifSayisi} aktif` : "Yükleniyor..."}
        sag={
          !formAcik && (
            <button type="button" onClick={() => setFormAcik(true)} className={BUTON.ana}>
              <FontAwesomeIcon icon={faPlus} />
              Yeni Ürün
            </button>
          )
        }
      />

      {formAcik && (
        <YeniUrunFormu
          kapat={() => setFormAcik(false)}
          eklendi={(urun) => {
            setListe((l) => [...l, urun]);
            setFormAcik(false);
          }}
        />
      )}

      {!yuklendi ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu metin={hata} yenidenDene={getir} />
      ) : sirali.length === 0 ? (
        <BosDurum metin="Henüz ürün eklenmemiş." />
      ) : (
        <div className="space-y-2.5">
          {sirali.map((u) => (
            <UrunKarti
              // Kayıt sonrası sunucudaki değerlerle form yeniden başlasın.
              key={`${u.id}-${u.ad}-${u.fiyat}-${u.sira}`}
              urun={u}
              guncelle={(alanlar) => guncelle(u.id, alanlar)}
              sil={() => sil(u)}
            />
          ))}
        </div>
      )}

      {yuklendi && !hata && liste.length > 0 && (
        <p className="text-center text-[11px] text-gray-400">
          Geçmiş bağışlarda kullanılan ürünler silinemez; bunun yerine pasif yapılabilir.
        </p>
      )}
    </section>
  );
}
