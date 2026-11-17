"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk,
  faHeart,
  faMagnifyingGlass,
  faPen,
  faSpinner,
  faTrash,
  faUserSecret,
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { adminIstek, hataMesaji } from "@/lib/adminApi";
import { paraFormati } from "@/lib/format";
import {
  ALAN_SINIFI,
  BUTON,
  BosDurum,
  Dugme,
  ETIKET_SINIFI,
  HataKutusu,
  METIN_ALANI_SINIFI,
  Modal,
  ModulBasligi,
  Yukleniyor,
  tarihBicimle,
  useBildirim,
  useGecikmeliDeger,
} from "@/components/admin/ortak";

type BagisUrunu = { id: number; urun_id: number; ad: string; adet: number; o_anki_fiyat: number };

type Bagis = {
  id: number;
  created_at: string;
  ad_soyad: string | null;
  instagram_kullanici_adi: string | null;
  mesaj: string | null;
  nakdi_tutar: number;
  toplam_tutar: number;
  is_anonymous: boolean | null;
  gercek_ad_soyad: string | null;
  urunler: BagisUrunu[];
};

type Yanit = { data: Bagis[]; toplam: number; sayfaBoyutu: number };

function DuzenlemeFormu({ bagis, kaydedildi }: { bagis: Bagis; kaydedildi: (b: Partial<Bagis> & { id: number }) => void }) {
  const bildir = useBildirim();
  const anonimMi = bagis.is_anonymous === true;
  const [anonim, setAnonim] = useState(anonimMi);
  const [adSoyad, setAdSoyad] = useState(anonimMi ? "" : (bagis.ad_soyad ?? ""));
  const [gercekAd, setGercekAd] = useState(bagis.gercek_ad_soyad ?? "");
  const [instagram, setInstagram] = useState(bagis.instagram_kullanici_adi ?? "");
  const [mesaj, setMesaj] = useState(bagis.mesaj ?? "");
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const kaydet = async (e: FormEvent) => {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      const { data } = await adminIstek<{ data: Partial<Bagis> & { id: number } }>("bagislar", {
        method: "PATCH",
        body: {
          id: bagis.id,
          is_anonymous: anonim,
          ad_soyad: adSoyad,
          gercek_ad_soyad: gercekAd,
          instagram_kullanici_adi: instagram,
          mesaj,
        },
      });
      bildir("Bağış bilgileri güncellendi.");
      kaydedildi(data);
    } catch (err) {
      bildir(hataMesaji(err), "hata");
      setKaydediliyor(false);
    }
  };

  return (
    <form onSubmit={kaydet} className="space-y-3">
      <label className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
        <span className="min-w-0 text-xs font-semibold text-gray-700">
          <FontAwesomeIcon icon={faUserSecret} className="mr-1.5 text-gray-400" />
          Anonim bağış (listede &quot;Anonim Bağışçı&quot; görünür)
        </span>
        <Dugme acik={anonim} degistir={setAnonim} etiket="Anonim bağış" />
      </label>

      {!anonim && (
        <div>
          <label htmlFor="bagis-ad" className={ETIKET_SINIFI}>Görünür ad soyad</label>
          <input id="bagis-ad" maxLength={80} value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} className={ALAN_SINIFI} />
        </div>
      )}

      <div>
        <label htmlFor="bagis-gercek" className={ETIKET_SINIFI}>Gerçek ad soyad (yalnızca yönetici görür)</label>
        <input id="bagis-gercek" maxLength={80} value={gercekAd} onChange={(e) => setGercekAd(e.target.value)} className={ALAN_SINIFI} />
      </div>

      {!anonim && (
        <div>
          <label htmlFor="bagis-instagram" className={ETIKET_SINIFI}>Instagram kullanıcı adı</label>
          <input id="bagis-instagram" maxLength={120} value={instagram} onChange={(e) => setInstagram(e.target.value)} className={ALAN_SINIFI} placeholder="kullaniciadi" />
        </div>
      )}

      <div>
        <label htmlFor="bagis-mesaj" className={ETIKET_SINIFI}>Mesaj</label>
        <textarea id="bagis-mesaj" rows={4} maxLength={500} value={mesaj} onChange={(e) => setMesaj(e.target.value)} className={METIN_ALANI_SINIFI} />
      </div>

      <button type="submit" disabled={kaydediliyor} className={`${BUTON.ana} w-full`}>
        <FontAwesomeIcon icon={kaydediliyor ? faSpinner : faFloppyDisk} spin={kaydediliyor} />
        Kaydet
      </button>
    </form>
  );
}

