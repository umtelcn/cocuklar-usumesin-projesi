"use client";

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GonderilerPage() {
  const [gonderiler, setGonderiler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // --- DÜZENLEME MODALI İÇİN STATE'LER ---
  const [duzenlenenGonderi, setDuzenlenenGonderi] = useState<any>(null);
  const [baslik, setBaslik] = useState('');
  const [kisaOzet, setKisaOzet] = useState('');
  const [uzunMetin, setUzunMetin] = useState('');
  
  const [mevcutMedyalar, setMevcutMedyalar] = useState<string[]>([]); // Veritabanındaki eski resimler
  const [silinecekMedyalar, setSilinecekMedyalar] = useState<string[]>([]); // Düzenlerken silinmesi istenenler
  const [yeniDosyalar, setYeniDosyalar] = useState<File[]>([]); // PC/Mobilden yeni eklenenler
  
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  // Sayfa açıldığında gönderileri veritabanından çek
  const gonderileriGetir = async () => {
    const { data, error } = await supabase
      .from('gerceklesen_dilekler')
      .select('*')
      .order('created_at', { ascending: false }); 
    
    if (!error && data) {
      setGonderiler(data);
    }
    setYukleniyor(false);
  };

  useEffect(() => {
    gonderileriGetir();
  }, []);

  // --- SİLME İŞLEMİ (Ana Listeden) ---
  const gonderiSil = async (id: string, medyaUrlleri: string[]) => {
    const onay = window.confirm("Bu gönderiyi ve içindeki tüm medyaları kalıcı olarak silmek istediğinize emin misiniz?");
    if (!onay) return;

    try {
      const silinecekDosyaYollari = medyaUrlleri.map(url => url.split('/hikayeler/')[1]).filter(Boolean);
      if (silinecekDosyaYollari.length > 0) {
        await supabase.storage.from('hikayeler').remove(silinecekDosyaYollari);
      }
      const { error } = await supabase.from('gerceklesen_dilekler').delete().eq('id', id);
      if (error) throw error;

      setGonderiler(gonderiler.filter(g => g.id !== id));
      alert("Gönderi başarıyla silindi!");
    } catch (error: any) {
      alert("Silme hatası: " + error.message);
    }
  };

  // --- DÜZENLEME MODALINI AÇMA ---
  const duzenlemeyiBaslat = (gonderi: any) => {
    setDuzenlenenGonderi(gonderi);
    setBaslik(gonderi.baslik || '');
    setKisaOzet(gonderi.kisa_ozet || '');
    setUzunMetin(gonderi.uzun_metin || '');
    setMevcutMedyalar([...(gonderi.medya_url || [])]);
    setSilinecekMedyalar([]);
    setYeniDosyalar([]);
  };

  // --- DÜZENLEME MODALINI KAPATMA ---
  const duzenlemeyiIptalEt = () => {
    setDuzenlenenGonderi(null);
  };

  // --- MEDYA YÖNETİMİ (Düzenleme İçinde) ---
  const mevcutMedyayiKaldir = (url: string) => {
    setMevcutMedyalar(mevcutMedyalar.filter(m => m !== url));
    setSilinecekMedyalar([...silinecekMedyalar, url]);
  };

  const yeniDosyaSecildi = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setYeniDosyalar([...yeniDosyalar, ...Array.from(e.target.files)]);
    }
    if (dosyaInputRef.current) dosyaInputRef.current.value = '';
  };

  const yeniDosyayiKaldir = (index: number) => {
    setYeniDosyalar(yeniDosyalar.filter((_, i) => i !== index));
  };

  // --- DÜZENLEMEYİ KAYDETME ---
  const gonderiyiGuncelle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIslemYapiliyor(true);

    if (mevcutMedyalar.length === 0 && yeniDosyalar.length === 0) {
      alert("Gönderinin en az bir görseli veya videosu olmalıdır!");
      setIslemYapiliyor(false);
      return;
    }

    try {
      // 1. Yeni eklenen dosyaları Storage'a yükle
      let eklenenUrller: string[] = [];
      for (const dosya of yeniDosyalar) {
        const uzanti = dosya.name.split('.').pop();
        const isim = `${Date.now()}-${Math.random().toString(36).substring(2)}.${uzanti}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage.from('hikayeler').upload(`public/${isim}`, dosya);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('hikayeler').getPublicUrl(uploadData.path);
        eklenenUrller.push(publicUrl);
      }

      // 2. Silinmek istenen eski dosyaları Storage'dan sil
      if (silinecekMedyalar.length > 0) {
        const silinecekYollar = silinecekMedyalar.map(url => url.split('/hikayeler/')[1]).filter(Boolean);
        await supabase.storage.from('hikayeler').remove(silinecekYollar);
      }

      // 3. Nihai Medya Listesini ve Kapağı Belirle
      const finalMedyalar = [...mevcutMedyalar, ...eklenenUrller];
      const yeniKapak = finalMedyalar[0];

      // 4. Veritabanını Güncelle
      const { data, error } = await supabase
        .from('gerceklesen_dilekler')
        .update({
          baslik: baslik || 'Başlıksız Gönderi',
          kisa_ozet: kisaOzet,
          uzun_metin: uzunMetin,
          medya_url: finalMedyalar,
          kapak_gorseli: yeniKapak
        })
        .eq('id', duzenlenenGonderi.id)
        .select()
        .single();

      if (error) throw error;

      // 5. Ekrandaki listeyi güncelle
      setGonderiler(gonderiler.map(g => g.id === duzenlenenGonderi.id ? data : g));
      
      alert("Gönderi başarıyla güncellendi!");
      duzenlemeyiIptalEt(); // Modalı kapat

    } catch (error: any) {
      alert("Güncelleme hatası: " + error.message);
    } finally {
      setIslemYapiliyor(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 max-w-4xl mx-auto relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yüklenen Gönderiler</h1>

      {yukleniyor ? (
        <p className="text-gray-500">Gönderiler yükleniyor...</p>
      ) : gonderiler.length === 0 ? (
        <p className="text-gray-500">Henüz hiç gönderi eklenmemiş.</p>
      ) : (
        <div className="space-y-4">
          {gonderiler.map((gonderi) => (
            <div key={gonderi.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              
              {/* Kapak Görseli */}
              <div className="w-full sm:w-24 h-40 sm:h-24 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                {gonderi.kapak_gorseli && gonderi.kapak_gorseli.includes('.mp4') ? (
                   <video src={gonderi.kapak_gorseli} className="w-full h-full object-cover" />
                ) : (
                   <img src={gonderi.kapak_gorseli} alt="Kapak" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Bilgiler ve Görüntülenme İstatistiği */}
              <div className="flex-1 w-full">
                <h3 className="font-bold text-gray-800">{gonderi.baslik || 'Başlıksız Gönderi'}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 my-1">{gonderi.kisa_ozet}</p>
                
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                    🖼️ {gonderi.medya_url?.length || 0} Medya
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-md" title="Detay sayfasının okunma sayısı">
                    👁️ {gonderi.goruntulenme || 0} Görüntülenme
                  </span>
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button 
                  onClick={() => duzenlemeyiBaslat(gonderi)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white font-medium rounded-lg transition-colors text-sm"
                >
                  ✏️ Düzenle
                </button>
                <button 
                  onClick={() => gonderiSil(gonderi.id, gonderi.medya_url)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-medium rounded-lg transition-colors text-sm"
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- DÜZENLEME MODALI (POP-UP) --- */}
      {duzenlenenGonderi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Gönderiyi Düzenle</h2>
              <button onClick={duzenlemeyiIptalEt} className="text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>

            <form onSubmit={gonderiyiGuncelle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input type="text" value={baslik} onChange={(e) => setBaslik(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Özet (Sosyal Medya/Kartlar)</label>
                <textarea rows={2} value={kisaOzet} onChange={(e) => setKisaOzet(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uzun Hikaye</label>
                <textarea rows={6} value={uzunMetin} onChange={(e) => setUzunMetin(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* Medya Düzenleme Alanı */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">Medya Yönetimi</label>
                
                {/* Mevcut Medyalar */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {mevcutMedyalar.map((url, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 group">
                      {url.includes('.mp4') ? <video src={url} className="w-full h-full object-cover" /> : <img src={url} className="w-full h-full object-cover" />}
                      <button type="button" onClick={() => mevcutMedyayiKaldir(url)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl">
                        &times;
                      </button>
                      {index === 0 && <span className="absolute bottom-0 left-0 right-0 bg-green-500/80 text-white text-[9px] font-bold text-center py-0.5">KAPAK</span>}
                    </div>
                  ))}
                  
                  {/* Yeni Eklenen (Henüz Kaydedilmemiş) Medyalar */}
                  {yeniDosyalar.map((dosya, index) => (
                    <div key={`yeni-${index}`} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 group">
                      <img src={URL.createObjectURL(dosya)} className="w-full h-full object-cover opacity-70" />
                      <button type="button" onClick={() => yeniDosyayiKaldir(index)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl">
                        &times;
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-[9px] font-bold text-center py-0.5">YENİ</span>
                    </div>
                  ))}
                </div>

                {/* Medya Ekleme Butonu */}
                <input type="file" multiple accept="image/*,video/*" onChange={yeniDosyaSecildi} ref={dosyaInputRef} className="hidden" />
                <button type="button" onClick={() => dosyaInputRef.current?.click()} className="w-full py-2 border-2 border-dashed border-gray-400 text-gray-600 font-medium rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  + Yeni Görsel / Video Ekle
                </button>
              </div>

              {/* Modal Aksiyon Butonları */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={duzenlemeyiIptalEt} disabled={islemYapiliyor} className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50">
                  İptal Et
                </button>
                <button type="submit" disabled={islemYapiliyor} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md">
                  {islemYapiliyor ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}