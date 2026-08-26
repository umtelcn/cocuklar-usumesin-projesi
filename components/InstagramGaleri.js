'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHeart, 
    faComment, 
    faChevronLeft, 
    faChevronRight, 
    faArrowUpRightFromSquare, 
    faXmark,
    faCameraRetro
} from '@fortawesome/free-solid-svg-icons';

export default function InstagramGaleri() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedPostUrl, setSelectedPostUrl] = useState(null);

    useEffect(() => {
        async function fetchPosts() {
            try {
                const { data, error } = await supabase
                    .from('instagram_posts')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (error) throw error;
                if (data) setPosts(data);
            } catch (error) {
                console.error('Gönderiler çekilirken hata oluştu:', error.message);
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === posts.length - 1 ? 0 : prevIndex + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? posts.length - 1 : prevIndex - 1));
    };

    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto px-4 mt-8">
                <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-6 border border-orange-50 flex flex-col items-center">
                    <div className="h-8 bg-gray-100 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="w-12 h-1 bg-gray-100 rounded-full mb-6 animate-pulse"></div>
                    <div className="w-full aspect-[4/5] bg-gray-50 rounded-[2rem] animate-pulse border border-gray-100"></div>
                </div>
            </div>
        );
    }

    // Eğer hiç post yoksa bileşen render edilmesin
    if (posts.length === 0) return null;

    return (
        <div className="w-full max-w-md mx-auto px-4 mt-8">
            
            {/* YENİ TASARIM ANA KART */}
            <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-4 md:p-6 border border-orange-50 relative overflow-hidden animate-fade-in">
                {/* Üstteki İnce Renkli Çizgi Vurgusu */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-red-500"></div>
                
                {/* İkon ve Bilgi (Opsiyonel küçük bir vurgu) */}
                <div className="flex items-center justify-center gap-2 mb-4 text-orange-500">
                    <FontAwesomeIcon icon={faCameraRetro} className="text-lg" />
                    <span className="text-sm font-bold tracking-widest uppercase"></span>
                </div>

                {/* CAROUSEL KUTUSU */}
                <div className="relative w-full">
                    <div className="relative overflow-hidden rounded-[2rem] shadow-sm bg-gray-100 border border-gray-100 aspect-[4/5] group">
                        <div 
                            className="flex transition-transform duration-500 ease-in-out h-full"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {posts.map((post) => (
                                <div key={post.id} className="w-full h-full shrink-0 relative">
                                    <button 
                                        onClick={() => setSelectedPostUrl(post.post_url)}
                                        className="block w-full h-full text-left cursor-pointer focus:outline-none"
                                    >
                                        <img 
                                            src={post.img_url} 
                                            alt="Dernek Çalışması" 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/400x500?text=Görsel+Bulunamadı" }}
                                        />
                                        
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
                                        
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 backdrop-blur-md bg-white/20 px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                                                    <FontAwesomeIcon icon={faHeart} className="text-red-400 text-lg" />
                                                    <span className="text-white font-bold tracking-wider">{post.likes}</span>
                                                </div>
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-lg hover:bg-orange-500 text-white transition-all">
                                                    <FontAwesomeIcon icon={faComment} />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Yön Okları */}
                        <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-orange-600 shadow-md hover:bg-white hover:scale-110 transition-all z-10">
                            <FontAwesomeIcon icon={faChevronLeft} className="mr-0.5" />
                        </button>
                        <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-orange-600 shadow-md hover:bg-white hover:scale-110 transition-all z-10">
                            <FontAwesomeIcon icon={faChevronRight} className="ml-0.5" />
                        </button>
                    </div>

                    {/* Noktalar (Dots) - Yeni Temaya Uygun */}
                    <div className="flex justify-center gap-2 mt-5">
                        {posts.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    index === currentIndex ? 'w-6 bg-gradient-to-r from-orange-400 to-red-500' : 'w-2 bg-orange-100 hover:bg-orange-300'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL (UYARI PENCERESİ) - Yeni Temaya Uygun */}
            {selectedPostUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border border-orange-50">
                        <button onClick={() => setSelectedPostUrl(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors">
                            <FontAwesomeIcon icon={faXmark} className="text-xl" />
                        </button>
                        
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500">
                            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xl" />
                        </div>
                        
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Instagram'a Geçiş</h3>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed font-medium">
                            Bu gönderinin detaylarını ve yorumları görmek için Instagram sayfasına yönlendirileceksiniz. Devam edilsin mi?
                        </p>
                        
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedPostUrl(null)} className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors">
                                İptal
                            </button>
                            <a href={selectedPostUrl} target="_blank" rel="noopener noreferrer" onClick={() => setSelectedPostUrl(null)} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                                <span>Devam Et</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}