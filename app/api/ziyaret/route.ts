import { NextResponse } from "next/server";
import { supabaseAdminOlustur } from "@/lib/server/supabaseAdmin";

export async function POST() {
  const admin = supabaseAdminOlustur();
  if (!admin) return NextResponse.json({ ok: false }, { status: 500 });

  try {
    const { data } = await admin
      .from("site_istatistikleri")
      .select("toplam_ziyaret")
      .eq("id", 1)
      .single();

    const yeniSayi = Number(data?.toplam_ziyaret ?? 0) + 1;

    const { error } = await admin
      .from("site_istatistikleri")
      .update({ toplam_ziyaret: yeniSayi })
      .eq("id", 1);

    if (error) throw error;

    return NextResponse.json({ ok: true, toplam_ziyaret: yeniSayi });
  } catch (err) {
    console.error("Ziyaret sayacı hatası:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
