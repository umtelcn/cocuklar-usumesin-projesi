import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Yönetim Paneli - Çocuklar Üşümesin",
  robots: { index: false, follow: false },
};

export default function AdminSayfasi() {
  return <AdminPanel />;
}
