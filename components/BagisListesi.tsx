"use client";

import { useState, useEffect, useId, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import { sonBagisSil, useSonBagis } from "@/lib/sonBagis";
import { paraFormati } from "@/lib/format";
import type { Urun } from "@/components/bagis/types";
import {
  faComment,
  faGift,
  faHandHoldingHeart,
  faPenToSquare,
  faCheck,
  faXmark,
  faSpinner,
  faShieldHalved,
  faUser,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";

/**
 * "urun": `/destek` — ürün bağışları, ürün rozetleriyle (`1 Ayakkabı`, `1 Mont`).
 * "nakdi": `/` — tüm bağışlar, yalnızca ad/Instagram, TL tutarı ve mesajla.
 */
export type BagisListesiGorunumu = "urun" | "nakdi";

interface UrunKalemi {
  adet: number;
  ad: string;
}

interface BagisKisi {
  id: number;
  ad_soyad: string | null;
  instagram_kullanici_adi: string | null;
  mesaj: string | null;
  is_anonymous: boolean | null;
}

interface BagisKaydi extends BagisKisi {
  nakdi_tutar: number | null;
  toplam_tutar: number | null;
}

/** Veritabanından gelen ham kayıt: ürün adları `urunler` prop'undan çözülür. */
interface HamBagis extends BagisKaydi {
  kalemler: { urun_id: number; adet: number }[];
}

interface ListeBagisi extends BagisKaydi {
  urunler: UrunKalemi[];
}

const LISTE_SINIRI = 15;
const YENILEME_GECIKMESI_MS = 600;
const BAGIS_ALANLARI =
  "id, ad_soyad, instagram_kullanici_adi, mesaj, is_anonymous, nakdi_tutar, toplam_tutar";
const BOS_URUNLER: Urun[] = [];

/** İsme göre her zaman aynı kalan yumuşak avatar renkleri. */
const AVATAR_RENKLERI = [
  "border-orange-100 bg-orange-50 text-orange-600",
  "border-rose-100 bg-rose-50 text-rose-600",
  "border-amber-100 bg-amber-50 text-amber-700",
  "border-sky-100 bg-sky-50 text-sky-600",
  "border-emerald-100 bg-emerald-50 text-emerald-600",
  "border-violet-100 bg-violet-50 text-violet-600",
];

function avatarRengi(anahtar: string) {
  let h = 0;
  for (const c of anahtar) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_RENKLERI[h % AVATAR_RENKLERI.length];
}

/** "Ahmet Yılmaz" → "AY", "ahmet_yilmaz" → "AY", "zeynep" → "Z". */
function basHarfler(ad: string) {
  const parcalar = ad
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p));
  return (
    parcalar
      .slice(0, 2)
      .map((p) => (p.match(/[\p{L}\p{N}]/u)?.[0] ?? "").toLocaleUpperCase("tr-TR"))
      .join("") || "?"
  );
}

/** Eski kayıtlarda kalan genel anonim adlar (baş harf bilgisi yok). */
const GENEL_ANONIM_ADLAR = new Set(["Anonim Bağışçı", "Gizli Kahraman", ""]);

/** Ürün içeren son bağışları, kalemleriyle birlikte çeker. */
async function urunBagislariniGetir(): Promise<HamBagis[]> {
  const { data: detayVerisi, error: detayHata } = await supabase
    .from("bagis_detaylari")
    .select("id, bagis_id, urun_id, adet")
    .order("id", { ascending: false })
    .limit(80);

  if (detayHata) throw detayHata;
  if (!detayVerisi || detayVerisi.length === 0) return [];

  const bagisIdleri: number[] = [];
  for (const satir of detayVerisi) {
    const bId = Number(satir.bagis_id);
    if (bId && !bagisIdleri.includes(bId)) {
      bagisIdleri.push(bId);
      if (bagisIdleri.length === LISTE_SINIRI) break;
    }
  }

  const { data: kisiler, error: kisiHata } = await supabase
    .from("bagislar")
    .select(BAGIS_ALANLARI)
    .in("id", bagisIdleri);
  if (kisiHata) throw kisiHata;

  const kisiHaritasi = new Map<number, BagisKaydi>();
  (kisiler ?? []).forEach((k) =>
    kisiHaritasi.set(Number(k.id), { ...k, id: Number(k.id) })
  );

  const kalemHaritasi = new Map<number, HamBagis["kalemler"]>();
  for (const d of detayVerisi) {
    const bId = Number(d.bagis_id);
    const adet = Number(d.adet);
    if (!bagisIdleri.includes(bId) || !(adet > 0)) continue;
    const mevcut = kalemHaritasi.get(bId) ?? [];
    mevcut.push({ urun_id: Number(d.urun_id), adet });
    kalemHaritasi.set(bId, mevcut);
  }

  const sonuc: HamBagis[] = [];
  for (const bId of bagisIdleri) {
    const kisi = kisiHaritasi.get(bId);
    if (kisi) sonuc.push({ ...kisi, kalemler: kalemHaritasi.get(bId) ?? [] });
  }
  return sonuc;
}

