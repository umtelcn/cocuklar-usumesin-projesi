"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCalendar,
  faCheck,
  faCopy,
  faFileInvoice,
  faHourglassHalf,
  faMagnifyingGlass,
  faRotateLeft,
  faSpinner,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { adminIstek, hataMesaji } from "@/lib/adminApi";
import { panoyaKopyala } from "@/lib/pano";
import {
  ALAN_SINIFI,
  BUTON,
  BosDurum,
  FiltreCipleri,
  HataKutusu,
  Modal,
  ModulBasligi,
  Yukleniyor,
  pdfMi,
  tarihBicimle,
  useBildirim,
  useGecikmeliDeger,
} from "@/components/admin/ortak";

type IadeDurumu = "beklemede" | "tamamlandi" | "reddedildi";
type Filtre = "tumu" | IadeDurumu;

type Iade = {
  id: string;
  ad_soyad: string;
  iban: string;
  tutar: string;
  mesaj: string | null;
  dekont_url: string;
  durum: string | null;
  created_at: string | null;
};

const FILTRELER: { deger: Filtre; etiket: string }[] = [
  { deger: "tumu", etiket: "Tümü" },
  { deger: "beklemede", etiket: "Beklemede" },
  { deger: "tamamlandi", etiket: "Tamamlandı" },
  { deger: "reddedildi", etiket: "Reddedildi" },
];

const DURUM_BILGISI: Record<IadeDurumu, { etiket: string; sinif: string; bildirim: string }> = {
  beklemede: { etiket: "Beklemede", sinif: "border-amber-200 bg-amber-50 text-amber-700", bildirim: "İade beklemeye alındı." },
  tamamlandi: { etiket: "Tamamlandı", sinif: "border-emerald-200 bg-emerald-50 text-emerald-700", bildirim: "İade tamamlandı olarak işaretlendi." },
  reddedildi: { etiket: "Reddedildi", sinif: "border-red-200 bg-red-50 text-red-700", bildirim: "İade reddedildi olarak işaretlendi." },
};

/** Varsayılan "Bekliyor" dahil, tamamlanmamış/reddedilmemiş her kayıt beklemededir. */
function durumuNormallestir(durum: string | null): IadeDurumu {
  const d = (durum ?? "").toLocaleLowerCase("tr");
  if (d === "tamamlandi") return "tamamlandi";
  if (d === "reddedildi") return "reddedildi";
  return "beklemede";
}

/** IBAN'ı okunaklı 4'lü gruplara ayırır. */
function ibanBicimle(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
}

