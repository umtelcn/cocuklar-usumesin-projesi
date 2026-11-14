import AnaSayfaBaglantisi from "@/components/AnaSayfaBaglantisi";
import MaviTik from "@/components/ui/MaviTik";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXTwitter, faInstagram } from "@fortawesome/free-brands-svg-icons";

export default function Header() {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/80">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        
        {/* Sol: Beyaz Gölgeli Logo, Başlık, Mavi Tik ve Altında İnce Dernek Ünvanı */}
        <AnaSayfaBaglantisi className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white shadow-md p-1 flex-shrink-0">
            <img
              src="/logo.webp"
              width={48}
              height={48}
              alt="Çocuklar Üşümesin Logosu"
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-bold text-gray-800 tracking-tight leading-snug">
                Çocuklar Üşümesin
              </h1>

              {/* Orijinal Mavi Onay Rozeti */}
              <MaviTik
                className="w-4 h-4 flex-shrink-0"
                etiket="Doğrulanmış Resmi Dernek"
              />
            </div>
            <span className="text-[11px] font-normal text-gray-500 leading-tight">
              Yardımlaşma ve Dayanışma Derneği
            </span>
          </div>
        </AnaSayfaBaglantisi>

        {/* Sağ: Sosyal Medya İkonları */}
        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/cocuklar_usumes"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-gray-500 hover:text-pink-600 transition-colors"
          >
            <FontAwesomeIcon icon={faInstagram} className="text-xl" />
          </a>

          <a
            href="https://x.com/cocuklarusmsntr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <FontAwesomeIcon icon={faXTwitter} className="text-xl" />
          </a>
        </div>

      </div>
    </header>
  );
}
