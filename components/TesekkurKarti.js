import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandHoldingHeart, faDownload, faSpinner, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { faInstagram, faXTwitter } from '@fortawesome/free-brands-svg-icons';

export default function TesekkurKarti({ cardData, share, resetState }) {
    const [loadingCard, setLoadingCard] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const cardRef = useRef(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setLoadingCard(true);
        try {
            const canvas = await html2canvas(cardRef.current, { 
                scale: 3, 
                backgroundColor: null, 
                useCORS: true 
            });
            const link = document.createElement('a');
            link.download = `cocuklar-usumesin-tesekkurler.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Kart indirilirken hata:', error);
            alert('Kart indirilirken bir hata oluştu.');
        } finally {
            setLoadingCard(false);
        }
    };

    const handleShare = (platform) => {
        share(platform, handleDownload);
        setShowShareMenu(false);
    };

    return (
        <div className="w-full max-w-sm animate-fade-in">
            {/* Teşekkür Kartı */}
            <div ref={cardRef} className="bg-white rounded-2xl overflow-hidden shadow-xl mb-6">
                <div className="pt-6 px-6 pb-20 relative text-white bg-orange-500">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <img src="/logo.png" alt="Logo" className="h-12 w-12 rounded-full drop-shadow-lg p-1 bg-white" />
                            <div className="text-right">
                                <p className="text-xs opacity-80">Bağış Tutarı</p>
                                <p className="font-mono text-2xl font-bold">{(cardData.amount || 0).toLocaleString('tr-TR')} TL</p>
                            </div>
                        </div>
                        <label className="text-xs font-semibold uppercase tracking-wider opacity-80">Değerli Bağışçımız</label>
                        <div className="w-full text-2xl font-bold text-white mt-1 p-2 rounded-md truncate" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                            <span>{cardData.name || 'İsimsiz Kahraman'}</span>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 relative">
                    <div className="absolute -top-16 right-6 w-32 h-32 bg-white rounded-xl shadow-xl p-3 border-4 border-slate-50 flex items-center justify-center">
                        {cardData.itemImage ? (
                            <img src={cardData.itemImage} alt="Bağışlanan Ürün" className="w-full h-full object-contain" />
                        ) : (
                            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-6xl text-orange-500" />
                        )}
                    </div>
                    <div className="mt-12">
                        <h3 className="text-lg font-bold text-slate-800">Çocuklar Üşümesin</h3>
                        <p className="text-sm text-slate-500">Yardımlaşma ve Dayanışma Derneği</p>
                    </div>
                    <div className="border-t my-4"></div>
                    <div className="mt-4 bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm text-center text-slate-600 leading-relaxed">
                            Yaptığınız bu değerli bağışla bir çocuğumuzun hayallerine ortak oldunuz. 
                            <span className="font-semibold text-orange-500"> Çocuklar Üşümesin</span> platformu olarak size yürekten teşekkür ederiz.
                        </p>
                    </div>
                    <div className="border-t mt-6 pt-4 flex justify-between items-center">
                        <a href="https://www.instagram.com/cocuklar_usumes" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-300">
                            <FontAwesomeIcon icon={faInstagram} className="text-base" />
                            <span className="text-xs font-semibold">@cocuklar_usumes</span>
                        </a>
                        <p className="text-xs text-slate-400">{new Date().toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>
            </div>

            {/* Butonlar */}
            <div className="relative space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleDownload} disabled={loadingCard} className="w-full bg-gray-800 text-white font-medium py-3 px-4 rounded-xl hover:bg-black transition flex items-center justify-center gap-2 disabled:opacity-60">
                        <FontAwesomeIcon icon={loadingCard ? faSpinner : faDownload} spin={loadingCard} />
                        <span>{loadingCard ? 'Oluşturuluyor...' : 'İndir'}</span>
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowShareMenu(!showShareMenu)} className="w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faShareNodes} /> Paylaş
                        </button>
                        {showShareMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border overflow-hidden z-10">
                                <button onClick={() => handleShare('instagram')} className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition text-gray-700">
                                    <FontAwesomeIcon icon={faInstagram} className="text-pink-500 w-4 text-center" /> Instagram Hikaye
                                </button>
                                <button onClick={() => handleShare('twitter')} className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm transition text-gray-700 border-t">
                                    <FontAwesomeIcon icon={faXTwitter} className="text-sky-500 w-4 text-center" /> X (Twitter)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={resetState} className="w-full text-gray-600 py-3 rounded-xl text-lg font-semibold hover:bg-gray-100 border-2 border-gray-200">
                    Anasayfaya Dön
                </button>
            </div>
        </div>
    );
}