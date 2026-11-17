"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faHandHoldingHeart,
  faLocationDot,
  faMagnifyingGlass,
  faPhone,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { supabase } from "@/lib/supabaseClient";
import { adminIstek, hataMesaji } from "@/lib/adminApi";
import {
  ALAN_SINIFI,
  BUTON,
  BosDurum,
  FiltreCipleri,
  GaleriModal,
  HataKutusu,
  ModulBasligi,
  Yukleniyor,
  tarihBicimle,
  useBildirim,
  useGecikmeliDeger,
} from "@/components/admin/ortak";

type TalepDurumu = "beklemede" | "incelendi" | "tamamlandi";
type Filtre = "tumu" | TalepDurumu;

type Talep = {
  id: number;
  created_at: string;
  ad_soyad: string | null;
  telefon: string | null;
  il: string | null;
  ilce: string | null;
  mesaj: string | null;
  gorsel_yollari: string[] | null;
  durum: string | null;
};

type Yanit = { data: Talep[]; toplam: number; sayfaBoyutu: number };

const FILTRELER: { deger: Filtre; etiket: string }[] = [
  { deger: "tumu", etiket: "Tümü" },
  { deger: "beklemede", etiket: "Beklemede" },
  { deger: "incelendi", etiket: "İncelendi" },
  { deger: "tamamlandi", etiket: "Tamamlandı" },
];

