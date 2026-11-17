"use client";

import { useEffect } from "react";

const ZIYARET_ANAHTARI = "site_ziyaret_edildi";

export default function ZiyaretSayaci() {
  useEffect(() => {
    try {
      if (window.location.pathname.startsWith("/admin")) return;
      if (sessionStorage.getItem(ZIYARET_ANAHTARI)) return;

      sessionStorage.setItem(ZIYARET_ANAHTARI, "true");
      fetch("/api/ziyaret", { method: "POST" }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  return null;
}
