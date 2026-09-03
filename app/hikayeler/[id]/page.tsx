'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEye, faCalendarAlt, faPlay } from '@fortawesome/free-solid-svg-icons';

export default function HikayeDetayPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [aktifMedyaIndex, setAktifMedyaIndex] = useState(0);

    useEffect(() => {
        if (!id) return;

        async function fetchPostAndIncrementView() {
            try {
                // 1. Gönderi verilerini çek
                const { data, error } = await supabase
                    .from('gerceklesen_dilekler')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setPost(data);

                    // 2. Görüntülenme sayısını güvenli SQL fonksiyonu ile artır
                    await supabase.rpc('goruntulenme_artir', { gonderi_id: id });
                }
            } catch (error) {
                console.error('Hikaye yüklenirken hata oluştu:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchPostAndIncrementView();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-500 font-medium">Hikaye yükleniyor...</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Hikaye Bulunamadı</h1>
                <p className="text-gray-500 mb-4">Aradığınız hikaye silinmiş veya yayından kaldırılmış olabilir.</p>
                <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition-colors">
                    Ana Sayfaya Dön
                </button>
            </div>
        );
    }

    const formatTarih = (tarihStr: string) => {
        if (!tarihStr) return '';
        const tarih = new Date(tarihStr);
        return tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const gosterilecekBaslik = post.baslik && post.baslik !== 'Başlıksız Gönderi' ? post.baslik : 'Gerçekleşen Bir Dilek';

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                
                {/* Geri Dön Butonu */}
                <button 
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-orange-500 font-medium mb-6 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Ana Sayfaya Dön</span>
                </button>

                <div className="bg-white rounded-3xl shadow-xl shadow-orange-950/5 border border-orange-50 overflow-hidden">
                    
                    {/* Üst Vurgu Çizgisi */}
                    <div className="w-full h-1.5 bg-gradient-to-r from-orange-400 to-red-500"></div>

                    <div className="p-6 md:p-10">
                        
                        {/* Meta Bilgileri (Tarih ve Görüntülenme) */}
                        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-gray-400 mb-4 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-orange-500" />
                                <span>{formatTarih(post.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full">
                                <FontAwesomeIcon icon={faEye} />
                                <span>{post.goruntulenme || 1} Görüntülenme</span>
                            </div>
                        </div>

                        {/* Başlık */}
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
                            {gosterilecekBaslik}
                        </h1>

                        {/* ANA MEDYA GÖSTERİCİSİ */}
                        {post.medya_url && post.medya_url.length > 0 && (
                            <div className="mb-8">
                                <div className="relative w-full aspect-[4/5] md:aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                                    {post.medya_url[aktifMedyaIndex].toLowerCase().match(/\.(mp4|webm|mov)$/i) ? (
                                        <video 
                                            src={post.medya_url[aktifMedyaIndex]} 
                                            className="w-full h-full object-contain" 
                                            controls 
                                            autoPlay 
                                            muted 
                                            playsInline 
                                        />
                                    ) : (
                                        <img 
                                            src={post.medya_url[aktifMedyaIndex]} 
                                            alt={gosterilecekBaslik} 
                                            className="w-full h-full object-contain object-center" 
                                        />
                                    )}
                                </div>

                                {/* Küçük Önizlemeler (Eğer birden fazla medya varsa) */}
                                {post.medya_url.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto mt-4 pb-2 [&::-webkit-scrollbar]:hidden">
                                        {post.medya_url.map((url: string, index: number) => {
                                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|mov)$/i);
                                            const aktif = index === aktifMedyaIndex;
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => setAktifMedyaIndex(index)}
                                                    className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                                                        aktif ? 'border-orange-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    {isVideo ? (
                                                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                                                            <video src={url} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                                <FontAwesomeIcon icon={faPlay} className="text-white text-xs" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <img src={url} alt="Önizleme" className="w-full h-full object-cover" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Uzun Metin / Hikaye İçeriği */}
                        <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4 text-base md:text-lg whitespace-pre-line">
                            {post.uzun_metin || post.kisa_ozet}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}