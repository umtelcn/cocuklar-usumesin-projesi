"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faCommentDots,
  faCopy,
  faFloppyDisk,
  faPaperPlane,
  faRotate,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { adminIstek, erisimAnahtari, hataMesaji } from "@/lib/adminApi";
import {
  ALAN_SINIFI,
  BUTON,
  Dugme,
  ETIKET_SINIFI,
  HataKutusu,
  METIN_ALANI_SINIFI,
  ModulBasligi,
  Yukleniyor,
  tarihBicimle,
  useBildirim,
} from "@/components/admin/ortak";

const WEBHOOK_URL = "https://www.cocuklarusumesindestek.com/api/instagram-webhook";

type Ayarlar = {
  aktif: boolean;
  gecikme_saniye: number;
  model: string;
  openrouter_api_key: string;
  instagram_access_token: string;
  instagram_verify_token: string;
  guncel_durum: string;
  sistem_talimati: string;
  env_openrouter?: boolean;
  env_instagram?: boolean;
};

type Kayit = {
  id: string;
  tarih: string;
  gonderen_id: string | null;
  kullanici_mesaji: string;
  ai_cevabi: string;
  durum: "cevaplandi" | "insana_devredildi" | "test" | "hata";
  not?: string;
};

type Balon = { kim: "ben" | "ai"; metin: string; devret?: boolean; hata?: boolean };

const DURUM_ROZETI: Record<Kayit["durum"], { etiket: string; sinif: string }> = {
  cevaplandi: { etiket: "Cevaplandı", sinif: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  insana_devredildi: { etiket: "İnsana Bırakıldı", sinif: "bg-amber-50 text-amber-700 border-amber-100" },
  test: { etiket: "Test", sinif: "bg-sky-50 text-sky-700 border-sky-100" },
  hata: { etiket: "Hata", sinif: "bg-red-50 text-red-600 border-red-100" },
};

type Model = {
  id: string;
  ad: string;
  baglam: number | null;
  girdi_fiyat: number | null;
  cikti_fiyat: number | null;
  ucretsiz: boolean;
};

const ONERILEN_MODELLER = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "openai/gpt-4o-mini",
  "anthropic/claude-haiku-4.5",
  "deepseek/deepseek-chat-v3.1",
];

function fiyatMetni(m: Model): string {
  if (m.ucretsiz) return "Ücretsiz";
  if (m.girdi_fiyat === null || m.cikti_fiyat === null) return "Fiyat bilinmiyor";
  return `$${m.girdi_fiyat} / $${m.cikti_fiyat} (1M token girdi/çıktı)`;
}

