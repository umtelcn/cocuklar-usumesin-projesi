'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faHandHoldingHeart, faComment, faLiraSign } from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';

export default function BagisListesi() {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDonations();
        
        // Gerçek zamanlı güncellemeler için Supabase aboneliği
        const subscription = supabase
            .channel('public:bagislar')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bagislar' }, payload => {
                setDonations(current => [payload.new, ...current].slice(0, 15)); // Limit 15 olarak güncellendi
            })
            .subscribe();

        return () => supabase.removeChannel(subscription);
    }, []);

    async function fetchDonations() {
        try {
            const { data, error } = await supabase
                .from('bagislar')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(15); // Limit 15 olarak güncellendi
            
            if (error) throw error;
            if (data) setDonations(data);
        } catch (error) {
            console.error('Bağışlar çekilemedi:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md mx-auto mt-12 mb-16 px-4">
            {/* Başlık Alanı */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-full shadow-lg">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-3xl text-white" />
                </div>
                <h3 className="mt-4 text-2xl font-extrabold text-gray-800">İyilik Hareketimiz</h3>
                <p className="mt-1 text-sm text-gray-500">Desteğinizle hayalleri gerçeğe dönüştürüyoruz.</p>
            </div>

            {/* Bağış Listesi */}
            <div className="mt-8">
                {loading && <div className="text-center text-gray-400 py-4 animate-pulse">İyilikler yükleniyor...</div>}
                {!loading && donations.length === 0 && <p className="text-center text-gray-500 py-4">Henüz görüntülenecek bağış yok.</p>}
                
                <div className="flex flex-col gap-4">
                    {!loading && donations.map(donation => (
                        <div key={donation.id} className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-4 border border-gray-50 hover:shadow-xl transition-shadow duration-300">
                            
                            {/* Bağışçı Bilgisi */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faHandHoldingHeart} className="text-orange-500 text-lg" />
                                    </div>
                                    <div className="flex flex-col">
                                        {donation.is_anonymous ? (
                                            <p className="font-bold text-gray-800">Anonim Bağışçı</p>
                                        ) : (
                                            donation.instagram_kullanici_adi ? (
                                                <a href={`https://instagram.com/${donation.instagram_kullanici_adi.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                                                    <span className="font-bold">{donation.ad_soyad}</span>
                                                    <FontAwesomeIcon icon={faInstagram} className="text-sm" />
                                                </a>
                                            ) : (
                                                <p className="font-bold text-gray-800">{donation.ad_soyad || 'Anonim Bağışçı'}</p>
                                            )
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-extrabold text-green-600">{(donation.toplam_tutar || donation.nakdi_tutar).toLocaleString('tr-TR')} TL</span>
                                </div>
                            </div>

                            {/* Mesaj */}
                            {donation.mesaj && (
                                <div className="bg-orange-50 p-3.5 rounded-xl flex items-start gap-3 border border-orange-100/50">
                                    <FontAwesomeIcon icon={faComment} className="text-orange-400 text-lg mt-0.5 flex-shrink-0" />
                                    <p className="text-gray-700 text-sm italic font-medium leading-relaxed">{`"${donation.mesaj}"`}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}