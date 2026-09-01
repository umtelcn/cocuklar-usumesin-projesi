'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlay } from '@fortawesome/free-solid-svg-icons';

export default function InstagramGaleri() {
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const thumbnailContainerRef = useRef<HTMLDivElement>(null);

    // --- MOBİL KAYDIRMA (SWIPE) İÇİN STATE'LER ---
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchEndX, setTouchEndX] = useState(0);

    useEffect(() => {
        async function fetchLatestPost() {
            try {
                const { data, error } = await supabase
                    .from('gerceklesen_dilekler')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;
                if (data) setPost(data);
            } catch (error) {
                console.error('Son gönderi çekilirken hata oluştu:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLatestPost();
    }, []);

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

    // --- MOBİL KAYDIRMA HESAPLAMA FONKSİYONLARI ---
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchEndX(0); // Yeni dokunuşta eski bitişi sıfırla
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;

        const distance = touchStartX - touchEndX;
        const minSwipeDistance = 50; // Kaydırmanın algılanması için gereken minimum piksel

        if (distance > minSwipeDistance) {
            nextSlide(); // Parmağı sola çekti (Sonraki resim)
        } else if (distance < -minSwipeDistance) {
            prevSlide(); // Parmağı sağa çekti (Önceki resim)
        }

        // Değerleri sıfırla
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

    if (!post || !post.medya_url || post.medya_url.length === 0) return null;

    const gosterilecekBaslik = post.baslik && post.baslik !== 'Başlıksız Gönderi' ? post.baslik : null;

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

                {/* ANA CAROUSEL KUTUSU (Mobil Dokunma Etkinlikleri Eklendi) */}
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
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <video 
                                                src={url} 
                                                className="w-full h-full object-cover object-center pointer-events-none" 
                                                autoPlay 
                                                muted 
                                                loop 
                                                playsInline 
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                                                    <FontAwesomeIcon icon={faPlay} className="text-white ml-1 shadow-sm" />
                                                </div>
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

                {post.kisa_ozet && (
                    <div className="px-4 mt-2 text-[14px] text-gray-800 leading-relaxed">
                        {gosterilecekBaslik && <span className="font-bold mr-2">{gosterilecekBaslik}</span>}
                        <span>{post.kisa_ozet}</span>
                    </div>
                )}
            </div>
        </div>
    );
}