export default function BagisYonetimi() {
  const bildir = useBildirim();
  const [aramaMetni, setAramaMetni] = useState("");
  const arama = useGecikmeliDeger(aramaMetni.trim());
  const [liste, setListe] = useState<Bagis[]>([]);
  const [toplam, setToplam] = useState(0);
  const [yuklenenAnahtar, setYuklenenAnahtar] = useState<string | null>(null);
  const [dahaFazlaYukleniyor, setDahaFazlaYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<Bagis | null>(null);
  const [silinenId, setSilinenId] = useState<number | null>(null);
  const [yenileme, setYenileme] = useState(0);
  const anahtar = `${arama}|${yenileme}`;
  const yukleniyor = yuklenenAnahtar !== anahtar;
  const guncelAnahtar = useRef(anahtar);

  // İlk sayfa: arama değişince yeniden çekilir; eski yanıt yok sayılır.
  useEffect(() => {
    guncelAnahtar.current = anahtar;
    let iptal = false;
    adminIstek<Yanit>("bagislar", { sorgu: { q: arama, baslangic: 0 } })
      .then(
        (veri) => {
          if (iptal) return;
          setListe(veri.data);
          setToplam(veri.toplam);
          setHata(null);
        },
        (err) => {
          if (!iptal) setHata(hataMesaji(err));
        }
      )
      .finally(() => {
        if (!iptal) setYuklenenAnahtar(anahtar);
      });
    return () => {
      iptal = true;
    };
  }, [anahtar, arama]);

  const dahaFazlaYukle = async () => {
    const istekAnahtari = guncelAnahtar.current;
    setDahaFazlaYukleniyor(true);
    try {
      const veri = await adminIstek<Yanit>("bagislar", {
        sorgu: { q: arama, baslangic: liste.length },
      });
      if (guncelAnahtar.current !== istekAnahtari) return;
      setListe((l) => [...l, ...veri.data.filter((b) => !l.some((x) => x.id === b.id))]);
      setToplam(veri.toplam);
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setDahaFazlaYukleniyor(false);
    }
  };

  const sil = async (b: Bagis) => {
    const ad = b.gercek_ad_soyad || b.ad_soyad || "Bu";
    if (!window.confirm(`#${b.id} numaralı bağış (${ad}) ve ürün detayları kalıcı olarak silinsin mi?`)) return;
    setSilinenId(b.id);
    try {
      await adminIstek("bagislar", { method: "DELETE", sorgu: { id: b.id } });
      setListe((l) => l.filter((x) => x.id !== b.id));
      setToplam((t) => Math.max(0, t - 1));
      bildir("Bağış kaydı silindi.");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setSilinenId(null);
    }
  };

  const duzenlemeKapat = useCallback(() => setDuzenlenen(null), []);

  return (
    <section className="min-w-0 space-y-3">
      <ModulBasligi
        ikon={faHeart}
        baslik="Bağışlar"
        aciklama={yukleniyor ? "Yükleniyor..." : `${paraFormati.format(toplam)} bağış kaydı`}
      />

      <div className="donation-panel min-w-0 p-3">
        <div className="relative">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
          <input
            type="search"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="Ad, Instagram, mesaj, bağış no..."
            className={`${ALAN_SINIFI} pl-9`}
            aria-label="Bağışlarda ara"
          />
        </div>
      </div>

      {yukleniyor ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu metin={hata} yenidenDene={() => setYenileme((n) => n + 1)} />
      ) : liste.length === 0 ? (
        <BosDurum metin="Bağış bulunamadı." />
      ) : (
        <>
          <div className="space-y-2.5">
            {liste.map((b) => {
              const anonim = b.is_anonymous === true;
              return (
                <article key={b.id} className="donation-panel min-w-0 space-y-2.5 p-3.5">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h3 className="min-w-0 break-words text-sm font-bold text-gray-800">{b.ad_soyad || "İsimsiz"}</h3>
                        {anonim && (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            <FontAwesomeIcon icon={faUserSecret} className="mr-1" />
                            Anonim
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        #{b.id} · {tarihBicimle(b.created_at)}
                      </p>
                    </div>
                    <div className="max-w-[45%] shrink-0 text-right">
                      <p className="break-words text-base font-extrabold text-gray-800">{paraFormati.format(b.toplam_tutar)} ₺</p>
                      {b.nakdi_tutar > 0 && (
                        <p className="break-words text-[11px] text-gray-500">Nakdi: {paraFormati.format(b.nakdi_tutar)} ₺</p>
                      )}
                    </div>
                  </div>

                  {b.gercek_ad_soyad && (anonim || b.gercek_ad_soyad !== b.ad_soyad) && (
                    <p className="min-w-0 break-words rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-800">
                      <span className="font-semibold">Gerçek ad:</span> {b.gercek_ad_soyad}
                    </p>
                  )}

                  {b.instagram_kullanici_adi && (
                    <a
                      href={`https://instagram.com/${b.instagram_kullanici_adi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block min-w-0 truncate text-xs font-medium text-pink-600 hover:underline"
                    >
                      <FontAwesomeIcon icon={faInstagram} className="mr-1" />@{b.instagram_kullanici_adi}
                    </a>
                  )}

                  {b.urunler.length > 0 && (
                    <ul className="space-y-1">
                      {b.urunler.map((u) => (
                        <li key={u.id} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] text-gray-700">
                          <span className="min-w-0 break-words">
                            <span className="font-bold">{u.adet}×</span> {u.ad}
                          </span>
                          <span className="shrink-0 text-gray-500">{paraFormati.format(u.o_anki_fiyat * u.adet)} ₺</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {b.mesaj && (
                    <p className="min-w-0 whitespace-pre-wrap break-words text-xs italic leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
                      &ldquo;{b.mesaj}&rdquo;
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2.5">
                    <button type="button" onClick={() => setDuzenlenen(b)} className={`${BUTON.ikincil} w-full`}>
                      <FontAwesomeIcon icon={faPen} />
                      Düzenle
                    </button>
                    <button type="button" disabled={silinenId === b.id} onClick={() => void sil(b)} className={`${BUTON.tehlike} w-full`} aria-label="Bağışı sil">
                      <FontAwesomeIcon icon={silinenId === b.id ? faSpinner : faTrash} spin={silinenId === b.id} />
                      Sil
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {liste.length < toplam && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={dahaFazlaYukleniyor}
                onClick={() => void dahaFazlaYukle()}
                className={`${BUTON.ikincil} w-full`}
              >
                {dahaFazlaYukleniyor && <FontAwesomeIcon icon={faSpinner} spin />}
                Daha fazla yükle ({paraFormati.format(toplam - liste.length)} kaldı)
              </button>
            </div>
          )}
        </>
      )}

      <Modal acik={duzenlenen !== null} kapat={duzenlemeKapat} baslik={`Bağışı Düzenle #${duzenlenen?.id ?? ""}`}>
        {duzenlenen && (
          <DuzenlemeFormu
            key={duzenlenen.id}
            bagis={duzenlenen}
            kaydedildi={(yeni) => {
              setDuzenlenen(null);
              setListe((l) => l.map((x) => (x.id === yeni.id ? { ...x, ...yeni } : x)));
            }}
          />
        )}
      </Modal>
    </section>
  );
}
