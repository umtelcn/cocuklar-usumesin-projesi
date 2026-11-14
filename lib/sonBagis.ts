import { useMemo, useSyncExternalStore } from "react";

/**
 * Kullanıcının bu tarayıcıdan yaptığı son bağışın kaydı.
 * `token`, sunucunun ürettiği imzalı düzenleme anahtarıdır; süre ve imza
 * sunucuda doğrulanır, buradaki `bitis` yalnızca arayüz içindir.
 */
export interface SonBagis {
  id: number;
  token: string;
  bitis: number;
}

const ANAHTAR = "cocuklar_usumesin_son_bagis";
const dinleyiciler = new Set<() => void>();

function haberVer() {
  dinleyiciler.forEach((dinleyici) => dinleyici());
}

function coz(ham: string | null): SonBagis | null {
  if (!ham) return null;
  try {
    const veri: unknown = JSON.parse(ham);
    if (typeof veri !== "object" || veri === null) return null;
    const { id, token, bitis } = veri as Record<string, unknown>;
    if (
      typeof id === "number" &&
      typeof token === "string" &&
      typeof bitis === "number"
    ) {
      return { id, token, bitis };
    }
  } catch {
    // bozuk kayıt
  }
  return null;
}

export function sonBagisKaydet(kayit: SonBagis) {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(kayit));
  } catch {
    // depolama kapalıysa düzenleme özelliği sessizce devre dışı kalır
  }
  haberVer();
}

export function sonBagisSil() {
  try {
    localStorage.removeItem(ANAHTAR);
  } catch {
    // yok say
  }
  haberVer();
}

function abone(dinleyici: () => void) {
  dinleyiciler.add(dinleyici);
  window.addEventListener("storage", dinleyici);
  return () => {
    dinleyiciler.delete(dinleyici);
    window.removeEventListener("storage", dinleyici);
  };
}

/** Geçerli (süresi dolmamış) kaydın ham metnini döner; yoksa null. */
function anlikGoruntu(): string | null {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    const kayit = coz(ham);
    if (!kayit || kayit.bitis <= Date.now()) return null;
    return ham;
  } catch {
    return null;
  }
}

function sunucuGoruntusu(): string | null {
  return null;
}

/** Düzenleme süresi dolmamış son bağışı verir; yoksa null. */
export function useSonBagis(): SonBagis | null {
  const ham = useSyncExternalStore(abone, anlikGoruntu, sunucuGoruntusu);
  return useMemo(() => coz(ham), [ham]);
}