/** Ürünlü ya da ürünsüz, en son yapılan bağışları çeker. */
async function tumBagislariGetir(): Promise<HamBagis[]> {
  const { data, error } = await supabase
    .from("bagislar")
    .select(BAGIS_ALANLARI)
    .order("created_at", { ascending: false })
    .limit(LISTE_SINIRI);
  if (error) throw error;
  return (data ?? []).map((k) => ({ ...k, id: Number(k.id), kalemler: [] }));
}

/** Tek bir bağışı (kullanıcının kendi bağışı) kalemleriyle birlikte çeker. */
async function tekBagisGetir(bagisId: number): Promise<HamBagis | null> {
  const { data: kisi, error: kisiHata } = await supabase
    .from("bagislar")
    .select(BAGIS_ALANLARI)
    .eq("id", bagisId)
    .maybeSingle();
  if (kisiHata) throw kisiHata;
  if (!kisi) return null;

  const { data: detaylar, error: detayHata } = await supabase
    .from("bagis_detaylari")
    .select("urun_id, adet")
    .eq("bagis_id", bagisId);
  if (detayHata) throw detayHata;

  return {
    ...kisi,
    id: Number(kisi.id),
    kalemler: (detaylar ?? [])
      .map((d) => ({ urun_id: Number(d.urun_id), adet: Number(d.adet) }))
      .filter((d) => d.adet > 0),
  };
}

/**
 * Görünüme uygun son bağışları çeker. Kullanıcının kendi bağışı listede
 * yoksa (ör. `/destek`te yalnızca nakdi bağış) ayrıca eklenir; böylece her iki
 * sayfada da düzenlenebilir. Hata olursa null döner (mevcut liste korunur).
 */
async function sonBagislariGetir(
  gorunum: BagisListesiGorunumu,
  kendiBagisId: number | null
): Promise<HamBagis[] | null> {
  try {
    const liste =
      gorunum === "urun"
        ? await urunBagislariniGetir()
        : await tumBagislariGetir();

    if (kendiBagisId && !liste.some((b) => b.id === kendiBagisId)) {
      const kendi = await tekBagisGetir(kendiBagisId);
      if (kendi) liste.unshift(kendi);
    }
    return liste;
  } catch (err) {
    console.warn("Bağışlar çekilirken hata:", err);
    return null;
  }
}

