"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCloudArrowUp,
  faEye,
  faFloppyDisk,
  faHeart,
  faImages,
  faPen,
  faPlus,
  faSpinner,
  faThumbtack,
  faTrash,
  faVideo,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { adminIstek, dosyaYukle, hataMesaji } from "@/lib/adminApi";
import {
  ALAN_SINIFI,
  BUTON,
  BosDurum,
  Dugme,
  ETIKET_SINIFI,
  GaleriModal,
  HataKutusu,
  METIN_ALANI_SINIFI,
  MedyaOnizleme,
  Modal,
  ModulBasligi,
  Yukleniyor,
  tarihBicimle,
  useBildirim,
  videoMu,
} from "@/components/admin/ortak";

type Gonderi = {
  id: string;
  baslik: string;
  kisa_ozet: string;
  uzun_metin: string;
  kapak_gorseli: string;
  medya_url: string[] | null;
  created_at: string | null;
  goruntulenme: number | null;
  sira: number | null;
  begeni_sayisi: number | null;
};

type SeciliDosya = { id: string; dosya: File; onizleme: string; video: boolean };

const KABUL_EDILENLER = ".jpg,.jpeg,.png,.webp,.mp4,.mov";
const UZANTI_DESENI = /\.(jpe?g|png|webp|mp4|mov)$/i;
const EN_FAZLA_BOYUT = 50 * 1024 * 1024;

function tumMedyalar(g: Gonderi): string[] {
  const liste: string[] = [];
  if (g.kapak_gorseli) liste.push(g.kapak_gorseli);
  (g.medya_url ?? []).forEach((m) => {
    if (m && !liste.includes(m)) liste.push(m);
  });
  return liste;
}

/* ------------------------------------------------------------------ */
/* Yeni gönderi formu                                                  */
/* ------------------------------------------------------------------ */

