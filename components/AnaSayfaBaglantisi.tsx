"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ANA_SAYFA_OLAYI } from "@/lib/olaylar";

/**
 * Logo bağlantısı. Kullanıcı hangi görünümdeyse (`/` veya `/destek`) orada
 * kalır; tıklama bir olayla sayfaya bildirilir, sayfa da bağış akışının
 * başlangıcına döner.
 */
export default function AnaSayfaBaglantisi({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const yol = usePathname();

  return (
    <Link
      href={yol?.startsWith("/destek") ? "/destek" : "/"}
      className={className}
      onClick={() => window.dispatchEvent(new Event(ANA_SAYFA_OLAYI))}
    >
      {children}
    </Link>
  );
}