export default function BagisListesi({
  gorunum,
  urunler = BOS_URUNLER,
  urunlerYukleniyor = false,
}: {
  gorunum: BagisListesiGorunumu;
  /** Pasifler dahil tüm ürünler (üst bileşende bir kez çekilir); "urun" görünümü için. */
  urunler?: Urun[];
  urunlerYukleniyor?: boolean;
}) {
  const [hamBagislar, setHamBagislar] = useState<HamBagis[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const sonBagis = useSonBagis();
  const kendiBagisId = sonBagis?.id ?? null;

  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);
  const [formAdSoyad, setFormAdSoyad] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formMesaj, setFormMesaj] = useState("");
  const [formAnonim, setFormAnonim] = useState(false);
  const [guncelleniyor, setGuncelleniyor] = useState(false);
  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `bagis-liste-gradyan-${benzersizId}`;
  const adAlanId = `bagis-duzenle-ad-${benzersizId}`;
  const instagramAlanId = `bagis-duzenle-instagram-${benzersizId}`;
  const mesajAlanId = `bagis-duzenle-mesaj-${benzersizId}`;

  useEffect(() => {
    let iptal = false;
    let zamanlayici: ReturnType<typeof setTimeout> | undefined;

    const getir = () => {
      sonBagislariGetir(gorunum, kendiBagisId).then((sonuc) => {
        if (iptal) return;
        // Geçici hatada eldeki liste silinmez.
        if (sonuc) setHamBagislar(sonuc);
        setYukleniyor(false);
      });
    };

    getir();

    // Art arda gelen INSERT olayları tek bir yenilemede birleştirilir.
    const tablo = gorunum === "urun" ? "bagis_detaylari" : "bagislar";
    const kanal = supabase
      .channel(`public:${tablo}_canli`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: tablo },
        () => {
          clearTimeout(zamanlayici);
          zamanlayici = setTimeout(getir, YENILEME_GECIKMESI_MS);
        }
      )
      .subscribe();

    return () => {
      iptal = true;
      clearTimeout(zamanlayici);
      supabase.removeChannel(kanal);
    };
  }, [gorunum, kendiBagisId]);

  const bagislar = useMemo<ListeBagisi[]>(() => {
    const urunAdlari = new Map(urunler.map((u) => [Number(u.id), u.ad]));
    const liste: ListeBagisi[] = [];
    for (const { kalemler, ...kisi } of hamBagislar) {
      const kalemListesi: UrunKalemi[] = [];
      for (const kalem of kalemler) {
        const ad = urunAdlari.get(kalem.urun_id);
        if (ad) kalemListesi.push({ adet: kalem.adet, ad });
      }
      // Ürün görünümünde ürünsüz kayıtlardan yalnızca kullanıcının kendi
      // (nakdi) bağışı gösterilir; nakdi görünümde ürün rozeti çizilmez.
      if (gorunum === "nakdi") {
        liste.push({ ...kisi, urunler: [] });
      } else if (
        kalemListesi.length > 0 ||
        (kisi.nakdi_tutar ?? 0) > 0 ||
        kisi.id === kendiBagisId
      ) {
        liste.push({ ...kisi, urunler: kalemListesi });
      }
    }
    return liste;
  }, [hamBagislar, urunler, gorunum, kendiBagisId]);

  const duzenlemeyiBaslat = (bagis: ListeBagisi) => {
    setDuzenlenenId(bagis.id);
    setFormAdSoyad(
      bagis.is_anonymous || GENEL_ANONIM_ADLAR.has(bagis.ad_soyad ?? "")
        ? ""
        : bagis.ad_soyad || ""
    );
    setFormInstagram(bagis.instagram_kullanici_adi || "");
    setFormMesaj(bagis.mesaj || "");
    setFormAnonim(Boolean(bagis.is_anonymous));
  };

  const degisiklikleriKaydet = async (bagisId: number) => {
    if (!sonBagis || sonBagis.id !== bagisId) {
      alert("Bu bağışı düzenleme süreniz dolmuş.");
      setDuzenlenenId(null);
      return;
    }

    setGuncelleniyor(true);
    try {
      const yanit = await fetch("/api/bagis-duzenle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bagisId,
          token: sonBagis.token,
          ad_soyad: formAdSoyad,
          instagram_kullanici_adi: formInstagram,
          mesaj: formMesaj,
          is_anonymous: formAnonim,
        }),
      });

      const sonuc: { data?: BagisKisi; error?: string } = await yanit
        .json()
        .catch(() => ({}));

      if (yanit.status === 403) {
        sonBagisSil();
        setDuzenlenenId(null);
        alert("Düzenleme süreniz (30 dakika) dolmuş.");
        return;
      }
      if (!yanit.ok || !sonuc.data) {
        throw new Error(sonuc.error || "Güncellenemedi");
      }

      const guncel = sonuc.data;
      setHamBagislar((onceki) =>
        onceki.map((b) =>
          b.id === bagisId
            ? {
                ...b,
                ad_soyad: guncel.ad_soyad,
                instagram_kullanici_adi: guncel.instagram_kullanici_adi,
                mesaj: guncel.mesaj,
                is_anonymous: guncel.is_anonymous,
              }
            : b
        )
      );
      setDuzenlenenId(null);
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      alert("Bilgiler güncellenirken bir hata oluştu.");
    } finally {
      setGuncelleniyor(false);
    }
  };

  const siraliBagislar = [...bagislar].sort((a, b) => {
    if (a.id === kendiBagisId) return -1;
    if (b.id === kendiBagisId) return 1;
    return 0;
  });

  return (
    <section aria-label="İyilik Hareketimiz" className="w-full pt-8 pb-6">
      {/* Ortak SVG Kırmızı-Turuncu Gradyan Tanımı */}
      <GradyanTanimi id={gradyanId} />

      {/* ORTALI KALKAN İKONLU BÖLÜM BAŞLIĞI (Kutusuz, Ferah Ayrım) */}
      <div className="text-center mb-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/20">
          <FontAwesomeIcon icon={faShieldHalved} className="text-3xl text-white" />
        </div>
        <h2 className="mt-3.5 text-2xl font-extrabold tracking-tight text-gray-800">
          İyilik Hareketimiz
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Desteğinizle hayalleri gerçeğe dönüştürüyoruz.
        </p>
      </div>

      {/* BAĞIŞÇI KARTLARI */}
      {yukleniyor || (gorunum === "urun" && urunlerYukleniyor) ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="donation-panel h-20 w-full animate-pulse p-3.5"
            />
          ))}
        </div>
      ) : siraliBagislar.length === 0 ? (
        <div className="donation-panel px-4 py-6 text-center text-xs text-gray-500">
          {gorunum === "urun"
            ? "Henüz görüntülenecek ürün desteği bulunmuyor."
            : "Henüz görüntülenecek bağış yok."}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {siraliBagislar.map((bagis) => {
            const igKullanici = bagis.instagram_kullanici_adi
              ?.replace("@", "")
              .trim();
            const instagramVar = !bagis.is_anonymous && Boolean(igKullanici);
            const kullanicininKendiKarti = bagis.id === kendiBagisId;
            const duzenlemeAcik = duzenlenenId === bagis.id;
            // Nakdi görünümde ve ürünsüz (yalnızca nakdi) bağışta TL tutarı gösterilir.
            const tutarGorunur = gorunum === "nakdi";
            const tutar = bagis.toplam_tutar || bagis.nakdi_tutar || 0;
            // Anonim bağışlarda sunucu yalnızca baş harfleri ("A. Y.") yazar.
            const gorunenAd = bagis.is_anonymous
              ? GENEL_ANONIM_ADLAR.has(bagis.ad_soyad?.trim() ?? "")
                ? "Anonim Bağışçı"
                : bagis.ad_soyad!.trim()
              : instagramVar
                ? `@${igKullanici}`
                : bagis.ad_soyad || "Anonim Bağışçı";

            return (
              <li
                key={bagis.id}
                className={`donation-panel flex flex-col gap-2.5 p-3.5 transition-all ${
                  kullanicininKendiKarti ? "ring-2 ring-orange-200" : ""
                }`}
              >
                {/* 1. SATIR: Avatar + bağışçı adı, sağda tutar */}
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative shrink-0">
                      {bagis.is_anonymous ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                          <GradyenIkon icon={faUser} className="h-4 w-4" gradyanId={gradyanId} />
                        </div>
                      ) : (
                        <div
                          aria-hidden="true"
                          className={`flex h-10 w-10 items-center justify-center rounded-full border text-[13px] font-extrabold ${avatarRengi(gorunenAd)}`}
                        >
                          {basHarfler(gorunenAd)}
                        </div>
                      )}
                      {instagramVar && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                          <GradyenIkon icon={faInstagram} className="h-2.5 w-2.5" gradyanId={gradyanId} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      {instagramVar ? (
                        <a
                          href={"https://instagram.com/" + igKullanici}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-[13px] font-bold text-gray-800 transition-colors hover:text-gray-600"
                        >
                          {gorunenAd}
                        </a>
                      ) : (
                        <span className="block truncate text-[13px] font-bold text-gray-800">
                          {gorunenAd}
                        </span>
                      )}

                      {kullanicininKendiKarti && (
                        <span className="mt-0.5 inline-block rounded-full bg-orange-50 px-1.5 py-px text-[10px] font-bold text-orange-600 ring-1 ring-orange-200">
                          Sizin bağışınız
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sağ: (kendi kartıysa) Düzenle butonu ve (varsa) TL tutarı */}
                  <div className="flex shrink-0 items-center gap-2">
                    {kullanicininKendiKarti && !duzenlemeAcik && (
                      <button
                        type="button"
                        onClick={() => duzenlemeyiBaslat(bagis)}
                        aria-label="Bağış bilgilerini düzenle"
                        className="ui-focus inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <GradyenIkon
                          icon={faPenToSquare}
                          className="h-3.5 w-3.5"
                          gradyanId={gradyanId}
                        />
                        <span>Düzenle</span>
                      </button>
                    )}

                    {tutarGorunur && (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-red-500 py-1 pl-2 pr-2.5 text-[13px] font-extrabold tabular-nums text-white shadow-sm shadow-orange-500/25">
                        <FontAwesomeIcon icon={faHeart} className="text-[10px] text-white/90" />
                        {paraFormati.format(tutar)} ₺
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. SATIR: Hemen Altında Soldan Sağa Ürün Bilgileri */}
                {bagis.urunler.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {bagis.urunler.map((u, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/70 bg-gray-50/70 px-2.5 py-1 text-xs font-bold text-gray-800"
                    >
                      <GradyenIkon
                        icon={faGift}
                        className="h-3.5 w-3.5 shrink-0"
                        gradyanId={gradyanId}
                      />
                      <span>
                        {u.adet} {u.ad}
                      </span>
                    </span>
                  ))}

                  {/* Ürünlerle birlikte yapılan serbest nakdi yardım */}
                  {(bagis.nakdi_tutar ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/70 bg-gray-50/70 px-2.5 py-1 text-xs font-bold text-gray-800">
                      <GradyenIkon
                        icon={faHandHoldingHeart}
                        className="h-3.5 w-3.5 shrink-0"
                        gradyanId={gradyanId}
                      />
                      <span className="tabular-nums">
                        {paraFormati.format(bagis.nakdi_tutar ?? 0)} ₺ Nakdi
                        Destek
                      </span>
                    </span>
                  )}
                </div>
                )}

                {/* 3. SATIR: En Altta Hafif Gri Mesaj Kutusu (Varsa) */}
                {!duzenlemeAcik && bagis.mesaj && (
                  <div className="flex w-full items-start gap-2 rounded-xl border border-gray-200/60 bg-gray-50/90 p-2.5">
                    <GradyenIkon
                      icon={faComment}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      gradyanId={gradyanId}
                    />
                    <p className="text-xs leading-relaxed text-gray-700">
                      {bagis.mesaj}
                    </p>
                  </div>
                )}

                {/* AÇILIR DÜZENLEME PANELİ */}
                {duzenlemeAcik && (
                  <div className="mt-1 w-full space-y-2.5 rounded-2xl border border-gray-200 bg-gray-50/90 p-3">
                    <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                      <span className="text-xs font-extrabold text-gray-800">
                        Kart Bilgilerinizi Düzenleyin
                      </span>
                      <button
                        type="button"
                        onClick={() => setDuzenlenenId(null)}
                        aria-label="Düzenlemeyi kapat"
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-xs" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={adAlanId}
                          className="mb-1 block text-[11px] font-bold text-gray-600"
                        >
                          Ad Soyad
                        </label>
                        <input
                          id={adAlanId}
                          type="text"
                          maxLength={80}
                          autoComplete="name"
                          placeholder="Adınız Soyadınız"
                          value={formAdSoyad}
                          onChange={(e) => setFormAdSoyad(e.target.value)}
                          disabled={formAnonim}
                          className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-800 focus:border-orange-400 focus:outline-none disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={instagramAlanId}
                          className="mb-1 block text-[11px] font-bold text-gray-600"
                        >
                          Instagram Kullanıcı Adı
                        </label>
                        <input
                          id={instagramAlanId}
                          type="text"
                          maxLength={60}
                          autoCapitalize="none"
                          autoCorrect="off"
                          placeholder="@kullaniciadi"
                          value={formInstagram}
                          onChange={(e) => setFormInstagram(e.target.value)}
                          disabled={formAnonim}
                          className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-800 focus:border-orange-400 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={mesajAlanId}
                        className="mb-1 block text-[11px] font-bold text-gray-600"
                      >
                        Mesajınız
                      </label>
                      <textarea
                        id={mesajAlanId}
                        rows={2}
                        maxLength={500}
                        placeholder="Mesajınızı buraya yazabilirsiniz..."
                        value={formMesaj}
                        onChange={(e) => setFormMesaj(e.target.value)}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-800 focus:border-orange-400 focus:outline-none"
                      />
                    </div>

                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200/80 bg-white p-2.5">
                      <input
                        type="checkbox"
                        checked={formAnonim}
                        onChange={(e) => setFormAnonim(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded accent-orange-500"
                      />
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        <GradyenIkon
                          icon={faShieldHalved}
                          className="h-3.5 w-3.5"
                          gradyanId={gradyanId}
                        />
                        İsmimi gizle (Anonim Bağışçı)
                      </span>
                    </label>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDuzenlenenId(null)}
                        className="h-9 cursor-pointer rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
                      >
                        Vazgeç
                      </button>

                      <button
                        type="button"
                        onClick={() => degisiklikleriKaydet(bagis.id)}
                        disabled={guncelleniyor}
                        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 text-xs font-bold text-white shadow-xs hover:from-orange-600 hover:to-red-600 disabled:opacity-60"
                      >
                        {guncelleniyor ? (
                          <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                        ) : (
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                        )}
                        <span>{guncelleniyor ? "Kaydediliyor..." : "Kaydet"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
