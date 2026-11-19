"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCalendarDays,
  faCircleCheck,
  faCircleExclamation,
  faCloudArrowUp,
  faCrown,
  faEye,
  faFloppyDisk,
  faGripVertical,
  faHeart,
  faHouse,
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
import { diziTasi, useSiralama } from "@/components/admin/useSiralama";

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

/** Formdaki tek medya karesi: sunucudaki mevcut dosya ya da yeni seçilen dosya. */
type MedyaOgesi = {
  id: string;
  /** Önizleme adresi (mevcut dosyada uzak adres, yeni dosyada blob adresi). */
  onizleme: string;
  video: boolean;
  /** Sunucudaki adres; yeni dosyada yüklendikten sonra dolar. */
  url?: string;
  dosya?: File;
  durum?: "yukleniyor" | "tamam" | "hata";
};

type Ilerleme = { asama: "yukleme"; biten: number; toplam: number } | { asama: "kaydetme" };

const KABUL_EDILENLER = ".jpg,.jpeg,.png,.webp,.mp4,.mov";
const UZANTI_DESENI = /\.(jpe?g|png|webp|mp4|mov)$/i;
const EN_FAZLA_BOYUT = 50 * 1024 * 1024;
const EN_FAZLA_MEDYA = 30;

const sayiFormati = new Intl.NumberFormat("tr-TR");
const sayi = (n: number | null | undefined) => sayiFormati.format(n ?? 0);

const KUCUK_BUTON =
  "ui-focus inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function tumMedyalar(g: Gonderi): string[] {
  const liste: string[] = [];
  if (g.kapak_gorseli) liste.push(g.kapak_gorseli);
  (g.medya_url ?? []).forEach((m) => {
    if (m && !liste.includes(m)) liste.push(m);
  });
  return liste;
}

function baslikTemizle(baslik: string | null | undefined) {
  const t = (baslik ?? "").trim();
  return t === "Başlıksız Gönderi" ? "" : t;
}

/* ------------------------------------------------------------------ */
/* Medya düzenleyici (sıralanabilir önizleme ızgarası)                  */
/* ------------------------------------------------------------------ */