/** OpenRouter'dan dinamik çekilen modeller arasından aranabilir seçim. */
function ModelSecici({ secili, sec }: { secili: string; sec: (id: string) => void }) {
  const [modeller, setModeller] = useState<Model[] | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [arama, setArama] = useState("");
  const [acik, setAcik] = useState(false);
  const [sadeceUcretsiz, setSadeceUcretsiz] = useState(false);

  const [yenileSayaci, setYenileSayaci] = useState(0);

  // Açılışta ve "Listeyi Yenile" ile çekilir; bileşen kapanırsa yanıt yok sayılır.
  useEffect(() => {
    let iptal = false;
    adminIstek<{ data: Model[] }>("dm-models")
      .then(
        ({ data }) => {
          if (iptal) return;
          setModeller(data);
          setHata(null);
        },
        (err) => {
          if (!iptal) setHata(hataMesaji(err));
        }
      )
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });
    return () => {
      iptal = true;
    };
  }, [yenileSayaci]);

  const getir = () => {
    setYukleniyor(true);
    setHata(null);
    setYenileSayaci((n) => n + 1);
  };

  const seciliModel = modeller?.find((m) => m.id === secili);
  const terim = arama.trim().toLocaleLowerCase("tr");
  const filtreli = (modeller ?? [])
    .filter((m) => !sadeceUcretsiz || m.ucretsiz)
    .filter((m) => !terim || m.id.toLowerCase().includes(terim) || m.ad.toLocaleLowerCase("tr").includes(terim))
    .sort((a, b) => {
      // Arama yoksa önerilen modeller üstte.
      if (terim) return 0;
      const ia = ONERILEN_MODELLER.indexOf(a.id);
      const ib = ONERILEN_MODELLER.indexOf(b.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  const gosterilen = filtreli.slice(0, 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`${ETIKET_SINIFI} mb-0`}>Yapay Zeka Modeli (OpenRouter)</span>
        <button type="button" onClick={getir} disabled={yukleniyor} className="text-[11px] font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50">
          <FontAwesomeIcon icon={yukleniyor ? faSpinner : faRotate} spin={yukleniyor} className="mr-1" />
          Listeyi Yenile
        </button>
      </div>

      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        className="ui-focus flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-800">{seciliModel?.ad ?? secili}</span>
          <span className="block truncate text-[11px] text-gray-500">
            {secili}
            {seciliModel && ` · ${fiyatMetni(seciliModel)}`}
          </span>
        </span>
        <FontAwesomeIcon icon={faChevronDown} className={`shrink-0 text-xs text-gray-500 transition-transform ${acik ? "rotate-180" : ""}`} />
      </button>

      {hata && <p className="mt-1 text-[11px] text-red-600">{hata}</p>}
      {modeller && !seciliModel && (
        <p className="mt-1 text-[11px] text-amber-600">Seçili model OpenRouter listesinde bulunamadı, başka bir model seçin.</p>
      )}

      {acik && (
        <div className="mt-2 space-y-2 rounded-xl border border-gray-200 bg-white p-2">
          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Model ara (örn: gemini, gpt, claude)…"
            aria-label="Model ara"
            className={ALAN_SINIFI}
          />
          <label className="flex items-center gap-2 px-1 text-[11px] text-gray-600">
            <input type="checkbox" checked={sadeceUcretsiz} onChange={(e) => setSadeceUcretsiz(e.target.checked)} />
            Yalnızca ücretsiz modeller
          </label>
          {!modeller ? (
            <p className="py-4 text-center text-xs text-gray-400">
              {yukleniyor ? "Modeller yükleniyor…" : "Model listesi alınamadı."}
            </p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {gosterilen.map((m) => {
                const aktif = m.id === secili;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        sec(m.id);
                        setAcik(false);
                      }}
                      className={`ui-focus w-full min-w-0 rounded-lg px-2.5 py-1.5 text-left ${aktif ? "bg-orange-50 ring-1 ring-orange-200" : "hover:bg-gray-50"}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-gray-800">{m.ad}</span>
                        {ONERILEN_MODELLER.includes(m.id) && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 text-[9px] font-semibold text-emerald-700">Önerilen</span>
                        )}
                      </span>
                      <span className="block truncate text-[10px] text-gray-500">
                        {m.id} · {fiyatMetni(m)}
                      </span>
                    </button>
                  </li>
                );
              })}
              {filtreli.length === 0 && <li className="py-3 text-center text-xs text-gray-400">Sonuç yok.</li>}
              {filtreli.length > gosterilen.length && (
                <li className="py-1 text-center text-[10px] text-gray-400">
                  {filtreli.length - gosterilen.length} model daha var, aramayı daraltın.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
      <p className="mt-1 text-[11px] text-gray-500">Değişiklik &quot;Ayarları Kaydet&quot; ile kaydedilir.</p>
    </div>
  );
}

export default function DmAsistaniManager() {
  const bildir = useBildirim();
  const [ayar, setAyar] = useState<Ayarlar | null>(null);
  const [gecmis, setGecmis] = useState<Kayit[]>([]);
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [apiAcik, setApiAcik] = useState(false);
  const [temizleniyor, setTemizleniyor] = useState(false);

  const [sohbet, setSohbet] = useState<Balon[]>([]);
  const [testMesaj, setTestMesaj] = useState("");
  const [testBekliyor, setTestBekliyor] = useState(false);
  const sohbetSonu = useRef<HTMLDivElement>(null);

  const yukle = useCallback(async () => {
    setHata(null);
    try {
      const veri = await adminIstek<{ ayarlar: Ayarlar; gecmis: Kayit[] }>("dm-settings");
      setAyar(veri.ayarlar);
      setGecmis(veri.gecmis);
    } catch (err) {
      setHata(hataMesaji(err));
    }
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  useEffect(() => {
    sohbetSonu.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [sohbet]);

  const guncelle = <K extends keyof Ayarlar>(alan: K, deger: Ayarlar[K]) =>
    setAyar((a) => (a ? { ...a, [alan]: deger } : a));

  const kaydet = async (e?: FormEvent, ek?: Partial<Ayarlar>) => {
    e?.preventDefault();
    if (!ayar) return;
    setKaydediliyor(true);
    try {
      const veri = await adminIstek<{ ayarlar: Ayarlar }>("dm-settings", {
        method: "POST",
        body: { ...ayar, ...ek },
      });
      setAyar(veri.ayarlar);
      bildir("DM Asistanı ayarları kaydedildi.", "basari");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setKaydediliyor(false);
    }
  };

  const aktifDegistir = (yeni: boolean) => {
    guncelle("aktif", yeni);
    void kaydet(undefined, { aktif: yeni });
  };

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      bildir("Webhook URL kopyalandı.", "basari");
    } catch {
      bildir("Kopyalanamadı, elle seçip kopyalayın.", "hata");
    }
  };

  const testGonder = async (e: FormEvent) => {
    e.preventDefault();
    const mesaj = testMesaj.trim();
    if (!mesaj || testBekliyor) return;
    setTestMesaj("");
    setSohbet((s) => [...s, { kim: "ben", metin: mesaj }]);
    setTestBekliyor(true);
    try {
      const token = await erisimAnahtari();
      const yanit = await fetch("/api/instagram-webhook/test", {
        method: "POST",
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mesaj }),
      });
      const veri = (await yanit.json().catch(() => null)) as {
        cevap?: string;
        insana_devret?: boolean;
        kayit?: Kayit;
        error?: string;
      } | null;
      if (!yanit.ok || !veri?.cevap) throw new Error(veri?.error || "Cevap alınamadı.");
      setSohbet((s) => [...s, { kim: "ai", metin: veri.cevap!, devret: veri.insana_devret }]);
      if (veri.kayit) setGecmis((g) => [veri.kayit!, ...g].slice(0, 50));
    } catch (err) {
      setSohbet((s) => [...s, { kim: "ai", metin: hataMesaji(err), hata: true }]);
    } finally {
      setTestBekliyor(false);
    }
  };

  const gecmisiTemizle = async () => {
    if (!window.confirm("Tüm DM geçmişi silinsin mi?")) return;
    setTemizleniyor(true);
    try {
      await adminIstek("dm-settings", { method: "POST", body: { islem: "gecmisi_temizle" } });
      setGecmis([]);
      bildir("Geçmiş temizlendi.", "basari");
    } catch (err) {
      bildir(hataMesaji(err), "hata");
    } finally {
      setTemizleniyor(false);
    }
  };

  if (hata) return <HataKutusu metin={hata} yenidenDene={yukle} />;
  if (!ayar) return <Yukleniyor />;

  return (
    <div className="min-w-0 space-y-3">
      <ModulBasligi
        ikon={faCommentDots}
        baslik="DM Asistanı"
        aciklama="Instagram DM'lerine yapay zeka ile otomatik cevap"
        sag={
          <button type="button" onClick={() => void yukle()} aria-label="Yenile" className={BUTON.ikincil}>
            <FontAwesomeIcon icon={faRotate} />
          </button>
        }
      />

      <form onSubmit={kaydet} className="donation-panel min-w-0 space-y-4 p-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">DM Yapay Zeka Asistanı</p>
            <p className={`text-xs font-medium ${ayar.aktif ? "text-emerald-600" : "text-gray-500"}`}>
              {ayar.aktif ? "Açık — gelen mesajlar otomatik cevaplanıyor" : "Kapalı"}
            </p>
          </div>
          <Dugme acik={ayar.aktif} degistir={aktifDegistir} etiket="DM Yapay Zeka Asistanı (Açık / Kapalı)" mesgul={kaydediliyor} />
        </div>

        <div>
          <label htmlFor="dm-gecikme" className={ETIKET_SINIFI}>Cevap Gecikmesi (Saniye)</label>
          <input
            id="dm-gecikme"
            type="number"
            min={0}
            max={60}
            value={ayar.gecikme_saniye}
            onChange={(e) => guncelle("gecikme_saniye", Number(e.target.value))}
            className={ALAN_SINIFI}
          />
        </div>

        <ModelSecici secili={ayar.model} sec={(id) => guncelle("model", id)} />

        <div>
          <label htmlFor="dm-durum" className={ETIKET_SINIFI}>Güncel Durum / Bugün Ne Yapıyoruz?</label>
          <textarea
            id="dm-durum"
            rows={3}
            value={ayar.guncel_durum}
            onChange={(e) => guncelle("guncel_durum", e.target.value)}
            placeholder="Örn: Bugün 9 yaşındaki kızımızın odasını boyuyoruz..."
            className={METIN_ALANI_SINIFI}
          />
          <p className="mt-1 text-[11px] text-gray-500">Soranlara yapay zeka bunu anlatır.</p>
        </div>

        <div>
          <label htmlFor="dm-talimat" className={ETIKET_SINIFI}>Konuşma Üslubu ve Kurallar</label>
          <textarea
            id="dm-talimat"
            rows={10}
            value={ayar.sistem_talimati}
            onChange={(e) => guncelle("sistem_talimati", e.target.value)}
            className={`${METIN_ALANI_SINIFI} text-xs`}
          />
        </div>

        <div className="rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setApiAcik((a) => !a)}
            aria-expanded={apiAcik}
            className="ui-focus flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-gray-700"
          >
            API & Instagram Bağlantı Ayarları
            <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${apiAcik ? "rotate-180" : ""}`} />
          </button>
          {apiAcik && (
            <div className="space-y-3 border-t border-gray-100 p-3.5">
              <div>
                <label htmlFor="dm-or" className={ETIKET_SINIFI}>OpenRouter API Key</label>
                <input
                  id="dm-or"
                  type="password"
                  autoComplete="off"
                  value={ayar.openrouter_api_key}
                  onChange={(e) => guncelle("openrouter_api_key", e.target.value)}
                  placeholder={ayar.env_openrouter ? "Ortam değişkeninden kullanılıyor" : "sk-or-..."}
                  className={ALAN_SINIFI}
                />
              </div>
              <div>
                <label htmlFor="dm-ig" className={ETIKET_SINIFI}>Instagram Access Token</label>
                <input
                  id="dm-ig"
                  type="password"
                  autoComplete="off"
                  value={ayar.instagram_access_token}
                  onChange={(e) => guncelle("instagram_access_token", e.target.value)}
                  placeholder={ayar.env_instagram ? "Ortam değişkeninden kullanılıyor" : "IGAA..."}
                  className={ALAN_SINIFI}
                />
              </div>
              <div>
                <label htmlFor="dm-vt" className={ETIKET_SINIFI}>Instagram Verify Token</label>
                <input
                  id="dm-vt"
                  value={ayar.instagram_verify_token}
                  onChange={(e) => guncelle("instagram_verify_token", e.target.value)}
                  className={ALAN_SINIFI}
                />
              </div>
              <div>
                <span className={ETIKET_SINIFI}>Webhook URL (Meta paneline yapıştırın)</span>
                <div className="flex min-w-0 gap-2">
                  <input readOnly value={WEBHOOK_URL} onFocus={(e) => e.target.select()} className={`${ALAN_SINIFI} text-xs`} />
                  <button type="button" onClick={kopyala} aria-label="Kopyala" className={`${BUTON.ikincil} h-10 shrink-0`}>
                    <FontAwesomeIcon icon={faCopy} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">Anahtarlar özel (herkese kapalı) depolamada saklanır ve burada maskeli gösterilir. Değiştirmek için yeni değeri yazıp kaydedin.</p>
            </div>
          )}
        </div>

        <button type="submit" disabled={kaydediliyor} className={`${BUTON.ana} w-full`}>
          <FontAwesomeIcon icon={kaydediliyor ? faSpinner : faFloppyDisk} spin={kaydediliyor} />
          Ayarları Kaydet
        </button>
      </form>

      <section className="donation-panel min-w-0 space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-800">🧪 Canlı Test Sohbeti (Simülasyon)</h3>
          {sohbet.length > 0 && (
            <button type="button" onClick={() => setSohbet([])} className="text-xs text-gray-500 hover:text-gray-700">Temizle</button>
          )}
        </div>
        <p className="text-[11px] text-gray-500">Kayıtlı ayarlarla çalışır; değişiklikleri test etmeden önce kaydedin. Instagram&apos;a mesaj gönderilmez.</p>
        <div className="max-h-80 min-h-[120px] space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
          {sohbet.length === 0 && (
            <p className="py-6 text-center text-xs text-gray-400">Bir takipçi gibi mesaj yazın…</p>
          )}
          {sohbet.map((b, i) => (
            <div key={i} className={`flex ${b.kim === "ben" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                  b.kim === "ben"
                    ? "rounded-br-sm bg-gradient-to-r from-orange-500 to-red-500 text-white"
                    : b.hata
                      ? "rounded-bl-sm border border-red-100 bg-red-50 text-red-600"
                      : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                }`}
              >
                {b.metin}
                {b.devret && (
                  <span className="mt-1 block text-[10px] font-semibold text-amber-600">Gerçekte cevap gönderilmez, insana bırakılır.</span>
                )}
              </div>
            </div>
          ))}
          {testBekliyor && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                <FontAwesomeIcon icon={faSpinner} spin className="mr-1.5 text-orange-500" />
                yazıyor…
              </div>
            </div>
          )}
          <div ref={sohbetSonu} />
        </div>
        <form onSubmit={testGonder} className="flex min-w-0 gap-2">
          <input
            value={testMesaj}
            onChange={(e) => setTestMesaj(e.target.value)}
            placeholder="Mesaj yazın…"
            maxLength={2000}
            aria-label="Test mesajı"
            className={ALAN_SINIFI}
          />
          <button type="submit" disabled={testBekliyor || !testMesaj.trim()} aria-label="Gönder" className={`${BUTON.ana} shrink-0`}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </section>

      <section className="donation-panel min-w-0 space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 text-sm font-bold text-gray-800">Son Gelen/Cevaplanan DM Kayıtları</h3>
          <button type="button" onClick={gecmisiTemizle} disabled={temizleniyor || gecmis.length === 0} className={`${BUTON.tehlike} shrink-0`}>
            <FontAwesomeIcon icon={temizleniyor ? faSpinner : faTrash} spin={temizleniyor} />
            Geçmişi Temizle
          </button>
        </div>
        {gecmis.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">Henüz kayıt yok.</p>
        ) : (
          <ul className="space-y-2">
            {gecmis.map((k) => {
              const rozet = DURUM_ROZETI[k.durum] ?? DURUM_ROZETI.hata;
              return (
                <li key={k.id} className="min-w-0 space-y-1.5 rounded-xl border border-gray-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rozet.sinif}`}>{rozet.etiket}</span>
                    <span className="text-[11px] text-gray-400">{tarihBicimle(k.tarih)}</span>
                  </div>
                  <p className="break-words text-xs text-gray-700">
                    <span className="font-semibold text-gray-500">Kullanıcı: </span>
                    {k.kullanici_mesaji}
                  </p>
                  {k.ai_cevabi && (
                    <p className="break-words text-xs text-gray-700">
                      <span className="font-semibold text-orange-600">AI: </span>
                      {k.ai_cevabi}
                    </p>
                  )}
                  {k.not && <p className="break-words text-[11px] italic text-gray-400">{k.not}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
