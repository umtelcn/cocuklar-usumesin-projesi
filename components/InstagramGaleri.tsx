'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlay, faHeart, faVolumeMute, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

export default function InstagramGaleri() {
    const [gonderiler, setGonderiler] = useState<any[]>([]);
    const [seciliPostIndex, setSeciliPostIndex] = useState<number>(0);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    const thumbnailContainerRef = useRef<HTMLDivElement>(null);

    // Mobil Kaydırma (Swipe) State'leri
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    const formatInstagramSayi = (sayi: number) => {
        if (!sayi || sayi === 0) return null;
        if (sayi >= 1_000_000) return (sayi / 1_000_000).toFixed(1).replace('.0', '') + 'M';
        if (sayi >= 1_000) return (sayi / 1_000).toFixed(sayi >= 10_000 ? 0 : 1).replace('.0', '') + 'B';
        return sayi.toString();
    };

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
                setLoading(false);
            }
        }
        tumGonderileriGetir();
    }, []);

    useEffect(() => {
        setCurrentIndex(0);
    }, [seciliPostIndex]);

    const aktifPost = gonderiler[seciliPostIndex];

    const nextSlide = () => {
        if (aktifPost?.medya_url) {
            setCurrentIndex((prev) => (prev === aktifPost.medya_url.length - 1 ? 0 : prev + 1));
        }
    };

    const prevSlide = () => {
        if (aktifPost?.medya_url) {
            setCurrentIndex((prev) => (prev === 0 ? aktifPost.medya_url.length - 1 : prev - 1));
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

    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto sm:px-4 mt-4 sm:mt-8">
                <div className="bg-white sm:rounded-2xl shadow-xl shadow-orange-900/5 pb-4">
                    <div className="h-6 bg-gray-100 rounded w-1/2 mb-4 mx-4 mt-4 animate-pulse"></div>
                    <div className="w-full aspect-[4/5] bg-gray-50 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded mx-4 mt-4 animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (!gonderiler || gonderiler.length === 0 || !aktifPost) return null;

    const gosterilecekBaslik = aktifPost.baslik && aktifPost.baslik !== 'Başlıksız Gönderi' ? aktifPost.baslik : null;
    const formatliBegeni = formatInstagramSayi(aktifPost.begeni_sayisi);

    return (
        <div className="w-full max-w-md mx-auto sm:px-4 mt-4 sm:mt-8">
            <div className="bg-white sm:rounded-2xl shadow-xl shadow-orange-900/5 sm:border border-orange-50 relative overflow-hidden pb-5">
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                
                {gosterilecekBaslik && (
                    <div className="px-4 py-3 mt-1 flex items-center">
                        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">
                            {gosterilecekBaslik}
                        </h2>
                    </div>
                )}

                {/* ANA CAROUSEL KUTUSU (Büyük Galeri) */}
                <div 
                    className="relative w-full aspect-[4/5] bg-black"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div 
                        className="flex transition-transform duration-500 ease-in-out h-full"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {aktifPost.medya_url.map((url: string, index: number) => {
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
                                            <div className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white shadow-lg transition-transform hover:scale-110 z-10">
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

                    {/* GÖNDERİ İÇİNDEKİ BEĞENİ SAYACI (Sol Alt Köşe - Medyanın Üzerinde) */}
                    {formatliBegeni && (
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-lg z-10 pointer-events-none">
                            <FontAwesomeIcon icon={faHeart} className="text-red-500 text-sm" />
                            <span className="text-xs font-bold text-white tracking-wide">
                                {formatliBegeni} beğeni
                            </span>
                        </div>
                    )}

                    {/* SAĞ-SOL OKLARI */}
                    {aktifPost.medya_url.length > 1 && (
                        <>
                            <button 
                                onClick={prevSlide} 
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-md hover:bg-white hover:scale-110 transition-all z-20 focus:outline-none"
                                aria-label="Önceki Medya"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                            </button>
                            <button 
                                onClick={nextSlide} 
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-gray-800 shadow-md hover:bg-white hover:scale-110 transition-all z-20 focus:outline-none"
                                aria-label="Sonraki Medya"
                            >
                                <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                            </button>
                        </>
                    )}
                </div>

                {/* ALT KISIMDA TÜM GÖNDERİLERİN KAPAK ÖNİZLEMELERİ */}
                {gonderiler.length > 1 && (
                    <div className="px-4 mt-3">
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Çalışmalarımız</p>
                        <div 
                            ref={thumbnailContainerRef}
                            className="flex gap-2.5 overflow-x-auto pt-1 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x"
                        >
                            {gonderiler.map((p, pIndex) => {
                                const isSelected = pIndex === seciliPostIndex;
                                const kapak = p.kapak_gorseli || (p.medya_url && p.medya_url[0]);
                                const isVideo = kapak && kapak.toLowerCase().match(/\.(mp4|webm|mov)$/i);

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setSeciliPostIndex(pIndex)}
                                        className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-center focus:outline-none shadow-sm ${
                                            isSelected 
                                            ? 'border-orange-500 opacity-100 scale-105 shadow-md ring-2 ring-orange-500/20' 
                                            : 'border-gray-200 opacity-60 hover:opacity-100 scale-100'
                                        }`}
                                    >
                                        {isVideo ? (
                                            <>
                                                <video src={kapak} className="w-full h-full object-cover pointer-events-none" />
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                                    <FontAwesomeIcon icon={faPlay} className="text-white text-xs" />
                                                </div>
                                            </>
                                        ) : (
                                            <img src={kapak} alt="Önizleme" className="w-full h-full object-cover pointer-events-none" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* AÇIKLAMA / KISA ÖZET */}
                {aktifPost.kisa_ozet && (
                    <div className="px-4 mt-3 text-[14px] text-gray-800 leading-relaxed">
                        {gosterilecekBaslik && <span className="font-bold mr-2">{gosterilecekBaslik}</span>}
                        <span>{aktifPost.kisa_ozet}</span>
                    </div>
                )}
            </div>
        </div>
    );
}