import { useMemo, useSyncExternalStore } from "react";

/**
 * Kullanıcının bu tarayıcıdan yaptığı bir bağışın kaydı.
 * `token`, sunucunun ürettiği imzalı düzenleme anahtarıdır; süre ve imza
 * sunucuda doğrulanır, buradaki `bitis` yalnızca arayüz içindir.
 */
export interface SonBagis {
  id: number;
  token: string;
  bitis: number;
}

/** Bağışın listede sabitlendiği ve düzenlenebildiği süre (24 saat). */
export const KENDI_BAGIS_SURESI_MS = 24 * 60 * 60 * 1000;

const ANAHTAR = "cocuklar_usumesin_bagislarim";
/** Tek kayıt tutan eski sürümün anahtarı; ilk okumada yeni listeye taşınır. */
const ESKI_ANAHTAR = "cocuklar_usumesin_son_bagis";
/** Aynı tarayıcıda tutulacak en fazla bağış sayısı. */
const EN_FAZLA_KAYIT = 20;

const dinleyiciler = new Set<() => void>();

function haberVer() {
  dinleyiciler.forEach((dinleyici) => dinleyici());
}

function kayitMi(veri: unknown): veri is SonBagis {
  if (typeof veri !== "object" || veri === null) return false;
  const { id, token, bitis } = veri as Record<string, unknown>;
  return (
    typeof id === "number" &&
    typeof token === "string" &&
    typeof bitis === "number"
  );
}

function coz(ham: string | null): SonBagis[] {
  if (!ham) return [];
  try {
    const veri: unknown = JSON.parse(ham);
    if (Array.isArray(veri)) return veri.filter(kayitMi);
    if (kayitMi(veri)) return [veri];
  } catch {
    // bozuk kayıt
  }
  return [];
}

/** Depodaki tüm kayıtlar (eski tek kayıt dahil), yeniden eskiye. */
function hepsiniOku(): SonBagis[] {
  const liste = coz(localStorage.getItem(ANAHTAR));
  for (const eski of coz(localStorage.getItem(ESKI_ANAHTAR))) {
    if (!liste.some((k) => k.id === eski.id)) liste.push(eski);
  }
  return liste.sort((a, b) => b.id - a.id);
}

function yaz(liste: SonBagis[]) {
  const simdi = Date.now();
  const gecerli = liste
    .filter((k) => k.bitis > simdi)
    .slice(0, EN_FAZLA_KAYIT);
  localStorage.setItem(ANAHTAR, JSON.stringify(gecerli));
  localStorage.removeItem(ESKI_ANAHTAR);
}

/** Yeni bağışı listeye ekler (aynı id varsa günceller). */
export function sonBagisKaydet(kayit: SonBagis) {
  try {
    yaz([kayit, ...hepsiniOku().filter((k) => k.id !== kayit.id)]);
  } catch {
    // depolama kapalıysa düzenleme özelliği sessizce devre dışı kalır
  }
  haberVer();
}

/** Süresi dolan ya da geçersizleşen bir bağışı listeden çıkarır. */
export function sonBagisSil(bagisId: number) {
  try {
    yaz(hepsiniOku().filter((k) => k.id !== bagisId));
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

/**
 * Süresi dolmamış kayıtların metin hâli; içerik aynı kaldıkça aynı string
 * döndüğü için `useSyncExternalStore` gereksiz yeniden çizim yapmaz.
 */
function anlikGoruntu(): string {
  try {
    const simdi = Date.now();
    return JSON.stringify(hepsiniOku().filter((k) => k.bitis > simdi));
  } catch {
    return "[]";
  }
}

function sunucuGoruntusu(): string {
  return "[]";
}

/** Bu tarayıcıdan yapılmış, 24 saati dolmamış bağışlar (yeniden eskiye). */
export function useSonBagislar(): SonBagis[] {
  const ham = useSyncExternalStore(abone, anlikGoruntu, sunucuGoruntusu);
  return useMemo(() => coz(ham), [ham]);
}
