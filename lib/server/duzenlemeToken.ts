import { createHmac, timingSafeEqual } from "node:crypto";

/** Bağışçının kendi kartını düzenleyebildiği süre (24 saat). */
export const DUZENLEME_SURESI_MS = 24 * 60 * 60 * 1000;

function gizliAnahtar(): string {
  const anahtar =
    process.env.BAGIS_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!anahtar) {
    throw new Error("Düzenleme token'ı için sunucu anahtarı tanımlı değil.");
  }
  return anahtar;
}

function imzala(bagisId: number, bitis: number): string {
  return createHmac("sha256", gizliAnahtar())
    .update(`bagis-duzenle:${bagisId}:${bitis}`)
    .digest("base64url");
}

/** `id + bitiş zamanı` üzerinden HMAC imzalı, 24 saat geçerli token üretir. */
export function duzenlemeTokeniUret(bagisId: number) {
  const bitis = Date.now() + DUZENLEME_SURESI_MS;
  return { token: `${bitis}.${imzala(bagisId, bitis)}`, bitis };
}

/** Token bu bağışa aitse, imzası doğruysa ve süresi dolmadıysa true döner. */
export function duzenlemeTokeniGecerliMi(
  bagisId: number,
  token: unknown
): boolean {
  if (typeof token !== "string") return false;

  const ayrac = token.indexOf(".");
  if (ayrac <= 0) return false;

  const bitis = Number(token.slice(0, ayrac));
  const imza = token.slice(ayrac + 1);
  if (!Number.isSafeInteger(bitis) || bitis <= Date.now()) return false;

  const beklenen = Buffer.from(imzala(bagisId, bitis));
  const gelen = Buffer.from(imza);
  return beklenen.length === gelen.length && timingSafeEqual(beklenen, gelen);
}
