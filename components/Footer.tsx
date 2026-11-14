import { useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import GradyenIkon, { GradyanTanimi } from "@/components/ui/GradyenIkon";
import MaviTik from "@/components/ui/MaviTik";
import { faInstagram, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faShieldHalved, faHeart } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  const benzersizId = useId().replace(/:/g, "");
  const gradyanId = `footer-gradyan-${benzersizId}`;

  return (
    <footer className="mt-6 w-full border-t border-gray-200/70 bg-white">
      <GradyanTanimi id={gradyanId} />

      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-6 text-center">
        {/* 1. Üst: Çocuklar Üşümesin + Altında İnce Yardımlaşma ve Dayanışma Derneği + Slogan */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base font-bold tracking-tight text-gray-800">
            Çocuklar Üşümesin
          </span>
          <MaviTik />
        </div>

        <span className="mt-0.5 text-[11px] font-normal text-gray-500">
          Yardımlaşma ve Dayanışma Derneği
        </span>

        <p className="mt-1.5 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-xs font-semibold text-transparent">
          Bir çocuğumuzun kışına güneş ol
        </p>

        {/* 2. Orta: Kurumsal Güven Rozetleri */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-600">
            <GradyenIkon
              icon={faShieldHalved}
              className="h-3 w-3"
              gradyanId={gradyanId}
            />
            <span>Resmi Yardım Derneği</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50 px-3 py-1 text-[11px] font-medium text-gray-600">
            <GradyenIkon
              icon={faHeart}
              className="h-3 w-3"
              gradyanId={gradyanId}
            />
            <span>%100 Şeffaf İyilik Hareketi</span>
          </span>
        </div>

        {/* 3. Sosyal Medya Linkleri */}
        <div className="mt-4 flex items-center gap-3">
          <a
            href="https://www.instagram.com/cocuklar_usumes"
            aria-label="Instagram: @cocuklar_usumes (yeni sekmede açılır)"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-pink-200 hover:bg-pink-50/50 hover:text-pink-600"
          >
            <FontAwesomeIcon icon={faInstagram} className="text-sm" />
            <span>@cocuklar_usumes</span>
          </a>

          <a
            href="https://x.com/cocuklarusmsntr"
            aria-label="X: @cocuklarusmsntr (yeni sekmede açılır)"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-200 hover:bg-gray-100 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faXTwitter} className="text-xs" />
            <span>@cocuklarusmsntr</span>
          </a>
        </div>

        {/* 4. Alt: Telif Metni */}
        <div className="mt-4 w-full border-t border-gray-100 pt-3.5">
          <p className="text-[11px] font-normal text-gray-400">
            © 2026 Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği
          </p>
        </div>
      </div>
    </footer>
  );
}
