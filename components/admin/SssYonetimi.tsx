"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faCircleQuestion,
  faFloppyDisk,
  faPlus,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { adminIstek, hataMesaji } from "@/lib/adminApi";
import {
  ALAN_SINIFI,
  BUTON,
  BosDurum,
  ETIKET_SINIFI,
  HataKutusu,
  METIN_ALANI_SINIFI,
  ModulBasligi,
  Yukleniyor,
  useBildirim,
} from "@/components/admin/ortak";

type Soru = {
  id: string;
  soru: string;
  cevap: string;
  sira: number | null;
  created_at: string | null;
};

function SoruKarti({
  soru,
  sira,
  ilk,
  son,
  tasi,
  kaydet,
  sil,
  siralamaMesgul,
}: {
  soru: Soru;
  sira: number;
  ilk: boolean;
  son: boolean;
  tasi: (yon: -1 | 1) => void;
  kaydet: (alanlar: { soru: string; cevap: string }) => Promise<void>;
  sil: () => Promise<void>;
  siralamaMesgul: boolean;
}) {
  const [metinSoru, setMetinSoru] = useState(soru.soru);
  const [metinCevap, setMetinCevap] = useState(soru.cevap);
  const [islem, setIslem] = useState<"kaydet" | "sil" | null>(null);
  const degisti = metinSoru.trim() !== soru.soru || metinCevap.trim() !== soru.cevap;

  const gonder = async (e: FormEvent) => {
    e.preventDefault();
    setIslem("kaydet");
    await kaydet({ soru: metinSoru, cevap: metinCevap });
    setIslem(null);
  };

  return (
    <form onSubmit={gonder} className="donation-panel flex min-w-0 gap-2.5 p-3">
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button type="button" disabled={ilk || siralamaMesgul} onClick={() => tasi(-1)} aria-label="Yukarı taşı" className="ui-focus flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30">
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
        <span className="flex h-7 w-8 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600">{sira}</span>
        <button type="button" disabled={son || siralamaMesgul} onClick={() => tasi(1)} aria-label="Aşağı taşı" className="ui-focus flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-30">
          <FontAwesomeIcon icon={faArrowDown} />
        </button>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <input value={metinSoru} onChange={(e) => setMetinSoru(e.target.value)} maxLength={500} required aria-label="Soru" className={`${ALAN_SINIFI} font-semibold`} />
        <textarea value={metinCevap} onChange={(e) => setMetinCevap(e.target.value)} maxLength={5000} required rows={3} aria-label="Cevap" className={METIN_ALANI_SINIFI} />
        <div className="flex flex-wrap justify-end gap-2">
          {degisti && (
            <button
              type="button"
              onClick={() => {
                setMetinSoru(soru.soru);
                setMetinCevap(soru.cevap);
              }}
              className={BUTON.ikincil}
            >
              <FontAwesomeIcon icon={faXmark} />
              Geri al
            </button>
          )}
          <button type="submit" disabled={!degisti || islem !== null} className={`${BUTON.ana} h-9`}>
            <FontAwesomeIcon icon={islem === "kaydet" ? faSpinner : faFloppyDisk} spin={islem === "kaydet"} />
            Kaydet
          </button>
          <button
            type="button"
            disabled={islem !== null}
            onClick={async () => {
              setIslem("sil");
              await sil();
              setIslem(null);
            }}
            className={BUTON.tehlike}
            aria-label="Soruyu sil"
          >
            <FontAwesomeIcon icon={islem === "sil" ? faSpinner : faTrash} spin={islem === "sil"} />
          </button>
        </div>
      </div>
    </form>
  );
}

