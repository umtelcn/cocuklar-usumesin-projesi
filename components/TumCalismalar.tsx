'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlay, faHeart, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

// Tekil Gönderi Kartı (Instagram Akış Kartı)
const AkisKarti = ({ post }: { post: any }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true); // Ses kontrolü için state
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);

    // Mobil Kaydırma (Swipe) State'leri
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    const formatInstagramSayi = (sayi: number) => {
        if (!sayi || sayi === 0) return null; // 0 veya boşsa null döndür
        if (sayi >= 1_000_000) return (sayi / 1_000_000).toFixed(1).replace('.0', '') + 'M';
        if (sayi >= 1_000) return (sayi / 1_000).toFixed(sayi >= 10_000 ? 0 : 1).replace('.0', '') + 'B';
        return sayi.toString();
    };

    useEffect(() => {
        if (thumbnailContainerRef.current) {
            const container = thumbnailContainerRef.current;
            const activeThumbnail = container.children[currentIndex] as HTMLElement;
            if (activeThumbnail) {
                const scrollLeft = activeThumbnail.offsetLeft - (container.clientWidth / 2) + (activeThumbnail.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [currentIndex]);

    const nextSlide = () => {
        if (post?.medya_url) {
            setCurrentIndex((prev) => (prev === post.medya_url.length - 1 ? 0 : prev + 1));
        }
    };

    const prevSlide = () => {
        if (post?.medya_url) {
            setCurrentIndex((prev) => (prev === 0 ? post.medya_url.length - 1 : prev - 1));
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchEndX(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;
        const minSwipeDistance = 50;

        if (distance > minSwipeDistance) {
            nextSlide();
        } else if (distance < -minSwipeDistance) {
            prevSlide();
        }

        setTouchStartX(0);
        setTouchEndX(0);
    };

    if (!post || !post.medya_url || post.medya_url.length === 0) return null;

    const gosterilecekBaslik = post.baslik && post.baslik !== 'Başlıksız Gönderi' ? post.baslik : null;
    const formatliBegeni = formatInstagramSayi(post.begeni_sayisi);

    return (
        <div className="w-full max-w-md mx-auto sm:px-4 mb-8">
            <div className="bg-white sm:rounded-2xl shadow-xl shadow-orange-900/5 sm:border border-orange-50 relative overflow-hidden pb-5">
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                
                {/* BAŞLIK */}
                {gosterilecekBaslik && (
                    <div className="px-4 py-3 mt-1 flex items-center">
                        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">
                            {gosterilecekBaslik}
                        </h2>
                    </div>
                )}

                {/* ANA CAROUSEL KUTUSU */}
                <div 
                    className="relative w-full aspect-[4/5] bg-black group"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div 
                        className="flex transition-transform duration-500 ease-in-out h-full"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {post.medya_url.map((url: string, index: number) => {
                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|mov)$/i);
                            
                            return (
                                <div key={index} className="w-full h-full shrink-0 relative bg-black">
                                    {isVideo ? (
                                        <div 
                                            className="relative w-full h-full flex items-center justify-center cursor-pointer"
                                            onClick={() => setIsMuted(!isMuted)}
                                        >
                                            <video 
                                                src={url} 
                                                className="w-full h-full object-cover object-center" 
                                                autoPlay 
                                                muted={isMuted} 
                                                loop 
                                                playsInline 
                                            />
                                            {/* Sağ alt köşede interaktif ses açma/kapama ikonu */}
                                            <div className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white shadow-lg transition-transform hover:scale-110">
                                                <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} className="text-sm" />
                                            </div>
                                        </div>
                                    ) : (
                                        <img 
                                            src={url} 
                                            alt={`Görsel ${index + 1}`} 
                                            className="w-full h-full object-cover object-center pointer-events-none"
                                            onError={(e: any) => { e.target.src = "https://via.placeholder.com/400x500?text=Görsel+Bulunamadı" }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* SAĞ - SOL KAYDIRMA BUTONLARI */}
                    {post.medya_url.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-gray-800 shadow-sm hover:scale-110 transition-all z-10 opacity-0 group-hover:opacity-100 sm:opacity-100">
                                <FontAwesomeIcon icon={faChevronLeft} className="mr-0.5 text-sm" />
                            </button>
                            <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-gray-800 shadow-sm hover:scale-110 transition-all z-10 opacity-0 group-hover:opacity-100 sm:opacity-100">
                                <FontAwesomeIcon icon={faChevronRight} className="ml-0.5 text-sm" />
                            </button>
                        </>
                    )}
                </div>

                {/* KÜÇÜK ÖNİZLEME (THUMBNAIL) ŞERİDİ */}
                {post.medya_url.length > 1 && (
                    <div 
                        ref={thumbnailContainerRef}
                        className="flex gap-2 overflow-x-auto px-4 mt-3 pt-1 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x"
                    >
                        {post.medya_url.map((url: string, index: number) => {
                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|mov)$/i);
                            const isActive = index === currentIndex;
                            
                            return (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-300 snap-center focus:outline-none ${
                                        isActive 
                                        ? 'border-orange-500 opacity-100 shadow-md scale-105' 
                                        : 'border-transparent opacity-60 hover:opacity-100 scale-100'
                                    }`}
                                >
                                    {isVideo ? (
                                        <>
                                            <video src={url} className="w-full h-full object-cover pointer-events-none" />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                                <FontAwesomeIcon icon={faPlay} className="text-white text-xs" />
                                            </div>
                                        </>
                                    ) : (
                                        <img src={url} alt={`Küçük Görsel ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* BEĞENİ SAYACI (Eğer 0 ise hiç görünmez) */}
                {formatliBegeni && (
                    <div className="px-4 mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faHeart} className="text-red-500 text-lg" />
                            <span className="text-sm font-bold text-gray-800">
                                {formatliBegeni} beğeni
                            </span>
                        </div>
                    </div>
                )}

                {/* AÇIKLAMA / KISA ÖZET */}
                {post.kisa_ozet && (
                    <div className="px-4 mt-2 text-[14px] text-gray-800 leading-relaxed">
                        {gosterilecekBaslik && <span className="font-bold mr-2">{gosterilecekBaslik}</span>}
                        <span>{post.kisa_ozet}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ANA AKIŞ BİLEŞENİ ---
export default function TumCalismalar() {
    const [gonderiler, setGonderiler] = useState<any[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);

    useEffect(() => {
        async function tumGonderileriGetir() {
            try {
                const { data, error } = await supabase
                    .from('gerceklesen_dilekler')
                    .select('*')
                    .order('sira', { ascending: true })
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setGonderiler(data);
            } catch (error) {
                console.error('Gönderiler yüklenirken hata oluştu:', error);
            } finally {
                setYukleniyor(false);
            }
        }
        tumGonderileriGetir();
    }, []);

    if (yukleniyor) {
        return (
            <div className="w-full max-w-md mx-auto px-4 py-10 text-center">
                <p className="text-gray-500 font-medium">Çalışmalarımız yükleniyor...</p>
            </div>
        );
    }

    if (gonderiler.length === 0) {
        return (
            <div className="w-full max-w-md mx-auto px-4 py-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 font-medium">Henüz yayınlanmış bir çalışmamız bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="w-full py-2 space-y-6">
            {gonderiler.map((post) => (
                <AkisKarti key={post.id} post={post} />
            ))}
        </div>
    );
}