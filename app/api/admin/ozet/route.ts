import { NextResponse } from "next/server";
import { yoneticiDogrula } from "@/lib/server/adminYetki";

/** Üst özet barı: ziyaretçi sayısı ve bekleyen talep/iade sayıları. */
export async function GET(req: Request) {
  const yetki = await yoneticiDogrula(req);
  if (yetki instanceof NextResponse) return yetki;
  const { admin, email } = yetki;

  const [istatistik, talepler, iadeler] = await Promise.all([
    admin.from("site_istatistikleri").select("toplam_ziyaret").limit(1).maybeSingle(),
    admin
      .from("yardim_talepleri")
      .select("id", { count: "exact", head: true })
      .or("durum.is.null,durum.not.in.(incelendi,tamamlandi)"),
    admin
      .from("iade_talepleri")
      .select("id", { count: "exact", head: true })
      .or("durum.is.null,durum.not.in.(tamamlandi,reddedildi,Reddedildi)"),
  ]);

  if (istatistik.error) console.error("İstatistik okunamadı:", istatistik.error);
  if (talepler.error) console.error("Talep sayısı okunamadı:", talepler.error);
  if (iadeler.error) console.error("İade sayısı okunamadı:", iadeler.error);

  return NextResponse.json({
    email,
    toplam_ziyaret: istatistik.data?.toplam_ziyaret ?? 0,
    bekleyen_talep: talepler.count ?? 0,
    bekleyen_iade: iadeler.count ?? 0,
  });
}