export default function SssYonetimi() {
  const bildir = useBildirim();
  const [liste, setListe] = useState<Soru[]>([]);
  const [yuklendi, setYuklendi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [yeniSoru, setYeniSoru] = useState("");
  const [yeniCevap, setYeniCevap] = useState("");
  const [ekleniyor, setEkleniyor] = useState(false);
  const [siralamaMesgul, setSiralamaMesgul] = useState(false);

  const [yenileme, setYenileme] = useState(0);

  // Açılışta ve "yenile" istendiğinde liste çekilir; bileşen kapanırsa yanıt yok sayılır.
  useEffect(() => {
    let iptal = false;
    adminIstek<{ data: Soru[] }>("sss")
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

  const ekle = async (e: FormEvent) => {
    e.preventDefault();
    setEkleniyor(true);
    try {
      const enBuyukSira = liste.reduce((m, s) => Math.max(m, s.sira ?? 0), 0);
      const { data } = await adminIstek<{ data: Soru }>("sss", {
        method: "POST",
        body: { soru: yeniSoru, cevap: yeniCevap, sira: enBuyukSira + 1 },
      });
      setListe((l) => [...l, data]);
      setYeniSoru("");
      setYeniCevap("");
      setFormAcik(false);
      bildir("Soru eklendi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setEkleniyor(false);
    }
  };

  const kaydet = async (id: string, alanlar: { soru: string; cevap: string }) => {
    try {
      const { data } = await adminIstek<{ data: Soru }>("sss", { method: "PATCH", body: { id, ...alanlar } });
      setListe((l) => l.map((s) => (s.id === id ? data : s)));
      bildir("Soru güncellendi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    }
  };

  const sil = async (s: Soru) => {
    if (!window.confirm(`"${s.soru}" sorusu silinsin mi?`)) return;
    try {
      await adminIstek("sss", { method: "DELETE", sorgu: { id: s.id } });
      setListe((l) => l.filter((x) => x.id !== s.id));
      bildir("Soru silindi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    }
  };

  const tasi = async (index: number, yon: -1 | 1) => {
    const hedef = index + yon;
    if (hedef < 0 || hedef >= liste.length) return;
    const onceki = liste;
    const yeni = [...liste];
    [yeni[index], yeni[hedef]] = [yeni[hedef], yeni[index]];
    const numarali = yeni.map((s, i) => ({ ...s, sira: i + 1 }));
    setListe(numarali);
    setSiralamaMesgul(true);
    try {
      await adminIstek("sss", { method: "PUT", body: { siralama: numarali.map((s) => s.id) } });
    } catch (err) {
      setListe(onceki);
      bildir(hataMesaji(err), "hata");
    } finally {
      setSiralamaMesgul(false);
    }
  };

  return (
    <section className="min-w-0 space-y-3">
      <ModulBasligi
        ikon={faCircleQuestion}
        baslik="Sıkça Sorulan Sorular"
        aciklama={yuklendi ? `${liste.length} soru · Hakkımızda bölümünde gösterilir` : "Yükleniyor..."}
        sag={
          !formAcik && (
            <button type="button" onClick={() => setFormAcik(true)} className={BUTON.ana}>
              <FontAwesomeIcon icon={faPlus} />
              Yeni Soru
            </button>
          )
        }
      />

      {formAcik && (
        <form onSubmit={ekle} className="donation-panel min-w-0 space-y-3 p-3.5">
          <div>
            <label htmlFor="yeni-soru" className={ETIKET_SINIFI}>Soru</label>
            <input id="yeni-soru" required maxLength={500} value={yeniSoru} onChange={(e) => setYeniSoru(e.target.value)} className={ALAN_SINIFI} />
          </div>
          <div>
            <label htmlFor="yeni-cevap" className={ETIKET_SINIFI}>Cevap</label>
            <textarea id="yeni-cevap" required rows={4} maxLength={5000} value={yeniCevap} onChange={(e) => setYeniCevap(e.target.value)} className={METIN_ALANI_SINIFI} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={ekleniyor} className={`${BUTON.ana} flex-1`}>
              <FontAwesomeIcon icon={ekleniyor ? faSpinner : faPlus} spin={ekleniyor} />
              Ekle
            </button>
            <button type="button" onClick={() => setFormAcik(false)} className={`${BUTON.ikincil} h-10`}>
              Vazgeç
            </button>
          </div>
        </form>
      )}

      {!yuklendi ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu metin={hata} yenidenDene={getir} />
      ) : liste.length === 0 ? (
        <BosDurum metin="Henüz soru eklenmemiş." />
      ) : (
        <div className="space-y-2.5">
          {liste.map((s, i) => (
            <SoruKarti
              key={`${s.id}-${s.soru}-${s.cevap}`}
              soru={s}
              sira={i + 1}
              ilk={i === 0}
              son={i === liste.length - 1}
              siralamaMesgul={siralamaMesgul}
              tasi={(yon) => void tasi(i, yon)}
              kaydet={(alanlar) => kaydet(s.id, alanlar)}
              sil={() => sil(s)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
