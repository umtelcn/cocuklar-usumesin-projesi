"use client";

import { useState, useEffect, useRef, useId } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import {
  faUser,
  faPhone,
  faLocationDot,
  faComment,
  faCamera,
  faCheck,
  faSpinner,
  faXmark,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";

interface Il {
  id: number;
  ad: string;
}

interface Ilce {
  id: number;
  il_id: number;
  ad: string;
}

export default function TalepFormu() {
  const [iller, setIller] = useState<Il[]>([]);
  const [ilceler, setIlceler] = useState<Ilce[]>([]);

  const [adSoyad, setAdSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [seciliIlId, setSeciliIlId] = useState<number | "">("");
  const [seciliIlAdi, setSeciliIlAdi] = useState("");
  const [seciliIlceAdi, setSeciliIlceAdi] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [dosyalar, setDosyalar] = useState<File[]>([]);

  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);

  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `talep-gradyan-${benzersizId}`;
  const adId = `talep-ad-${benzersizId}`;
  const telefonId = `talep-telefon-${benzersizId}`;
  const ilId = `talep-il-${benzersizId}`;
  const ilceId = `talep-ilce-${benzersizId}`;
  const mesajId = `talep-mesaj-${benzersizId}`;
  const fotografId = `talep-fotograf-${benzersizId}`;

  // 1. İlleri Çek
  useEffect(() => {
    async function illeriGetir() {
      const { data } = await supabase
        .from("iller")
        .select("id, ad")
        .order("ad", { ascending: true });
      if (data) setIller(data);
    }
    illeriGetir();
  }, []);

  // 2. Seçilen İle Göre İlçeleri Çek (liste, il değişince ilDegistir'de boşaltılır)
  useEffect(() => {
    if (!seciliIlId) return;
    let iptal = false;

    supabase
      .from("ilceler")
      .select("id, il_id, ad")
      .eq("il_id", seciliIlId)
      .order("ad", { ascending: true })
      .then(({ data }) => {
        // Hızlı il değişiminde eski isteğin yanıtı yenisinin üzerine yazmasın.
        if (!iptal && data) setIlceler(data);
      });

    return () => {
      iptal = true;
    };
  }, [seciliIlId]);

  const ilDegistir = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSeciliIlId(id || "");
    const bulunan = iller.find((i) => i.id === id);
    setSeciliIlAdi(bulunan ? bulunan.ad : "");
    setSeciliIlceAdi("");
    setIlceler([]);
  };

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const secilenler = Array.from(e.target.files);
    setDosyalar((onceki) => [...onceki, ...secilenler].slice(0, 3));
    // Aynı dosya kaldırılıp yeniden seçilebilsin.
    e.target.value = "";
  };

  const dosyaKaldir = (index: number) => {
    setDosyalar((onceki) => onceki.filter((_, i) => i !== index));
  };

  const formuGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adSoyad.trim() || !telefon.trim() || !seciliIlAdi || !seciliIlceAdi || !mesaj.trim()) {
      alert("Lütfen zorunlu alanları doldurunuz.");
      return;
    }

    setGonderiliyor(true);
    try {
      const yuklenenYollar: string[] = [];

      // Varsa görselleri 'talep-gorselleri' bucket'ına yükle
      for (const dosya of dosyalar) {
        const uzanti = dosya.name.split(".").pop() || "jpg";
        const dosyaYolu = `talepler/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${uzanti}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("talep-gorselleri")
          .upload(dosyaYolu, dosya);

        if (!uploadErr && uploadData) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("talep-gorselleri").getPublicUrl(uploadData.path);
          yuklenenYollar.push(publicUrl);
        }
      }

      const { error } = await supabase.from("yardim_talepleri").insert([
        {
          ad_soyad: adSoyad.trim(),
          telefon: telefon.trim(),
          il: seciliIlAdi,
          ilce: seciliIlceAdi,
          mesaj: mesaj.trim(),
          gorsel_yollari: yuklenenYollar,
          durum: "beklemede",
        },
      ]);

      if (error) throw error;

      setTamamlandi(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Talep gönderme hatası:", err);
      alert("Talebiniz gönderilirken bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setGonderiliyor(false);
    }
  };

  const yeniTalepAc = () => {
    setTamamlandi(false);
    setAdSoyad("");
    setTelefon("");
    setSeciliIlId("");
    setSeciliIlAdi("");
    setSeciliIlceAdi("");
    setIlceler([]);
    setMesaj("");
    setDosyalar([]);
  };

  if (tamamlandi) {
    return (
      <section aria-label="Talep Alındı" className="w-full">
        <div className="donation-panel relative overflow-hidden p-6 text-center">
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
            <FontAwesomeIcon icon={faCheck} className="text-2xl" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            Yardım Talebiniz Alındı
          </h2>
          <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-gray-600">
            Başvurunuz gönüllü ekibimiz tarafından incelenmek üzere kaydedilmiştir. En kısa sürede sizinle iletişime geçeceğiz.
          </p>
          <button
            type="button"
            onClick={yeniTalepAc}
            className="ui-focus mt-5 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Yeni Başvuru Formu
          </button>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
          />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Yardım Talebi Formu" className="w-full space-y-2.5">
      <GradyanTanimi id={gradyanId} />

      {/* ÜST BAŞLIK KARTI */}
      <div className="donation-panel flex items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <h1 className="text-[17px] font-bold leading-6 tracking-tight text-gray-900">
            Yardım Talebi Oluştur
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            İhtiyaç sahibi ailelerimiz ve çocuklarımız için başvuru formu
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-red-50">
          <GradyenIkon
            icon={faHandHoldingHeart}
            className="h-5 w-5"
            gradyanId={gradyanId}
          />
        </div>
      </div>

      {/* FORM KARTI */}
      <form
        onSubmit={formuGonder}
        className="donation-panel relative overflow-hidden space-y-3.5 p-4 pb-5"
      >
        {/* Ad Soyad */}
        <div>
          <label
          htmlFor={adId}
          className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
        >
            <GradyenIkon icon={faUser} className="h-3 w-3" gradyanId={gradyanId} />
            <span>Adınız Soyadınız</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            id={adId}
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            placeholder="Adınız Soyadınız"
            value={adSoyad}
            onChange={(e) => setAdSoyad(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>

        {/* Telefon Numarası */}
        <div>
          <label
          htmlFor={telefonId}
          className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
        >
            <GradyenIkon icon={faPhone} className="h-3 w-3" gradyanId={gradyanId} />
            <span>Telefon Numaranız</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            id={telefonId}
            type="tel"
            inputMode="tel"
            required
            maxLength={20}
            autoComplete="tel"
            placeholder="05XX XXX XX XX"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>

        {/* İl ve İlçe (Yan Yana 2 Sütun) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label
          htmlFor={ilId}
          className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
        >
              <GradyenIkon
                icon={faLocationDot}
                className="h-3 w-3"
                gradyanId={gradyanId}
              />
              <span>İl</span>
              <span className="text-red-500">*</span>
            </label>
            <select
              id={ilId}
              required
              value={seciliIlId}
              onChange={ilDegistir}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 text-xs font-normal text-gray-800 focus:border-orange-400 focus:bg-white focus:outline-none"
            >
              <option value="">İl Seçiniz</option>
              {iller.map((il) => (
                <option key={il.id} value={il.id}>
                  {il.ad}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
          htmlFor={ilceId}
          className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
        >
              <GradyenIkon
                icon={faLocationDot}
                className="h-3 w-3"
                gradyanId={gradyanId}
              />
              <span>İlçe</span>
              <span className="text-red-500">*</span>
            </label>
            <select
              id={ilceId}
              required
              disabled={!seciliIlId}
              value={seciliIlceAdi}
              onChange={(e) => setSeciliIlceAdi(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-2.5 text-xs font-normal text-gray-800 focus:border-orange-400 focus:bg-white focus:outline-none disabled:opacity-50"
            >
              <option value="">İlçe Seçiniz</option>
              {ilceler.map((ilce) => (
                <option key={ilce.id} value={ilce.ad}>
                  {ilce.ad}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* İhtiyaç ve Durum Açıklaması */}
        <div>
          <label
          htmlFor={mesajId}
          className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
        >
            <GradyenIkon icon={faComment} className="h-3.5 w-3.5" gradyanId={gradyanId} />
            <span>İhtiyaç Durumu ve Açık Adresiniz</span>
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id={mesajId}
            rows={4}
            required
            maxLength={2000}
            placeholder="Çocuklarımızın yaşlarını, eksik olan ihtiyaçlarını ve adres bilgilerinizi kısaca yazınız..."
            value={mesaj}
            onChange={(e) => setMesaj(e.target.value)}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>

        {/* Fotoğraf Ekleme (İsteğe Bağlı) */}
        <div>
          <label
          htmlFor={fotografId}
          className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700"
        >
            <GradyenIkon icon={faCamera} className="h-3.5 w-3.5" gradyanId={gradyanId} />
            <span>Fotoğraf Ekle</span>
            <span className="text-[11px] font-normal text-gray-400">
              (İsteğe bağlı, en fazla 3 adet)
            </span>
          </label>

          <input
            id={fotografId}
            ref={dosyaInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={dosyaSec}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => dosyaInputRef.current?.click()}
            disabled={dosyalar.length >= 3}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 text-xs font-medium text-gray-600 transition-colors hover:border-orange-400 hover:bg-orange-50/30 disabled:opacity-50"
          >
            <GradyenIkon icon={faCamera} className="h-3.5 w-3.5" gradyanId={gradyanId} />
            <span>
              {dosyalar.length > 0
                ? `${dosyalar.length}/3 Fotoğraf Seçildi (+ Ekle)`
                : "Fotoğraf Seçmek İçin Tıklayın"}
            </span>
          </button>

          {dosyalar.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dosyalar.map((d, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700"
                >
                  <span className="max-w-[140px] truncate">{d.name}</span>
                  <button
                    type="button"
                    onClick={() => dosyaKaldir(idx)}
                    aria-label={`${d.name} fotoğrafını kaldır`}
                    className="cursor-pointer text-gray-400 hover:text-red-500"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gönder Butonu */}
        <button
          type="submit"
          disabled={gonderiliyor}
          className="ui-focus flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600 disabled:opacity-60 sm:text-[13px]"
        >
          {gonderiliyor ? (
            <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
          ) : (
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
          )}
          <span>{gonderiliyor ? "Gönderiliyor..." : "Yardım Talebini Gönder"}</span>
        </button>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
        />
      </form>
    </section>
  );
}