function MedyaIzgarasi({
  ogeler,
  setOgeler,
  kaldir,
  ekle,
  mesgul,
}: {
  ogeler: MedyaOgesi[];
  setOgeler: (f: (o: MedyaOgesi[]) => MedyaOgesi[]) => void;
  kaldir: (id: string) => void;
  ekle: () => void;
  mesgul: boolean;
}) {
  const tasi = useCallback(
    (from: number, to: number) => setOgeler((o) => diziTasi(o, from, to)),
    [setOgeler]
  );
  const { suruklenen, ogeProps, tutamakProps } = useSiralama({
    adet: ogeler.length,
    mod: "izgara",
    tasi,
    devreDisi: mesgul,
  });

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {ogeler.map((o, i) => {
          const { ref, style } = ogeProps(i);
          return (
            <div
              key={o.id}
              ref={ref}
              style={style}
              {...tutamakProps(i, { tumOge: true })}
              className={`relative aspect-[4/5] min-w-0 select-none overflow-hidden rounded-xl border bg-gray-100 ${
                suruklenen === i
                  ? "scale-[1.04] cursor-grabbing border-orange-400 shadow-xl ring-2 ring-orange-500"
                  : "cursor-grab border-gray-200"
              }`}
            >
              {o.video ? (
                <video src={o.dosya ? o.onizleme : `${o.onizleme}#t=0.1`} muted playsInline preload="metadata" className="pointer-events-none h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.onizleme} alt={`Medya ${i + 1}`} draggable={false} className="pointer-events-none h-full w-full object-cover" />
              )}

              <div className="absolute left-1 top-1 flex gap-1">
                {i === 0 && (
                  <span className="rounded-md bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                    Kapak
                  </span>
                )}
                {o.video && (
                  <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                    <FontAwesomeIcon icon={faVideo} />
                  </span>
                )}
              </div>

              {!mesgul && (
                <button type="button" onClick={() => kaldir(o.id)} aria-label={`${i + 1}. medyayı çıkar`} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-[11px] text-white hover:bg-black/75">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}

              {o.durum === "yukleniyor" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-[10px] font-semibold text-white">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-base" />
                  Yükleniyor
                </div>
              )}
              {o.durum === "hata" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-600/70 text-[10px] font-semibold text-white">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-base" />
                  Yüklenemedi
                </div>
              )}
              {o.durum === "tamam" && mesgul && (
                <span className="absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white shadow">
                  <FontAwesomeIcon icon={faCircleCheck} />
                </span>
              )}
              {mesgul && o.dosya && !o.durum && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 text-[10px] font-semibold text-gray-700">
                  Sırada
                </div>
              )}

              {!mesgul && ogeler.length > 1 && (
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1">
                  <button type="button" disabled={i === 0} onClick={() => tasi(i, i - 1)} aria-label="Öne al" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] text-gray-700 shadow disabled:opacity-0">
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </button>
                  <span
                    data-tutamak
                    tabIndex={0}
                    role="button"
                    aria-label={`${i + 1}. medyayı taşı (ok tuşlarıyla da taşınabilir)`}
                    className="ui-focus flex h-7 w-7 touch-none items-center justify-center rounded-full bg-white/90 text-[11px] text-gray-600 shadow"
                  >
                    <FontAwesomeIcon icon={faGripVertical} className="pointer-events-none" />
                  </span>
                  <button type="button" disabled={i === ogeler.length - 1} onClick={() => tasi(i, i + 1)} aria-label="Sona al" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[10px] text-gray-700 shadow disabled:opacity-0">
                    <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!mesgul && ogeler.length < EN_FAZLA_MEDYA && (
          <button
            type="button"
            onClick={ekle}
            className="ui-focus flex aspect-[4/5] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-500 hover:border-orange-300 hover:text-orange-600"
          >
            <FontAwesomeIcon icon={faPlus} className="text-lg" />
            Ekle
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        {ogeler.length} medya · tutup sürükleyerek veya oklarla sıralayın, ilk sıradaki kapak olur.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Yeni gönderi / düzenleme formu                                      */
/* ------------------------------------------------------------------ */

function GonderiFormu({
  gonderi,
  tamamlandi,
  kapat,
  mesgulBildir,
}: {
  /** Verilirse düzenleme modu. */
  gonderi?: Gonderi;
  tamamlandi: (g: Gonderi) => void;
  kapat?: () => void;
  mesgulBildir?: (mesgul: boolean) => void;
}) {
  const duzenleme = Boolean(gonderi);
  const bildir = useBildirim();
  const [ogeler, setOgeler] = useState<MedyaOgesi[]>(() =>
    gonderi
      ? tumMedyalar(gonderi).map((url) => ({ id: url, onizleme: url, url, video: videoMu(url) }))
      : []
  );
  const [baslik, setBaslik] = useState(gonderi?.baslik ?? "");
  const [kisaOzet, setKisaOzet] = useState(gonderi?.kisa_ozet ?? "");
  const [uzunMetin, setUzunMetin] = useState(gonderi?.uzun_metin ?? "");
  const [begeni, setBegeni] = useState(String(gonderi?.begeni_sayisi ?? 0));
  const [sabitle, setSabitle] = useState(true);
  const [ilerleme, setIlerleme] = useState<Ilerleme | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const onizlemeler = useRef<string[]>([]);
  const mesgul = ilerleme !== null;

  useEffect(() => {
    mesgulBildir?.(mesgul);
  }, [mesgul, mesgulBildir]);

  // Form kapanınca oluşturulan önizleme adresleri serbest bırakılır.
  useEffect(
    () => () => {
      onizlemeler.current.forEach((u) => URL.revokeObjectURL(u));
    },
    []
  );

  const dosyaEkle = (e: ChangeEvent<HTMLInputElement>) => {
    const secilenler = Array.from(e.target.files ?? []);
    e.target.value = "";
    const bosYer = EN_FAZLA_MEDYA - ogeler.length;
    const yeniler: MedyaOgesi[] = [];
    for (const dosya of secilenler) {
      if (!UZANTI_DESENI.test(dosya.name)) {
        bildir(`"${dosya.name}" desteklenmiyor (jpg, png, webp, mp4, mov).`, "hata");
        continue;
      }
      if (dosya.size > EN_FAZLA_BOYUT) {
        bildir(`"${dosya.name}" 50 MB'tan büyük.`, "hata");
        continue;
      }
      if (yeniler.length >= bosYer) {
        bildir(`Bir gönderide en fazla ${EN_FAZLA_MEDYA} medya olabilir.`, "hata");
        break;
      }
      const onizleme = URL.createObjectURL(dosya);
      onizlemeler.current.push(onizleme);
      yeniler.push({ id: onizleme, dosya, onizleme, video: /\.(mp4|mov)$/i.test(dosya.name) });
    }
    if (yeniler.length) setOgeler((o) => [...o, ...yeniler]);
  };

  const kaldir = (id: string) => {
    const oge = ogeler.find((o) => o.id === id);
    if (oge?.dosya) URL.revokeObjectURL(oge.onizleme);
    setOgeler((o) => o.filter((x) => x.id !== id));
  };

  const ogeGuncelle = (id: string, degisiklik: Partial<MedyaOgesi>) =>
    setOgeler((o) => o.map((x) => (x.id === id ? { ...x, ...degisiklik } : x)));

  /** Henüz yüklenmemiş dosyaları sırayla yükler, son sıradaki adres listesini döndürür. */
  const medyalariYukle = async (): Promise<string[]> => {
    const anlik = ogeler;
    const bekleyenler = anlik.filter((o) => o.dosya && !o.url);
    const yuklenen = new Map<string, string>();
    let biten = 0;
    setIlerleme({ asama: "yukleme", biten, toplam: bekleyenler.length });
    for (const o of bekleyenler) {
      ogeGuncelle(o.id, { durum: "yukleniyor" });
      try {
        const url = await dosyaYukle("hikayeler", o.dosya as File);
        yuklenen.set(o.id, url);
        ogeGuncelle(o.id, { durum: "tamam", url });
        biten += 1;
        setIlerleme({ asama: "yukleme", biten, toplam: bekleyenler.length });
      } catch (err) {
        ogeGuncelle(o.id, { durum: "hata" });
        throw err;
      }
    }
    return anlik.map((o) => o.url ?? (yuklenen.get(o.id) as string));
  };

  const kaydet = async (e: FormEvent) => {
    e.preventDefault();
    if (ogeler.length === 0) return bildir("En az bir fotoğraf veya video ekleyin.", "hata");

    try {
      const urller = await medyalariYukle();
      setIlerleme({ asama: "kaydetme" });
      const ortak = { baslik, kisa_ozet: kisaOzet, begeni_sayisi: Number(begeni) || 0, medya_url: urller };
      const { data } = await adminIstek<{ data: Gonderi }>("gonderiler", {
        method: gonderi ? "PATCH" : "POST",
        body: gonderi
          ? { ...ortak, id: gonderi.id, uzun_metin: uzunMetin }
          : { ...ortak, uzun_metin: uzunMetin || kisaOzet, sabitle },
      });
      bildir(gonderi ? "Gönderi güncellendi." : "Gönderi yayınlandı.");
      setIlerleme(null);
      tamamlandi(data);
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      setIlerleme(null);
    }
  };

  const yeniDosyaSayisi = ogeler.filter((o) => o.dosya && !o.url).length;
  const butonMetni = !ilerleme
    ? duzenleme
      ? "Değişiklikleri Kaydet"
      : "Gönderiyi Yayınla"
    : ilerleme.asama === "kaydetme"
      ? "Kaydediliyor..."
      : `Yükleniyor · ${ilerleme.biten}/${ilerleme.toplam} yüklendi...`;

  return (
    <form onSubmit={kaydet} className={duzenleme ? "min-w-0 space-y-3.5" : "donation-panel min-w-0 space-y-3.5 p-3.5"}>
      {!duzenleme && (
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-gray-800">
            <FontAwesomeIcon icon={faCloudArrowUp} className="shrink-0 text-orange-500" />
            <span className="truncate">Yeni Gönderi Yükle</span>
          </h3>
          <button type="button" onClick={kapat} disabled={mesgul} aria-label="Formu kapat" className="ui-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      <input ref={dosyaRef} type="file" multiple accept={KABUL_EDILENLER} className="hidden" onChange={dosyaEkle} />

      {ogeler.length === 0 ? (
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
        <MedyaIzgarasi ogeler={ogeler} setOgeler={setOgeler} kaldir={kaldir} ekle={() => dosyaRef.current?.click()} mesgul={mesgul} />
      )}

      <div>
        <label htmlFor={duzenleme ? "duzenle-ozet" : "gonderi-ozet"} className={ETIKET_SINIFI}>Açıklama</label>
        <textarea id={duzenleme ? "duzenle-ozet" : "gonderi-ozet"} rows={3} maxLength={1000} disabled={mesgul} value={kisaOzet} onChange={(e) => setKisaOzet(e.target.value)} className={METIN_ALANI_SINIFI} placeholder="Bu çalışmada neler yaptınız?" />
      </div>

      <details open={duzenleme} className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2">
        <summary className="cursor-pointer select-none py-1 text-xs font-semibold text-gray-600">
          Başlık ve detaylı metin (isteğe bağlı)
        </summary>
        <div className="mt-2 space-y-2.5">
          <div>
            <label htmlFor={duzenleme ? "duzenle-baslik" : "gonderi-baslik"} className={ETIKET_SINIFI}>Başlık</label>
            <input id={duzenleme ? "duzenle-baslik" : "gonderi-baslik"} maxLength={200} disabled={mesgul} value={baslik} onChange={(e) => setBaslik(e.target.value)} className={ALAN_SINIFI} />
          </div>
          <div>
            <label htmlFor={duzenleme ? "duzenle-metin" : "gonderi-metin"} className={ETIKET_SINIFI}>Detaylı metin{duzenleme ? "" : " (boşsa açıklama kullanılır)"}</label>
            <textarea id={duzenleme ? "duzenle-metin" : "gonderi-metin"} rows={5} maxLength={10000} disabled={mesgul} value={uzunMetin} onChange={(e) => setUzunMetin(e.target.value)} className={METIN_ALANI_SINIFI} />
          </div>
        </div>
      </details>

      <div className="min-w-0">
        <label htmlFor={duzenleme ? "duzenle-begeni" : "gonderi-begeni"} className={ETIKET_SINIFI}>Beğeni sayısı</label>
        <input id={duzenleme ? "duzenle-begeni" : "gonderi-begeni"} type="number" min={0} inputMode="numeric" disabled={mesgul} value={begeni} onChange={(e) => setBegeni(e.target.value)} className={ALAN_SINIFI} />
      </div>

      {!duzenleme && (
        <div className="flex min-w-0 items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2.5">
          <span className="min-w-0 flex-1 text-xs text-gray-600">
            <span className="flex items-center gap-1.5 font-semibold text-gray-800">
              <FontAwesomeIcon icon={faThumbtack} className="shrink-0 text-orange-500" />
              En Üste Ekle (#1)
            </span>
            {sabitle ? "Ana sayfa vitrininde gösterilir; diğerleri bir sıra kayar." : "Gönderi listenin en sonuna eklenir."}
          </span>
          <Dugme acik={sabitle} degistir={setSabitle} etiket="En üste ekle" mesgul={mesgul} />
        </div>
      )}

      {ilerleme?.asama === "yukleme" && ilerleme.toplam > 0 && (
        <div className="space-y-1" aria-live="polite">
          <div className="flex justify-between text-[11px] font-medium text-gray-600">
            <span>Dosyalar yükleniyor</span>
            <span className="tabular-nums">{ilerleme.biten}/{ilerleme.toplam} yüklendi</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-[width] duration-300"
              style={{ width: `${Math.max(6, (ilerleme.biten / ilerleme.toplam) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <button type="submit" disabled={mesgul} className={`${BUTON.ana} h-12 w-full text-sm`}>
        <FontAwesomeIcon icon={mesgul ? faSpinner : duzenleme ? faFloppyDisk : faCloudArrowUp} spin={mesgul} />
        {butonMetni}
      </button>
      {!mesgul && yeniDosyaSayisi > 0 && duzenleme && (
        <p className="text-center text-[11px] text-gray-400">{yeniDosyaSayisi} yeni dosya kaydederken yüklenecek.</p>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Gönderi kartı                                                       */
/* ------------------------------------------------------------------ */

function Rozet({ ikon, metin, ton = "gri" }: { ikon: typeof faHeart; metin: string; ton?: "gri" | "kirmizi" }) {
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
        ton === "kirmizi" ? "border-red-100 bg-red-50 text-red-600" : "border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      <FontAwesomeIcon icon={ikon} className="shrink-0 text-[9px]" />
      <span className="truncate">{metin}</span>
    </span>
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
  const [siraDurumu, setSiraDurumu] = useState<"kaydediliyor" | "kaydedildi" | null>(null);
  const [yenileme, setYenileme] = useState(0);

  const duzenlemeMesgul = useRef(false);
  const kayitKuyrugu = useRef<Promise<void>>(Promise.resolve());
  const kayitNo = useRef(0);
  const gecikme = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gizleme = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(
    () => () => {
      if (gecikme.current) clearTimeout(gecikme.current);
      if (gizleme.current) clearTimeout(gizleme.current);
    },
    []
  );

  const getir = useCallback(() => setYenileme((n) => n + 1), []);

  /**
   * Yeni sırayı anında ekrana yansıtır (1..N), kısa bir beklemeden sonra
   * sunucuya kaydeder. Art arda değişiklikler tek istekte birleşir ve
   * istekler sırayla gider; hata olursa liste sunucudan yeniden çekilir.
   */
  const siralamayiUygula = useCallback(
    (yeni: Gonderi[]) => {
      setListe(yeni.map((g, i) => ({ ...g, sira: i + 1 })));
      setSiraDurumu("kaydediliyor");
      if (gizleme.current) clearTimeout(gizleme.current);
      if (gecikme.current) clearTimeout(gecikme.current);
      const idler = yeni.map((g) => g.id);
      gecikme.current = setTimeout(() => {
        const no = ++kayitNo.current;
        kayitKuyrugu.current = kayitKuyrugu.current.then(async () => {
          try {
            await adminIstek("gonderiler", { method: "PUT", body: { siralama: idler } });
            if (no !== kayitNo.current) return;
            setSiraDurumu("kaydedildi");
            gizleme.current = setTimeout(() => setSiraDurumu(null), 2200);
          } catch (err) {
            if (no !== kayitNo.current) return;
            setSiraDurumu(null);
            bildir(hataMesaji(err), "hata");
            getir();
          }
        });
      }, 450);
    },
    [bildir, getir]
  );

  const tasi = useCallback(
    (from: number, to: number) => siralamayiUygula(diziTasi(liste, from, to)),
    [liste, siralamayiUygula]
  );

  const { suruklenen, ogeProps, tutamakProps } = useSiralama({
    adet: liste.length,
    mod: "liste",
    tasi,
  });

  const sil = async (g: Gonderi) => {
    if (!window.confirm("Bu gönderi ve tüm medya dosyaları kalıcı olarak silinsin mi?")) return;
    setSilinenId(g.id);
    try {
      await adminIstek("gonderiler", { method: "DELETE", sorgu: { id: g.id } });
      // Sunucu da boşluğu kapatır; ekrandaki numaralar 1..N olarak güncellenir.
      setListe((l) => l.filter((x) => x.id !== g.id).map((x, i) => ({ ...x, sira: i + 1 })));
      bildir("Gönderi silindi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setSilinenId(null);
    }
  };

  const duzenlemeKapat = useCallback(() => {
    if (!duzenlemeMesgul.current) setDuzenlenen(null);
  }, []);
  const mesgulBildir = useCallback((m: boolean) => {
    duzenlemeMesgul.current = m;
  }, []);
  const galeriKapat = useCallback(() => setGaleri(null), []);

  return (
    <section className="min-w-0 space-y-3">
      {siraDurumu && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed right-3 top-3 z-[95] flex items-center gap-1.5 rounded-full bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur"
        >
          {siraDurumu === "kaydediliyor" ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="text-orange-400" />
              Sıralama kaydediliyor...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-400" />
              Sıralama kaydedildi
            </>
          )}
        </div>
      )}

      {formAcik ? (
        <GonderiFormu
          kapat={() => setFormAcik(false)}
          tamamlandi={() => {
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
        <>
          {liste.length > 1 && (
            <p className="flex items-center gap-1.5 px-1 text-[11px] text-gray-500">
              <FontAwesomeIcon icon={faGripVertical} className="text-gray-400" />
              Sıralamak için tutamaktan tutup sürükleyin. #1 ana sayfada vitrin olarak gösterilir.
            </p>
          )}
          <div className="space-y-2.5">
            {liste.map((g, i) => {
              const no = i + 1;
              const medyalar = tumMedyalar(g);
              const kapak = medyalar[0];
              const aciklama = (g.kisa_ozet || g.uzun_metin || "").trim();
              const baslik = baslikTemizle(g.baslik);
              const { ref, style } = ogeProps(i);
              const surukleniyor = suruklenen === i;
              return (
                <article
                  key={g.id}
                  ref={ref}
                  style={style}
                  className={`donation-panel min-w-0 overflow-hidden rounded-2xl transition-[box-shadow,scale] duration-150 ${
                    surukleniyor ? "scale-[1.01] shadow-xl ring-2 ring-orange-500" : ""
                  }`}
                >
                  <div className="flex min-w-0 gap-2.5 p-2.5">
                    <div className="flex shrink-0 flex-col items-center gap-1.5">
                      <button
                        type="button"
                        data-tutamak
                        {...tutamakProps(i)}
                        aria-label={`#${no} gönderiyi taşı (ok tuşlarıyla da taşınabilir)`}
                        title="Tutup sürükleyin"
                        className={`ui-focus flex h-11 w-7 touch-none select-none items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 ${
                          surukleniyor ? "cursor-grabbing bg-orange-50 text-orange-500" : "cursor-grab"
                        }`}
                      >
                        <FontAwesomeIcon icon={faGripVertical} className="pointer-events-none" />
                      </button>
                      <span
                        className={`min-w-7 rounded-lg px-1.5 py-0.5 text-center text-[11px] font-extrabold tabular-nums ${
                          no === 1 ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        #{no}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setGaleri(medyalar)}
                      disabled={!kapak}
                      className="ui-focus relative aspect-[4/5] w-[76px] shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                      aria-label="Medyaları görüntüle"
                    >
                      {kapak && <MedyaOnizleme url={kapak} alt={baslik || "Gönderi kapağı"} className="h-full w-full object-contain" />}
                      {medyalar.length > 1 && (
                        <span className="absolute bottom-1 right-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          <FontAwesomeIcon icon={medyalar.some(videoMu) ? faVideo : faImages} className="mr-0.5" />
                          {medyalar.length}
                        </span>
                      )}
                    </button>

                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      {no === 1 && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 ring-1 ring-orange-200">
                          <FontAwesomeIcon icon={faHouse} className="text-[9px]" />
                          Vitrin · Ana Sayfa
                        </span>
                      )}
                      {baslik && <h3 className="truncate text-sm font-bold text-gray-800">{baslik}</h3>}
                      <p className="line-clamp-3 break-words text-xs leading-relaxed text-gray-700 [overflow-wrap:anywhere]">
                        {aciklama || <span className="italic text-gray-400">Açıklama eklenmemiş</span>}
                      </p>
                      <div className="mt-auto flex min-w-0 flex-wrap gap-1">
                        <Rozet ikon={faHeart} ton="kirmizi" metin={`${sayi(g.begeni_sayisi)} beğeni`} />
                        <Rozet ikon={faEye} metin={`${sayi(g.goruntulenme)} görüntülenme`} />
                        <Rozet ikon={faCalendarDays} metin={tarihBicimle(g.created_at)} />
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-1.5 border-t border-gray-100 bg-gray-50/70 px-2.5 py-2">
                    <button type="button" onClick={() => setDuzenlenen(g)} className={`${KUCUK_BUTON} flex-1 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}>
                      <FontAwesomeIcon icon={faPen} />
                      Düzenle
                    </button>
                    {no > 1 && (
                      <button type="button" onClick={() => tasi(i, 0)} className={`${KUCUK_BUTON} flex-1 border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100`} aria-label="En üste taşı (#1 yap)">
                        <FontAwesomeIcon icon={faCrown} />
                        #1 Yap
                      </button>
                    )}
                    <button type="button" disabled={silinenId === g.id} onClick={() => void sil(g)} className={`${KUCUK_BUTON} border border-red-100 bg-red-50 text-red-600 hover:bg-red-100`} aria-label="Gönderiyi sil">
                      <FontAwesomeIcon icon={silinenId === g.id ? faSpinner : faTrash} spin={silinenId === g.id} />
                      Sil
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <Modal acik={duzenlenen !== null} kapat={duzenlemeKapat} baslik="Gönderiyi Düzenle">
        {duzenlenen && (
          <GonderiFormu
            key={duzenlenen.id}
            gonderi={duzenlenen}
            mesgulBildir={mesgulBildir}
            tamamlandi={(yeni) => {
              duzenlemeMesgul.current = false;
              setDuzenlenen(null);
              setListe((l) => l.map((x) => (x.id === yeni.id ? { ...yeni, sira: x.sira } : x)));
            }}
          />
        )}
      </Modal>

      <GaleriModal medyalar={galeri ?? []} baslangic={galeri ? 0 : null} kapat={galeriKapat} />
    </section>
  );
}
