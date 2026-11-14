"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import {
  faUser,
  faBuildingColumns,
  faTurkishLiraSign,
  faFileInvoice,
  faComment,
  faCheck,
  faSpinner,
  faXmark,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

const BOS_FORM = { ad_soyad: "", iban: "", tutar: "", mesaj: "" };
const EN_FAZLA_DEKONT_BOYUTU = 10 * 1024 * 1024;

const ETIKET_SINIFI =
  "mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700";
const ALAN_SINIFI =
  "h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm";

export default function IadeTalebi() {
  const [modalAcik, setModalAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basariMesaji, setBasariMesaji] = useState(false);

  const [form, setForm] = useState(BOS_FORM);
  const [dekont, setDekont] = useState<File | null>(null);

  const dosyaInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tetikleyiciRef = useRef<HTMLButtonElement>(null);
  const kapanmaZamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `iade-gradyan-${benzersizId}`;
  const baslikId = `iade-baslik-${benzersizId}`;
  const aciklamaId = `iade-aciklama-${benzersizId}`;
  const adId = `iade-ad-${benzersizId}`;
  const ibanId = `iade-iban-${benzersizId}`;
  const tutarId = `iade-tutar-${benzersizId}`;
  const dekontId = `iade-dekont-${benzersizId}`;
  const mesajId = `iade-mesaj-${benzersizId}`;

  const modaliKapat = useCallback(() => {
    if (kapanmaZamanlayici.current) {
      clearTimeout(kapanmaZamanlayici.current);
      kapanmaZamanlayici.current = null;
    }
    setModalAcik(false);
    setBasariMesaji(false);
    tetikleyiciRef.current?.focus();
  }, []);

  // Açıkken: Esc ile kapanır, arka plan kaymaz, odak pencereye taşınır.
  useEffect(() => {
    if (!modalAcik) return;

    const tusDinle = (e: KeyboardEvent) => {
      if (e.key === "Escape") modaliKapat();
    };
    document.addEventListener("keydown", tusDinle);

    const oncekiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", tusDinle);
      document.body.style.overflow = oncekiTasma;
    };
  }, [modalAcik, modaliKapat]);

  useEffect(
    () => () => {
      if (kapanmaZamanlayici.current) clearTimeout(kapanmaZamanlayici.current);
    },
    []
  );

  const dekontSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0] || null;
    if (dosya && dosya.size > EN_FAZLA_DEKONT_BOYUTU) {
      alert("Dekont dosyası en fazla 10 MB olabilir.");
      e.target.value = "";
      return;
    }
    setDekont(dosya);
  };

  const formGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dekont) {
      alert("Lütfen işlem dekontunu yükleyin.");
      return;
    }

    setYukleniyor(true);
    try {
      const uzanti = (dekont.name.split(".").pop() || "dosya")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 5);
      const dosyaAdi = `dekontlar/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${uzanti || "dosya"}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("hikayeler")
        .upload(dosyaAdi, dekont);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("hikayeler").getPublicUrl(uploadData.path);

      const { error: dbError } = await supabase.from("iade_talepleri").insert([
        {
          ad_soyad: form.ad_soyad.trim(),
          iban: form.iban.replace(/\s+/g, "").toUpperCase(),
          tutar: form.tutar,
          mesaj: form.mesaj.trim(),
          dekont_url: publicUrl,
        },
      ]);

      if (dbError) throw dbError;

      // Form bir sonraki açılış için temizlenir.
      setForm(BOS_FORM);
      setDekont(null);
      setBasariMesaji(true);
      kapanmaZamanlayici.current = setTimeout(modaliKapat, 3000);
    } catch (err) {
      console.error("İade talebi hatası:", err);
      alert("Talebiniz gönderilirken bir hata oluştu, lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="w-full flex justify-center pt-1">
      <button
        ref={tetikleyiciRef}
        type="button"
        onClick={() => setModalAcik(true)}
        aria-haspopup="dialog"
        className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-800 underline decoration-gray-300 underline-offset-4 transition-colors"
      >
        Bağış İade Talebinde Bulun
      </button>

      {modalAcik && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs">
          <GradyanTanimi id={gradyanId} />

          {/* min-h-full + ortalama: kısa ekranlarda üstten kesilmez, kaydırılabilir */}
          <div
            className="flex min-h-full items-center justify-center p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) modaliKapat();
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={baslikId}
              aria-describedby={aciklamaId}
              tabIndex={-1}
              className="donation-panel relative w-full max-w-md overflow-hidden rounded-2xl p-4 pb-5 shadow-2xl focus:outline-none"
            >
              {/* BAŞLIK */}
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-red-50">
                    <GradyenIkon
                      icon={faRotateLeft}
                      className="h-5 w-5"
                      gradyanId={gradyanId}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id={baslikId}
                      className="text-[17px] font-bold leading-6 tracking-tight text-gray-900"
                    >
                      İade Talebi
                    </h2>
                    <p id={aciklamaId} className="mt-0.5 text-xs text-gray-500">
                      Bağışınızı koşulsuz olarak iade alabilirsiniz.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={modaliKapat}
                  aria-label="İade talebi penceresini kapat"
                  className="ui-focus flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-sm" />
                </button>
              </div>

              {basariMesaji ? (
                <div className="py-8 text-center" role="status">
                  <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                    <FontAwesomeIcon icon={faCheck} className="text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Talebiniz Alındı
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-gray-600">
                    İade işleminiz incelenip en kısa sürede hesabınıza
                    aktarılacaktır.
                  </p>
                </div>
              ) : (
                <form onSubmit={formGonder} className="space-y-3.5 pt-3.5">
                  <div>
                    <label htmlFor={adId} className={ETIKET_SINIFI}>
                      <GradyenIkon
                        icon={faUser}
                        className="h-3 w-3"
                        gradyanId={gradyanId}
                      />
                      <span>Ad Soyad</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={adId}
                      required
                      type="text"
                      maxLength={80}
                      autoComplete="name"
                      placeholder="Adınız Soyadınız"
                      value={form.ad_soyad}
                      onChange={(e) =>
                        setForm({ ...form, ad_soyad: e.target.value })
                      }
                      className={ALAN_SINIFI}
                    />
                  </div>

                  <div>
                    <label htmlFor={ibanId} className={ETIKET_SINIFI}>
                      <GradyenIkon
                        icon={faBuildingColumns}
                        className="h-3 w-3"
                        gradyanId={gradyanId}
                      />
                      <span>IBAN Numaranız</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={ibanId}
                      required
                      type="text"
                      maxLength={42}
                      autoComplete="off"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="TR..."
                      value={form.iban}
                      onChange={(e) =>
                        setForm({ ...form, iban: e.target.value })
                      }
                      className={ALAN_SINIFI}
                    />
                  </div>

                  <div>
                    <label htmlFor={tutarId} className={ETIKET_SINIFI}>
                      <GradyenIkon
                        icon={faTurkishLiraSign}
                        className="h-3 w-3"
                        gradyanId={gradyanId}
                      />
                      <span>İade İstenen Tutar (₺)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={tutarId}
                      required
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step="any"
                      placeholder="0"
                      value={form.tutar}
                      onChange={(e) =>
                        setForm({ ...form, tutar: e.target.value })
                      }
                      className={`${ALAN_SINIFI} donation-amount`}
                    />
                  </div>

                  <div>
                    <label htmlFor={dekontId} className={ETIKET_SINIFI}>
                      <GradyenIkon
                        icon={faFileInvoice}
                        className="h-3 w-3"
                        gradyanId={gradyanId}
                      />
                      <span>Dekont</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={dekontId}
                      type="file"
                      accept="image/*,.pdf"
                      ref={dosyaInputRef}
                      onChange={dekontSec}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={() => dosyaInputRef.current?.click()}
                      className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-3 text-xs font-medium text-gray-600 transition-colors hover:border-orange-400 hover:bg-orange-50/30"
                    >
                      <GradyenIkon
                        icon={dekont ? faCheck : faFileInvoice}
                        className="h-3.5 w-3.5 shrink-0"
                        gradyanId={gradyanId}
                      />
                      <span className="truncate">
                        {dekont
                          ? `Seçildi: ${dekont.name}`
                          : "Dekont Seçmek İçin Tıklayın"}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label htmlFor={mesajId} className={ETIKET_SINIFI}>
                      <GradyenIkon
                        icon={faComment}
                        className="h-3.5 w-3.5"
                        gradyanId={gradyanId}
                      />
                      <span>Neden</span>
                      <span className="text-[11px] font-normal text-gray-400">
                        (İsteğe bağlı)
                      </span>
                    </label>
                    <textarea
                      id={mesajId}
                      rows={2}
                      maxLength={500}
                      value={form.mesaj}
                      onChange={(e) =>
                        setForm({ ...form, mesaj: e.target.value })
                      }
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-normal text-gray-800 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none sm:text-sm"
                      placeholder="Kısaca belirtebilirsiniz..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={yukleniyor}
                    className="ui-focus flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-colors hover:from-orange-600 hover:to-red-600 disabled:opacity-60 sm:text-[13px]"
                  >
                    <FontAwesomeIcon
                      icon={yukleniyor ? faSpinner : faCheck}
                      spin={yukleniyor}
                      className="text-xs"
                    />
                    <span>
                      {yukleniyor ? "Gönderiliyor..." : "Talebi Gönder"}
                    </span>
                  </button>
                </form>
              )}

              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
