"use client";

import { useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faLock,
  faShieldHalved,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabaseClient";
import GradyenIkon from "@/components/ui/GradyenIkon";
import { ADMIN_GRADYAN, ALAN_SINIFI, BUTON, ETIKET_SINIFI } from "@/components/admin/ortak";

/**
 * Yönetici giriş ekranı (Supabase Auth, e-posta + şifre).
 * Yönetici yetkisi (profiles kaydı) giriş sonrası sunucuda doğrulanır.
 */
export default function AdminGiris({ ilkHata }: { ilkHata?: string | null }) {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const gosterilenHata = hata ?? ilkHata ?? null;

  const girisYap = async (e: FormEvent) => {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: sifre,
    });
    setYukleniyor(false);
    if (error) {
      setHata(
        error.message === "Invalid login credentials"
          ? "E-posta veya şifre hatalı."
          : "Giriş yapılamadı. Lütfen tekrar deneyin."
      );
      return;
    }
    setSifre("");
  };

  return (
    <div className="flex min-w-0 justify-center py-8">
      <form onSubmit={girisYap} className="donation-panel w-full min-w-0 max-w-sm space-y-5 p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
            <GradyenIkon icon={faShieldHalved} gradyanId={ADMIN_GRADYAN} className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Yönetim Paneli</h1>
            <p className="text-xs text-gray-500">Çocuklar Üşümesin yönetici girişi</p>
          </div>
        </div>

        <div>
          <label htmlFor="admin-email" className={ETIKET_SINIFI}>
            <FontAwesomeIcon icon={faEnvelope} className="mr-1.5 text-gray-400" />
            E-posta
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ALAN_SINIFI}
            placeholder="ornek@eposta.com"
          />
        </div>

        <div>
          <label htmlFor="admin-sifre" className={ETIKET_SINIFI}>
            <FontAwesomeIcon icon={faLock} className="mr-1.5 text-gray-400" />
            Şifre
          </label>
          <div className="relative">
            <input
              id="admin-sifre"
              type={sifreGorunur ? "text" : "password"}
              autoComplete="current-password"
              required
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              className={`${ALAN_SINIFI} pr-11`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setSifreGorunur((g) => !g)}
              aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-1 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={sifreGorunur ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {gosterilenHata && (
          <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
            {gosterilenHata}
          </p>
        )}

        <button type="submit" disabled={yukleniyor} className={`${BUTON.ana} w-full`}>
          {yukleniyor && <FontAwesomeIcon icon={faSpinner} spin />}
          {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
