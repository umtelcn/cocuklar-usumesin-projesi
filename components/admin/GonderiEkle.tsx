"use client";

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Reorder } from 'framer-motion';

export default function GonderiEkle() {
  const [baslik, setBaslik] = useState('');
  const [kisaOzet, setKisaOzet] = useState('');
  const [uzunMetin, setUzunMetin] = useState('');
  const [begeniSayisi, setBegeniSayisi] = useState('0'); 
  
  const [yeniDosyalar, setYeniDosyalar] = useState<{ id: string, file: File }[]>([]);
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  // İnstagram formatına çeviren yardımcı (Admin için önizleme)
  const formatInstagramOnizleme = (deger: string) => {
    const sayi = parseInt(deger) || 0;
    if (sayi === 0) return '0';
    if (sayi >= 1_000_000) return (sayi / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (sayi >= 1_000) return (sayi / 1_000).toFixed(sayi >= 10_000 ? 0 : 1).replace('.0', '') + 'B';
    return sayi.toString();
  };

  const begeniDegisti = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hamDeger = e.target.value.replace(/\D/g, ''); 
    setBegeniSayisi(hamDeger);
  };

  const yeniDosyaSecildi = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const dosyalar = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        file: file
      }));
      setYeniDosyalar([...yeniDosyalar, ...dosyalar]);
    }
    if (dosyaInputRef.current) dosyaInputRef.current.value = '';
  };

  const yeniDosyayiKaldir = (idToRemove: string) => {
    setYeniDosyalar(yeniDosyalar.filter(item => item.id !== idToRemove));
  };

  const gonderiyiKaydet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIslemYapiliyor(true);

    if (yeniDosyalar.length === 0) {
      alert("Lütfen gönderi için en az bir görsel veya video ekleyin!");
      setIslemYapiliyor(false);
      return;
    }

    try {
      let eklenenUrller: string[] = [];
      
      for (const item of yeniDosyalar) {
        const uzanti = item.file.name.split('.').pop();
        const isim = `${Date.now()}-${Math.random().toString(36).substring(2)}.${uzanti}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hikayeler')
          .upload(`public/${isim}`, item.file);
          
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('hikayeler').getPublicUrl(uploadData.path);
        eklenenUrller.push(publicUrl);
      }

      const kapakGorseli = eklenenUrller[0];

      const { error } = await supabase
        .from('gerceklesen_dilekler')
        .insert([{
          baslik: baslik.trim() || 'Başlıksız Gönderi',
          kisa_ozet: kisaOzet.trim() || '',
          uzun_metin: uzunMetin.trim() || '',
          medya_url: eklenenUrller,
          kapak_gorseli: kapakGorseli,
          begeni_sayisi: parseInt(begeniSayisi) || 0,
          sira: 0 
        }]);

      if (error) throw error;

      alert("Harika! Yeni gönderi başarıyla eklendi.");
      
      setBaslik('');
      setKisaOzet('');
      setUzunMetin('');
      setBegeniSayisi('0');
      setYeniDosyalar([]);

    } catch (error: any) {
      alert("Gönderi eklenirken bir hata oluştu: " + error.message);
    } finally {
      setIslemYapiliyor(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Yeni Hikaye Ekle</h2>
          <p className="text-sm text-gray-500 mt-1">Buradan eklediğiniz hikaye otomatik olarak listenin en başına yerleşir.</p>
        </div>
      </div>

      <form onSubmit={gonderiyiKaydet} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Başlık (İsteğe Bağlı)</label>
          <input type="text" value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Boş bırakılırsa 'Başlıksız Gönderi' yazılır" className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Başlangıç Beğeni Sayısı (İsteğe Bağlı)</label>
            <input 
              type="text" 
              value={begeniSayisi} 
              onChange={begeniDegisti} 
              placeholder="Örn: 698000"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Sitede görünecek format: <span className="font-bold text-gray-600">{formatInstagramOnizleme(begeniSayisi)} beğeni</span>
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Kısa Özet (İsteğe Bağlı)</label>
          <textarea rows={2} value={kisaOzet} onChange={(e) => setKisaOzet(e.target.value)} placeholder="Ana sayfadaki kartta görünecek kısa açıklama..." className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Uzun Hikaye (İsteğe Bağlı)</label>
          <textarea rows={6} value={uzunMetin} onChange={(e) => setUzunMetin(e.target.value)} placeholder="Detay sayfasındaki tam hikaye metni..." className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>

        <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
          <label className="block text-sm font-bold text-gray-700 mb-1">Medya Yönetimi (Zorunlu)</label>
          <p className="text-xs text-gray-500 mb-4">Görselleri herhangi bir sınırlama olmaksızın serbestçe tutup sürükleyebilir ve yerini değiştirebilirsiniz. İlk sıradaki KAPAK olur.</p>
          
          <Reorder.Group 
            values={yeniDosyalar} 
            onReorder={setYeniDosyalar} 
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4"
          >
            {yeniDosyalar.map((item, index) => (
              <Reorder.Item 
                key={item.id} 
                value={item}
                className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-blue-400 shadow-md cursor-grab active:cursor-grabbing bg-gray-100 touch-none select-none"
              >
                {item.file.type.includes('video') ? (
                  <video src={URL.createObjectURL(item.file)} className="w-full h-full object-cover pointer-events-none" draggable="false" />
                ) : (
                  <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover pointer-events-none" draggable="false" />
                )}
                
                <button 
                  type="button" 
                  onPointerDown={(e) => e.stopPropagation()} 
                  onClick={() => yeniDosyayiKaldir(item.id)} 
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-20 text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>

                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-[10px] font-bold text-center py-1 z-10 pointer-events-none">
                    KAPAK
                  </span>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <input type="file" multiple accept="image/*,video/*" onChange={yeniDosyaSecildi} ref={dosyaInputRef} className="hidden" />
          <button type="button" onClick={() => dosyaInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-gray-400 text-gray-600 font-bold rounded-xl hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            + Görsel veya Video Seç (Çoklu Seçim)
          </button>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={islemYapiliyor} className="w-full py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all">
            {islemYapiliyor ? 'Gönderi Yükleniyor, Lütfen Bekleyin...' : 'Gönderiyi Yayınla'}
          </button>
        </div>
      </form>
    </div>
  );
}