function YeniGonderiFormu({ eklendi, kapat }: { eklendi: () => void; kapat: () => void }) {
  const bildir = useBildirim();
  const [dosyalar, setDosyalar] = useState<SeciliDosya[]>([]);
  const [baslik, setBaslik] = useState("");
  const [kisaOzet, setKisaOzet] = useState("");
  const [uzunMetin, setUzunMetin] = useState("");
  const [begeni, setBegeni] = useState("0");
  const [sira, setSira] = useState("0");
  const [sabitle, setSabitle] = useState(true);
  const [ilerleme, setIlerleme] = useState<string | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const onizlemeler = useRef<string[]>([]);

  // Form kapanınca oluşturulan önizleme adresleri serbest bırakılır.
  useEffect(
    () => () => {
      onizlemeler.current.forEach((u) => URL.revokeObjectURL(u));
    },
    []
  );

  const dosyaEkle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const secilenler = Array.from(e.target.files ?? []);
    e.target.value = "";
    const yeniler: SeciliDosya[] = [];
    for (const dosya of secilenler) {
      if (!UZANTI_DESENI.test(dosya.name)) {
        bildir(`"${dosya.name}" desteklenmiyor (jpg, png, webp, mp4, mov).`, "hata");
        continue;
      }
      if (dosya.size > EN_FAZLA_BOYUT) {
        bildir(`"${dosya.name}" 50 MB'tan büyük.`, "hata");
        continue;
      }
      const onizleme = URL.createObjectURL(dosya);
      onizlemeler.current.push(onizleme);
      yeniler.push({
        id: `${dosya.name}-${dosya.size}-${onizleme}`,
        dosya,
        onizleme,
        video: /\.(mp4|mov)$/i.test(dosya.name),
      });
    }
    setDosyalar((d) => [...d, ...yeniler].slice(0, 30));
  };

  const dosyaKaldir = (id: string) => {
    setDosyalar((d) => {
      const kaldirilan = d.find((x) => x.id === id);
      if (kaldirilan) URL.revokeObjectURL(kaldirilan.onizleme);
      return d.filter((x) => x.id !== id);
    });
  };

  const tasi = (index: number, yon: -1 | 1) => {
    setDosyalar((d) => {
      const hedef = index + yon;
      if (hedef < 0 || hedef >= d.length) return d;
      const yeni = [...d];
      [yeni[index], yeni[hedef]] = [yeni[hedef], yeni[index]];
      return yeni;
    });
  };

  const kaydet = async (e: FormEvent) => {
    e.preventDefault();
    if (dosyalar.length === 0) return bildir("En az bir fotoğraf veya video seçin.", "hata");

    try {
      const urller: string[] = [];
      for (let i = 0; i < dosyalar.length; i++) {
        setIlerleme(`Yükleniyor ${i + 1}/${dosyalar.length}`);
        urller.push(await dosyaYukle("hikayeler", dosyalar[i].dosya));
      }
      setIlerleme("Kaydediliyor...");
      await adminIstek("gonderiler", {
        method: "POST",
        body: {
          baslik,
          kisa_ozet: kisaOzet,
          uzun_metin: uzunMetin || kisaOzet,
          begeni_sayisi: Number(begeni) || 0,
          sira: Number(sira) || 0,
          sabitle,
          medya_url: urller,
        },
      });
      bildir("Gönderi yayınlandı.");
      eklendi();
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      setIlerleme(null);
    }
  };

  const mesgul = ilerleme !== null;
  const kapakIndex = dosyalar.findIndex((d) => !d.video);

  return (
    <form onSubmit={kaydet} className="donation-panel min-w-0 space-y-3.5 p-3.5">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-gray-800">
          <FontAwesomeIcon icon={faCloudArrowUp} className="shrink-0 text-orange-500" />
          <span className="truncate">Yeni Gönderi Yükle</span>
        </h3>
        <button type="button" onClick={kapat} disabled={mesgul} aria-label="Formu kapat" className="ui-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <input ref={dosyaRef} type="file" multiple accept={KABUL_EDILENLER} className="hidden" onChange={dosyaEkle} />

      {dosyalar.length === 0 ? (
        <button
          type="button"
          disabled={mesgul}
          onClick={() => dosyaRef.current?.click()}
          className="ui-focus flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 px-3 text-center text-gray-600 hover:border-orange-300"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
            <FontAwesomeIcon icon={faPlus} />
          </span>
          <span className="text-sm font-semibold">Fotoğraf / Video Seç</span>
          <span className="text-[11px] text-gray-400">Birden fazla seçebilirsiniz · dosya başına en fazla 50 MB</span>
        </button>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {dosyalar.map((d, i) => (
              <div key={d.id} className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                {d.video ? (
                  <video src={d.onizleme} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.onizleme} alt={d.dosya.name} className="h-full w-full object-cover" />
                )}
                {i === kapakIndex && (
                  <span className="absolute left-1 top-1 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">KAPAK</span>
                )}
                {d.video && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                    <FontAwesomeIcon icon={faVideo} />
                  </span>
                )}
                <button type="button" disabled={mesgul} onClick={() => dosyaKaldir(d.id)} aria-label="Kaldır" className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-[11px] text-white">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
                <div className="absolute bottom-1 right-1 flex gap-1">
                  <button type="button" disabled={mesgul || i === 0} onClick={() => tasi(i, -1)} aria-label="Öne al" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] text-gray-700 disabled:opacity-40">
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </button>
                  <button type="button" disabled={mesgul || i === dosyalar.length - 1} onClick={() => tasi(i, 1)} aria-label="Sona al" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] text-gray-700 disabled:opacity-40">
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              disabled={mesgul}
              onClick={() => dosyaRef.current?.click()}
              className="ui-focus flex aspect-square min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-500 hover:border-orange-300 hover:text-orange-600"
            >
              <FontAwesomeIcon icon={faPlus} className="text-lg" />
              Ekle
            </button>
          </div>
          <p className="text-[11px] text-gray-400">{dosyalar.length} dosya · ilk fotoğraf kapak görseli olur.</p>
        </div>
      )}

      <div>
        <label htmlFor="gonderi-ozet" className={ETIKET_SINIFI}>Açıklama</label>
        <textarea id="gonderi-ozet" rows={3} maxLength={1000} value={kisaOzet} onChange={(e) => setKisaOzet(e.target.value)} className={METIN_ALANI_SINIFI} placeholder="Bu çalışmada neler yaptınız?" />
      </div>

      <details className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
        <summary className="cursor-pointer select-none py-1 text-xs font-semibold text-gray-600">
          Başlık ve detaylı metin (isteğe bağlı)
        </summary>
        <div className="mt-2 space-y-2.5">
          <div>
            <label htmlFor="gonderi-baslik" className={ETIKET_SINIFI}>Başlık</label>
            <input id="gonderi-baslik" maxLength={200} value={baslik} onChange={(e) => setBaslik(e.target.value)} className={ALAN_SINIFI} />
          </div>
          <div>
            <label htmlFor="gonderi-metin" className={ETIKET_SINIFI}>Detaylı metin (boşsa açıklama kullanılır)</label>
            <textarea id="gonderi-metin" rows={5} maxLength={10000} value={uzunMetin} onChange={(e) => setUzunMetin(e.target.value)} className={METIN_ALANI_SINIFI} />
          </div>
        </div>
      </details>

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <label htmlFor="gonderi-begeni" className={ETIKET_SINIFI}>Beğeni sayısı</label>
          <input id="gonderi-begeni" type="number" min={0} inputMode="numeric" value={begeni} onChange={(e) => setBegeni(e.target.value)} className={ALAN_SINIFI} />
        </div>
        <div className="min-w-0">
          <label htmlFor="gonderi-sira" className={ETIKET_SINIFI}>Sıra numarası</label>
          <input id="gonderi-sira" type="number" min={0} inputMode="numeric" value={sabitle ? "1" : sira} disabled={sabitle} onChange={(e) => setSira(e.target.value)} className={ALAN_SINIFI} />
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2.5">
        <span className="min-w-0 flex-1 text-xs text-gray-600">
          <span className="flex items-center gap-1.5 font-semibold text-gray-800">
            <FontAwesomeIcon icon={faThumbtack} className="shrink-0 text-orange-500" />
            En Üste Sabitle
          </span>
          Diğer gönderiler bir sıra aşağı kayar.
        </span>
        <Dugme acik={sabitle} degistir={setSabitle} etiket="En üste sabitle" mesgul={mesgul} />
      </div>

      <button type="submit" disabled={mesgul} className={`${BUTON.ana} h-12 w-full text-sm`}>
        <FontAwesomeIcon icon={mesgul ? faSpinner : faCloudArrowUp} spin={mesgul} />
        {ilerleme ?? "Gönderiyi Yayınla"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Düzenleme penceresi                                                 */
/* ------------------------------------------------------------------ */

function DuzenlemeFormu({ gonderi, kaydedildi }: { gonderi: Gonderi; kaydedildi: (g: Gonderi) => void }) {
  const bildir = useBildirim();
  const [baslik, setBaslik] = useState(gonderi.baslik ?? "");
  const [kisaOzet, setKisaOzet] = useState(gonderi.kisa_ozet ?? "");
  const [uzunMetin, setUzunMetin] = useState(gonderi.uzun_metin ?? "");
  const [begeni, setBegeni] = useState(String(gonderi.begeni_sayisi ?? 0));
  const [sira, setSira] = useState(String(gonderi.sira ?? 0));
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const kaydet = async (e: FormEvent) => {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      const { data } = await adminIstek<{ data: Gonderi }>("gonderiler", {
        method: "PATCH",
        body: {
          id: gonderi.id,
          baslik,
          kisa_ozet: kisaOzet,
          uzun_metin: uzunMetin,
          begeni_sayisi: Number(begeni),
          sira: Number(sira),
        },
      });
      bildir("Gönderi güncellendi.");
      kaydedildi(data);
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      setKaydediliyor(false);
    }
  };

  return (
    <form onSubmit={kaydet} className="space-y-3">
      <div>
        <label htmlFor="duzenle-baslik" className={ETIKET_SINIFI}>Başlık</label>
        <input id="duzenle-baslik" maxLength={200} value={baslik} onChange={(e) => setBaslik(e.target.value)} className={ALAN_SINIFI} />
      </div>
      <div>
        <label htmlFor="duzenle-ozet" className={ETIKET_SINIFI}>Kısa özet</label>
        <textarea id="duzenle-ozet" rows={2} maxLength={1000} value={kisaOzet} onChange={(e) => setKisaOzet(e.target.value)} className={METIN_ALANI_SINIFI} />
      </div>
      <div>
        <label htmlFor="duzenle-metin" className={ETIKET_SINIFI}>Açıklama metni</label>
        <textarea id="duzenle-metin" rows={6} maxLength={10000} value={uzunMetin} onChange={(e) => setUzunMetin(e.target.value)} className={METIN_ALANI_SINIFI} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="duzenle-begeni" className={ETIKET_SINIFI}>Beğeni sayısı</label>
          <input id="duzenle-begeni" type="number" min={0} required inputMode="numeric" value={begeni} onChange={(e) => setBegeni(e.target.value)} className={ALAN_SINIFI} />
        </div>
        <div>
          <label htmlFor="duzenle-sira" className={ETIKET_SINIFI}>Sıra</label>
          <input id="duzenle-sira" type="number" min={0} required inputMode="numeric" value={sira} onChange={(e) => setSira(e.target.value)} className={ALAN_SINIFI} />
        </div>
      </div>
      <button type="submit" disabled={kaydediliyor} className={`${BUTON.ana} w-full`}>
        <FontAwesomeIcon icon={kaydediliyor ? faSpinner : faFloppyDisk} spin={kaydediliyor} />
        Kaydet
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Modül                                                               */
/* ------------------------------------------------------------------ */

export default function GonderiYonetimi() {
  const bildir = useBildirim();
  const [liste, setListe] = useState<Gonderi[]>([]);
  const [yuklendi, setYuklendi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState<Gonderi | null>(null);
  const [silinenId, setSilinenId] = useState<string | null>(null);
  const [galeri, setGaleri] = useState<string[] | null>(null);

  const [yenileme, setYenileme] = useState(0);

  // Açılışta ve "yenile" istendiğinde liste çekilir; bileşen kapanırsa yanıt yok sayılır.
  useEffect(() => {
    let iptal = false;
    adminIstek<{ data: Gonderi[] }>("gonderiler")
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

  const sil = async (g: Gonderi) => {
    if (!window.confirm("Bu gönderi ve tüm medya dosyaları kalıcı olarak silinsin mi?")) return;
    setSilinenId(g.id);
    try {
      await adminIstek("gonderiler", { method: "DELETE", sorgu: { id: g.id } });
      setListe((l) => l.filter((x) => x.id !== g.id));
      bildir("Gönderi silindi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setSilinenId(null);
    }
  };

  const duzenlemeKapat = useCallback(() => setDuzenlenen(null), []);
  const galeriKapat = useCallback(() => setGaleri(null), []);

  return (
    <section className="min-w-0 space-y-3">
      {formAcik ? (
        <YeniGonderiFormu
          kapat={() => setFormAcik(false)}
          eklendi={() => {
            setFormAcik(false);
            getir();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setFormAcik(true)}
          className="ui-focus flex w-full min-w-0 items-center gap-3 rounded-[20px] bg-gradient-to-r from-orange-500 to-red-500 p-3.5 text-left text-white shadow-md shadow-orange-500/25 transition hover:brightness-105 active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg">
            <FontAwesomeIcon icon={faPlus} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Yeni Gönderi Yükle</span>
            <span className="block text-[11px] text-white/85">Fotoğraf veya video ile Çalışmalarımız&apos;a ekleyin</span>
          </span>
          <FontAwesomeIcon icon={faCloudArrowUp} className="shrink-0 text-xl text-white/90" />
        </button>
      )}

      <ModulBasligi
        ikon={faImages}
        baslik="Gönderiler"
        aciklama={yuklendi ? `Çalışmalarımız bölümünde ${liste.length} gönderi` : "Yükleniyor..."}
      />

      {!yuklendi ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu metin={hata} yenidenDene={getir} />
      ) : liste.length === 0 ? (
        <BosDurum metin="Henüz gönderi eklenmemiş." />
      ) : (
        <div className="space-y-2.5">
          {liste.map((g) => {
            const medyalar = tumMedyalar(g);
            const kapak = medyalar[0];
            const aciklama = (g.kisa_ozet || g.uzun_metin || "").trim();
            const baslik = g.baslik && g.baslik.trim() !== "Başlıksız Gönderi" ? g.baslik.trim() : "";
            return (
              <article key={g.id} className="donation-panel min-w-0 p-2.5">
                <div className="flex min-w-0 gap-3">
                  <button
                    type="button"
                    onClick={() => setGaleri(medyalar)}
                    disabled={!kapak}
                    className="ui-focus relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-gray-100"
                    aria-label="Medyaları görüntüle"
                  >
                    {kapak && <MedyaOnizleme url={kapak} alt={baslik || "Gönderi kapağı"} />}
                    <span className="absolute left-1 top-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-gray-800 shadow">
                      #{g.sira ?? 0}
                    </span>
                    {medyalar.length > 1 && (
                      <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        <FontAwesomeIcon icon={medyalar.some(videoMu) ? faVideo : faImages} className="mr-0.5" />
                        {medyalar.length}
                      </span>
                    )}
                  </button>

                  <div className="flex min-w-0 flex-1 flex-col">
                    {baslik && <h3 className="truncate text-sm font-bold text-gray-800">{baslik}</h3>}
                    <p className="line-clamp-2 break-words text-xs leading-snug text-gray-600 [overflow-wrap:anywhere]">
                      {aciklama || <span className="italic text-gray-400">Açıklama yok</span>}
                    </p>
                    <div className="mt-auto flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 pt-1 text-[10px] text-gray-500">
                      <span><FontAwesomeIcon icon={faHeart} className="mr-1 text-red-500" />{g.begeni_sayisi ?? 0}</span>
                      <span><FontAwesomeIcon icon={faEye} className="mr-1" />{g.goruntulenme ?? 0}</span>
                      <span className="truncate">{tarihBicimle(g.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-gray-100 pt-2.5">
                  <button type="button" onClick={() => setDuzenlenen(g)} className={`${BUTON.ikincil} w-full`}>
                    <FontAwesomeIcon icon={faPen} />
                    Düzenle
                  </button>
                  <button type="button" disabled={silinenId === g.id} onClick={() => void sil(g)} className={`${BUTON.tehlike} w-full`} aria-label="Gönderiyi sil">
                    <FontAwesomeIcon icon={silinenId === g.id ? faSpinner : faTrash} spin={silinenId === g.id} />
                    Sil
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal acik={duzenlenen !== null} kapat={duzenlemeKapat} baslik="Gönderiyi Düzenle">
        {duzenlenen && (
          <DuzenlemeFormu
            key={duzenlenen.id}
            gonderi={duzenlenen}
            kaydedildi={(yeni) => {
              setDuzenlenen(null);
              setListe((l) =>
                l
                  .map((x) => (x.id === yeni.id ? yeni : x))
                  .sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0))
              );
            }}
          />
        )}
      </Modal>

      <GaleriModal medyalar={galeri ?? []} baslangic={galeri ? 0 : null} kapat={galeriKapat} />
    </section>
  );
}
