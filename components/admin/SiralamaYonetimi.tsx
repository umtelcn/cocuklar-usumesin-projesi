"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faPlay } from '@fortawesome/free-solid-svg-icons';

export default function SiralamaYonetimi() {
    const [gonderiler, setGonderiler] = useState<any[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [kaydediliyor, setKaydediliyor] = useState(false);

    // Gönderileri ve mevcut sıralarını çek
    useEffect(() => {
        verileriGetir();
    }, []);

    const verileriGetir = async () => {
        try {
            const { data, error } = await supabase
                .from('gerceklesen_dilekler')
                .select('*')
                .order('sira', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                // Her gönderinin input alanında düzenlenebilmesi için geçici 'yeniSira' state'i ekliyoruz
                const siraliData = data.map((item, index) => ({
                    ...item,
                    yeniSira: item.sira !== undefined && item.sira !== null ? item.sira : index
                }));
                setGonderiler(siraliData);
            }
        } catch (error) {
            console.error("Gönderiler yüklenirken hata:", error);
        } finally {
            setYukleniyor(false);
        }
    };

    // Input değiştiğinde ilgili gönderinin geçici sırasını güncelle
    const siraDegistir = (id: string, deger: string) => {
        const sayi = parseInt(deger);
        setGonderiler(prev => 
            prev.map(g => g.id === id ? { ...g, yeniSira: isNaN(sayi) ? 0 : sayi } : g)
        );
    };

    // Tüm sıralamaları veritabanına kaydet
    const siralamayiKaydet = async () => {
        setKaydediliyor(true);
        try {
            for (const gonderi of gonderiler) {
                const { error } = await supabase
                    .from('gerceklesen_dilekler')
                    .update({ sira: gonderi.yeniSira })
                    .eq('id', gonderi.id);

                if (error) throw error;
            }
            alert("Harika! Gönderi sıralamaları başarıyla güncellendi.");
            verileriGetir(); // Güncel verileri tekrar yükle
        } catch (error: any) {
            alert("Sıralama kaydedilirken bir hata oluştu: " + error.message);
        } finally {
            setKaydediliyor(false);
        }
    };

    if (yukleniyor) {
        return <p className="text-gray-500 p-6 text-center">Gönderiler yükleniyor...</p>;
    }

    if (gonderiler.length === 0) {
        return <p className="text-gray-500 p-6 text-center">Henüz sıralanacak gönderi bulunmuyor.</p>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-100 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Gönderi Sıralama Yönetimi</h2>
                    <p className="text-xs text-gray-500 mt-1">Numaraları küçükten büyüğe (0, 1, 2...) girerek ana sayfadaki görünüm sırasını belirleyebilirsiniz.</p>
                </div>
                <button
                    onClick={siralamayiKaydet}
                    disabled={kaydediliyor}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                    {kaydediliyor ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                    {kaydediliyor ? 'Kaydediliyor...' : 'Sıralamayı Kaydet'}
                </button>
            </div>

            <div className="space-y-3">
                {gonderiler.map((gonderi) => {
                    const kapak = gonderi.kapak_gorseli || (gonderi.medya_url && gonderi.medya_url[0]);
                    const isVideo = kapak && kapak.toLowerCase().match(/\.(mp4|webm|mov)$/i);

                    return (
                        <div 
                            key={gonderi.id} 
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl gap-4 hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                {/* KÜÇÜK ÖNİZLEME */}
                                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-gray-300 bg-white relative">
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
                                </div>

                                {/* BAŞLIK VE ÖZET */}
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-800 text-sm truncate">{gonderi.baslik || 'Başlıksız Gönderi'}</h3>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{gonderi.kisa_ozet || 'Açıklama yok'}</p>
                                </div>
                            </div>

                            {/* SIRA NUMARASI GİRİŞ KUTUSU */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-semibold text-gray-400">Sıra:</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={gonderi.yeniSira}
                                    onChange={(e) => siraDegistir(gonderi.id, e.target.value)}
                                    className="w-20 p-2 text-center font-bold text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}