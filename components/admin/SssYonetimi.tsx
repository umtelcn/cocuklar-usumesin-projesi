"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';

export default function SssYonetimi() {
    const [sorular, setSorular] = useState<any[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [islemYapiliyor, setIslemYapiliyor] = useState(false);

    // Yeni soru ekleme form state'leri
    const [yeniSoru, setYeniSoru] = useState('');
    const [yeniCevap, setYeniCevap] = useState('');

    useEffect(() => {
        ssslariGetir();
    }, []);

    const ssslariGetir = async () => {
        try {
            const { data, error } = await supabase
                .from('sikca_sorulan_sorular')
                .select('*')
                .order('sira', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setSorular(data);
        } catch (error) {
            console.error("SSS yüklenirken hata:", error);
        } finally {
            setYukleniyor(false);
        }
    };

    const soruEkle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!yeniSoru.trim() || !yeniCevap.trim()) {
            alert("Lütfen hem soru hem de cevap alanını doldurun!");
            return;
        }

        setIslemYapiliyor(true);
        try {
            const { error } = await supabase
                .from('sikca_sorulan_sorular')
                .insert([{ soru: yeniSoru.trim(), cevap: yeniCevap.trim(), sira: sorular.length }]);

            if (error) throw error;

            alert("Soru başarıyla eklendi.");
            setYeniSoru('');
            setYeniCevap('');
            ssslariGetir();
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setIslemYapiliyor(false);
        }
    };

    const soruSil = async (id: string) => {
        if (!window.confirm("Bu soruyu silmek istediğinize emin misiniz?")) return;

        try {
            const { error } = await supabase
                .from('sikca_sorulan_sorular')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSorular(sorular.filter(s => s.id !== id));
        } catch (error: any) {
            alert("Silme hatası: " + error.message);
        }
    };

    const metinGuncelle = (id: string, alan: 'soru' | 'cevap', deger: string) => {
        setSorular(sorular.map(s => s.id === id ? { ...s, [alan]: deger } : s));
    };

    const degisiklikleriKaydet = async (id: string) => {
        const hedefSoru = sorular.find(s => s.id === id);
        if (!hedefSoru) return;

        setIslemYapiliyor(true);
        try {
            const { error } = await supabase
                .from('sikca_sorulan_sorular')
                .update({ soru: hedefSoru.soru, cevap: hedefSoru.cevap })
                .eq('id', id);

            if (error) throw error;
            alert("Soru güncellendi.");
        } catch (error: any) {
            alert("Güncelleme hatası: " + error.message);
        } finally {
            setIslemYapiliyor(false);
        }
    };

    if (yukleniyor) return <p className="text-gray-500 p-6 text-center">SSS yükleniyor...</p>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 max-w-3xl mx-auto space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Sıkça Sorulan Sorular (SSS) Yönetimi</h2>
                <p className="text-xs text-gray-500 mt-1">Hakkımızda sekmesinde görünen soruları buradan ekleyebilir, düzenleyebilir veya silebilirsin.</p>
            </div>

            {/* YENİ SORU EKLEME FORMU */}
            <form onSubmit={soruEkle} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-gray-700 text-sm">Yeni Soru & Cevap Ekle</h3>
                <div>
                    <input
                        type="text"
                        placeholder="Soru (Örn: Bağışlarım nasıl ulaştırılıyor?)"
                        value={yeniSoru}
                        onChange={(e) => setYeniSoru(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
                <div>
                    <textarea
                        rows={2}
                        placeholder="Cevap detayları..."
                        value={yeniCevap}
                        onChange={(e) => setYeniCevap(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                    />
                </div>
                <button
                    type="submit"
                    disabled={islemYapiliyor}
                    className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Soruyu Ekle</span>
                </button>
            </form>

            {/* MEVCUT SORULAR LİSTESİ */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 text-sm">Mevcut Sorular ({sorular.length})</h3>
                {sorular.length === 0 ? (
                    <p className="text-sm text-gray-400">Henüz hiç soru eklenmemiş.</p>
                ) : (
                    sorular.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-sm">
                            <input
                                type="text"
                                value={item.soru}
                                onChange={(e) => metinGuncelle(item.id, 'soru', e.target.value)}
                                className="w-full p-2.5 font-bold text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                            <textarea
                                rows={2}
                                value={item.cevap}
                                onChange={(e) => metinGuncelle(item.id, 'cevap', e.target.value)}
                                className="w-full p-2.5 text-gray-600 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                            />
                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => degisiklikleriKaydet(item.id)}
                                    disabled={islemYapiliyor}
                                    className="px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <FontAwesomeIcon icon={faSave} />
                                    <span>Güncelle</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => soruSil(item.id)}
                                    className="px-4 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                    <span>Sil</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}