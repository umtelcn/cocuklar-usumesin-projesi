import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';

export default function Header() {
  return (
    <header className="w-full bg-white/80 backdrop-blur-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-sm mx-auto flex items-center justify-between gap-4 p-3">
            <Link href="/" className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white shadow-md p-1 flex-shrink-0">
                    <img src="/logo.png" alt="Çocuklar Üşümesin Logosu" className="w-full h-full rounded-full object-cover" />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Çocuklar Üşümesin</h1>
            </Link>
            <div className="flex items-center space-x-5">
                <a href="https://www.instagram.com/cocuklar_usumes" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Instagram_logo_2022.svg/1200px-Instagram_logo_2022.svg.png" alt="Instagram Logosu" className="w-6 h-6 hover:opacity-80 transition-opacity duration-300" />
                </a>
                <a href="https://x.com/cocuklarusmsntr" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                    <FontAwesomeIcon icon={faXTwitter} className="text-xl text-gray-500 hover:text-gray-800 transition-colors duration-300" />
                </a>
            </div>
        </div>
    </header>
  );
}