const DURUM_BILGISI: Record<TalepDurumu, { etiket: string; sinif: string }> = {
  beklemede: { etiket: "Beklemede", sinif: "bg-amber-50 text-amber-700 border-amber-200" },
  incelendi: { etiket: "İncelendi", sinif: "bg-sky-50 text-sky-700 border-sky-200" },
  tamamlandi: { etiket: "Tamamlandı", sinif: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

/** Eski kayıtlardaki "Yeni Talep" gibi değerler beklemede sayılır. */
function durumuNormallestir(durum: string | null): TalepDurumu {
  return durum === "incelendi" || durum === "tamamlandi" ? durum : "beklemede";
}

/** Telefonu WhatsApp için 90XXXXXXXXXX biçimine çevirir; uygun değilse null. */
function whatsappNumarasi(telefon: string | null): string | null {
  let rakamlar = (telefon || "").replace(/\D/g, "");
  if (rakamlar.startsWith("0090")) rakamlar = rakamlar.slice(2);
  if (rakamlar.startsWith("90") && rakamlar.length === 12) return rakamlar;
  if (rakamlar.startsWith("0") && rakamlar.length === 11) return `9${rakamlar}`;
  if (rakamlar.length === 10) return `90${rakamlar}`;
  return null;
}

function gorselUrl(yol: string): string {
  return /^https?:\/\//i.test(yol)
    ? yol
    : supabase.storage.from("talep-gorselleri").getPublicUrl(yol).data.publicUrl;
}

function TalepKarti({
  talep,
  durumDegistir,
  sil,
  galeriAc,
  mesgul,
}: {
  talep: Talep;
  durumDegistir: (durum: TalepDurumu) => void;
  sil: () => void;
  galeriAc: (medyalar: string[], index: number) => void;
  mesgul: boolean;
}) {
  const durum = durumuNormallestir(talep.durum);
  const wa = whatsappNumarasi(talep.telefon);
  const gorseller = (talep.gorsel_yollari ?? []).filter(Boolean).map(gorselUrl);
  const waMesaji = encodeURIComponent(
    `Merhaba ${talep.ad_soyad ?? ""}, Çocuklar Üşümesin Derneği'nden yardım talebiniz hakkında ulaşıyoruz.`
  );

  return (
    <article className="donation-panel flex min-w-0 flex-col gap-3 p-3.5">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-bold text-gray-800">
            {talep.ad_soyad || "İsimsiz başvuru"}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
            <FontAwesomeIcon icon={faCalendar} className="shrink-0" />
            <span className="min-w-0 truncate">{tarihBicimle(talep.created_at)}</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DURUM_BILGISI[durum].sinif}`}>
          {DURUM_BILGISI[durum].etiket}
        </span>
      </div>

      <p className="flex min-w-0 items-start gap-1.5 rounded-lg bg-gray-50 px-2.5 py-2 text-xs text-gray-700">
        <FontAwesomeIcon icon={faLocationDot} className="mt-0.5 shrink-0 text-orange-500" />
        <span className="min-w-0 break-words">
          {[talep.il, talep.ilce].filter(Boolean).join(" / ") || "Konum belirtilmemiş"}
        </span>
      </p>

      {talep.telefon && (
        <div className={`grid gap-2 ${wa ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1"}`}>
          <a href={`tel:${talep.telefon.replace(/[^\d+]/g, "")}`} className={`${BUTON.ikincil} w-full px-2.5`}>
            <FontAwesomeIcon icon={faPhone} className="shrink-0 text-sky-600" />
            <span className="min-w-0 truncate">{talep.telefon}</span>
          </a>
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${waMesaji}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BUTON.basari} px-3`}
            >
              <FontAwesomeIcon icon={faWhatsapp} className="shrink-0" />
              <span className="min-w-0 truncate">WhatsApp</span>
            </a>
          )}
        </div>
      )}

      {talep.mesaj && (
        <p className="min-w-0 whitespace-pre-wrap break-words rounded-xl bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-700 [overflow-wrap:anywhere]">
          {talep.mesaj}
        </p>
      )}

      {gorseller.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {gorseller.map((url, i) => (
            <button
              key={url + i}
              type="button"
              onClick={() => galeriAc(gorseller, i)}
              className="ui-focus aspect-square min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
              aria-label={`Fotoğraf ${i + 1}'i büyüt`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.25rem] gap-1 border-t border-gray-100 pt-3">
        {(Object.keys(DURUM_BILGISI) as TalepDurumu[]).map((d) => (
          <button
            key={d}
            type="button"
            disabled={mesgul || d === durum}
            onClick={() => durumDegistir(d)}
            aria-pressed={d === durum}
            className={`ui-focus min-w-0 truncate rounded-lg border px-1 py-2 text-[11px] font-semibold transition-colors disabled:cursor-default ${
              d === durum
                ? `${DURUM_BILGISI[d].sinif}`
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {DURUM_BILGISI[d].etiket}
          </button>
        ))}
        <button
          type="button"
          onClick={sil}
          disabled={mesgul}
          title="Talebi sil"
          className="ui-focus flex min-w-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 px-1 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          aria-label="Talebi sil"
        >
          <FontAwesomeIcon icon={mesgul ? faSpinner : faTrash} spin={mesgul} />
        </button>
      </div>
    </article>
  );
}

export default function TalepYonetimi({ ozetYenile }: { ozetYenile: () => void }) {
  const bildir = useBildirim();
  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const [aramaMetni, setAramaMetni] = useState("");
  const arama = useGecikmeliDeger(aramaMetni.trim());
  const [liste, setListe] = useState<Talep[]>([]);
  const [toplam, setToplam] = useState(0);
  // Son başarıyla yüklenen filtre+arama; mevcut seçimle eşleşmiyorsa yükleniyor.
  const [yuklenenAnahtar, setYuklenenAnahtar] = useState<string | null>(null);
  const [yenileme, setYenileme] = useState(0);
  const anahtar = `${filtre}|${arama}|${yenileme}`;
  const yukleniyor = yuklenenAnahtar !== anahtar;
  const [dahaFazlaYukleniyor, setDahaFazlaYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [mesgulId, setMesgulId] = useState<number | null>(null);
  const [galeri, setGaleri] = useState<{ medyalar: string[]; index: number } | null>(null);
  const guncelAnahtar = useRef(anahtar);

  // İlk sayfa: filtre veya arama değişince yeniden çekilir; eski yanıt yok sayılır.
  useEffect(() => {
    guncelAnahtar.current = anahtar;
    let iptal = false;
    adminIstek<Yanit>("talepler", { sorgu: { durum: filtre, q: arama, baslangic: 0 } })
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
  }, [anahtar, filtre, arama]);

  const dahaFazlaYukle = async () => {
    const istekAnahtari = guncelAnahtar.current;
    setDahaFazlaYukleniyor(true);
    try {
      const veri = await adminIstek<Yanit>("talepler", {
        sorgu: { durum: filtre, q: arama, baslangic: liste.length },
      });
      if (guncelAnahtar.current !== istekAnahtari) return;
      setListe((l) => [...l, ...veri.data.filter((t) => !l.some((x) => x.id === t.id))]);
      setToplam(veri.toplam);
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setDahaFazlaYukleniyor(false);
    }
  };


  const durumDegistir = async (talep: Talep, durum: TalepDurumu) => {
    setMesgulId(talep.id);
    try {
      await adminIstek("talepler", { method: "PATCH", body: { id: talep.id, durum } });
      setListe((l) =>
        filtre === "tumu" || filtre === durum
          ? l.map((t) => (t.id === talep.id ? { ...t, durum } : t))
          : l.filter((t) => t.id !== talep.id)
      );
      if (filtre !== "tumu" && filtre !== durum) setToplam((t) => Math.max(0, t - 1));
      bildir(`Talep "${DURUM_BILGISI[durum].etiket}" olarak işaretlendi.`);
      ozetYenile();
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setMesgulId(null);
    }
  };

  const sil = async (talep: Talep) => {
    if (!window.confirm(`"${talep.ad_soyad ?? "Bu"}" talebi ve fotoğrafları kalıcı olarak silinsin mi?`)) return;
    setMesgulId(talep.id);
    try {
      await adminIstek("talepler", { method: "DELETE", sorgu: { id: talep.id } });
      setListe((l) => l.filter((t) => t.id !== talep.id));
      setToplam((t) => Math.max(0, t - 1));
      bildir("Talep silindi.");
      ozetYenile();
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setMesgulId(null);
    }
  };

  const galeriKapat = useCallback(() => setGaleri(null), []);

  return (
    <section className="min-w-0 space-y-3">
      <ModulBasligi
        ikon={faHandHoldingHeart}
        baslik="Yardım Talepleri"
        aciklama={yukleniyor ? "Yükleniyor..." : `${toplam} talep listeleniyor`}
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
            placeholder="İsim, il, ilçe, telefon..."
            className={`${ALAN_SINIFI} pl-9`}
            aria-label="Taleplerde ara"
          />
        </div>
        <FiltreCipleri secenekler={FILTRELER} secili={filtre} sec={setFiltre} />
      </div>

      {yukleniyor ? (
        <Yukleniyor />
      ) : hata ? (
        <HataKutusu metin={hata} yenidenDene={() => setYenileme((n) => n + 1)} />
      ) : liste.length === 0 ? (
        <BosDurum metin="Bu kriterlere uygun talep bulunamadı." />
      ) : (
        <>
          <div className="space-y-3">
            {liste.map((t) => (
              <TalepKarti
                key={t.id}
                talep={t}
                mesgul={mesgulId === t.id}
                durumDegistir={(d) => void durumDegistir(t, d)}
                sil={() => void sil(t)}
                galeriAc={(medyalar, index) => setGaleri({ medyalar, index })}
              />
            ))}
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
                Daha fazla yükle ({toplam - liste.length})
              </button>
            </div>
          )}
        </>
      )}

      <GaleriModal
        medyalar={galeri?.medyalar ?? []}
        baslangic={galeri ? galeri.index : null}
        kapat={galeriKapat}
      />
    </section>
  );
}