export default function IadeYonetimi({ ozetYenile }: { ozetYenile: () => void }) {
  const bildir = useBildirim();
  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const [aramaMetni, setAramaMetni] = useState("");
  const arama = useGecikmeliDeger(aramaMetni.trim());
  const [liste, setListe] = useState<Iade[]>([]);
  const [yuklenenAnahtar, setYuklenenAnahtar] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [mesgulId, setMesgulId] = useState<string | null>(null);
  const [kopyalananId, setKopyalananId] = useState<string | null>(null);
  const [dekont, setDekont] = useState<Iade | null>(null);
  const [yenileme, setYenileme] = useState(0);

  const anahtar = `${filtre}|${arama}|${yenileme}`;
  const yukleniyor = yuklenenAnahtar !== anahtar;

  // Filtre veya arama değişince yeniden çekilir; eski yanıt yok sayılır.
  useEffect(() => {
    let iptal = false;
    adminIstek<{ data: Iade[] }>("iadeler", { sorgu: { durum: filtre, q: arama } })
      .then(
        (veri) => {
          if (iptal) return;
          setListe(veri.data);
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
  }, [anahtar, filtre, arama]);

  const ibanKopyala = async (iade: Iade) => {
    const basarili = await panoyaKopyala(iade.iban.replace(/\s+/g, "").toUpperCase());
    if (basarili) {
      setKopyalananId(iade.id);
      setTimeout(() => setKopyalananId((k) => (k === iade.id ? null : k)), 2000);
      bildir("IBAN kopyalandı.");
    } else {
      bildir("IBAN kopyalanamadı.", "hata");
    }
  };

  const durumDegistir = async (iade: Iade, durum: IadeDurumu) => {
    setMesgulId(iade.id);
    try {
      await adminIstek("iadeler", { method: "PATCH", body: { id: iade.id, durum } });
      setListe((l) =>
        filtre === "tumu" || filtre === durum
          ? l.map((i) => (i.id === iade.id ? { ...i, durum } : i))
          : l.filter((i) => i.id !== iade.id)
      );
      bildir(DURUM_BILGISI[durum].bildirim);
      ozetYenile();
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setMesgulId(null);
    }
  };

  const sil = async (iade: Iade) => {
    if (!window.confirm(`${iade.ad_soyad} adlı kişinin iade talebi kalıcı olarak silinsin mi?`)) return;
    setMesgulId(iade.id);
    try {
      await adminIstek("iadeler", { method: "DELETE", sorgu: { id: iade.id } });
      setListe((l) => l.filter((i) => i.id !== iade.id));
      bildir("İade talebi silindi.");
      ozetYenile();
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setMesgulId(null);
    }
  };

  const dekontKapat = useCallback(() => setDekont(null), []);

  return (
    <section className="min-w-0 space-y-3">
      <ModulBasligi
        ikon={faRotateLeft}
        baslik="İade Talepleri"
        aciklama={yukleniyor ? "Yükleniyor..." : `${liste.length} iade talebi`}
      />

      <div className="donation-panel min-w-0 space-y-3 p-3">
        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400"
          />
          <input
            type="search"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="İsim veya IBAN ara..."
            className={`${ALAN_SINIFI} pl-9`}
            aria-label="İade taleplerinde ara"
          />
        </div>
        <FiltreCipleri secenekler={FILTRELER} secili={filtre} sec={setFiltre} />
      </div>

      {yukleniyor ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu metin={hata} yenidenDene={() => setYenileme((n) => n + 1)} />
      ) : liste.length === 0 ? (
        <BosDurum metin="İade talebi bulunamadı." />
      ) : (
        <div className="space-y-3">
          {liste.map((iade) => {
            const durum = durumuNormallestir(iade.durum);
            const mesgul = mesgulId === iade.id;
            return (
              <article key={iade.id} className="donation-panel flex min-w-0 flex-col gap-3 p-3.5">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-bold text-gray-800">{iade.ad_soyad}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                      <FontAwesomeIcon icon={faCalendar} className="shrink-0" />
                      <span className="min-w-0 truncate">{tarihBicimle(iade.created_at)}</span>
                    </p>
                  </div>
                  <div className="flex max-w-[45%] shrink-0 flex-col items-end gap-1.5">
                    <span className="max-w-full break-words text-right text-base font-extrabold text-gray-800">
                      {/^\d+([.,]\d+)?$/.test(iade.tutar.trim()) ? `${iade.tutar.trim()} ₺` : iade.tutar}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${DURUM_BILGISI[durum].sinif}`}>
                      {DURUM_BILGISI[durum].etiket}
                    </span>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">IBAN</p>
                    <p className="break-all font-mono text-xs text-gray-800">{ibanBicimle(iade.iban)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void ibanKopyala(iade)}
                    className={`${BUTON.ikincil} shrink-0 px-2.5`}
                    aria-label="IBAN'ı kopyala"
                  >
                    <FontAwesomeIcon
                      icon={kopyalananId === iade.id ? faCheck : faCopy}
                      className={kopyalananId === iade.id ? "text-emerald-600" : ""}
                    />
                    {kopyalananId === iade.id ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>

                {iade.mesaj && (
                  <p className="min-w-0 whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
                    {iade.mesaj}
                  </p>
                )}

                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  {durum === "beklemede" ? (
                    <>
                      <button
                        type="button"
                        disabled={mesgul}
                        onClick={() => void durumDegistir(iade, "tamamlandi")}
                        className={`${BUTON.basari} w-full px-2`}
                      >
                        <FontAwesomeIcon icon={faCheck} className="shrink-0" />
                        <span className="truncate">Tamamlandı</span>
                      </button>
                      <button
                        type="button"
                        disabled={mesgul}
                        onClick={() => void durumDegistir(iade, "reddedildi")}
                        className={`${BUTON.ikincil} w-full px-2`}
                      >
                        <FontAwesomeIcon icon={faXmark} className="shrink-0 text-red-500" />
                        <span className="truncate">Reddet</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={mesgul}
                      onClick={() => void durumDegistir(iade, "beklemede")}
                      className={`${BUTON.ikincil} col-span-2 w-full px-2`}
                    >
                      <FontAwesomeIcon icon={faHourglassHalf} className="shrink-0" />
                      <span className="truncate">Beklemeye Al</span>
                    </button>
                  )}
                  <button type="button" onClick={() => setDekont(iade)} className={`${BUTON.ikincil} w-full px-2`}>
                    <FontAwesomeIcon icon={faFileInvoice} className="shrink-0 text-orange-500" />
                    <span className="truncate">Dekont</span>
                  </button>
                  <button
                    type="button"
                    disabled={mesgul}
                    onClick={() => void sil(iade)}
                    className={`${BUTON.tehlike} w-full px-2`}
                  >
                    <FontAwesomeIcon icon={mesgul ? faSpinner : faTrash} spin={mesgul} className="shrink-0" />
                    <span className="truncate">Sil</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal acik={dekont !== null} kapat={dekontKapat} baslik={`Dekont — ${dekont?.ad_soyad ?? ""}`} genis>
        {dekont && (
          <div className="space-y-3">
            {pdfMi(dekont.dekont_url) ? (
              <iframe
                src={dekont.dekont_url}
                title="Dekont"
                className="h-[65vh] w-full rounded-xl border border-gray-200"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dekont.dekont_url}
                alt="Dekont"
                className="mx-auto max-h-[65vh] w-auto max-w-full rounded-xl border border-gray-200 object-contain"
              />
            )}
            <a
              href={dekont.dekont_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BUTON.ikincil} w-full`}
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              Yeni sekmede aç
            </a>
          </div>
        )}
      </Modal>
    </section>
  );
}
