"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Reorder, useDragControls } from 'framer-motion';

// --- SÜRÜKLENEBİLİR LİSTE ELEMANI BİLEŞENİ ---
const SuruklenebilirKart = ({ gonderi, duzenlemeyiBaslat, gonderiSil }: any) => {
  const controls = useDragControls();

  const formatInstagramSayi = (sayi: number) => {
    if (!sayi || sayi === 0) return '0';
    if (sayi >= 1_000_000) return (sayi / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (sayi >= 1_000) return (sayi / 1_000).toFixed(sayi >= 10_000 ? 0 : 1).replace('.0', '') + 'B';
    return sayi.toString();
  };

  return (
    <Reorder.Item 
      value={gonderi} 
      dragListener={false} 
      dragControls={controls}
      className="p-4 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all hover:shadow-md"
    >
      <div 
        onPointerDown={(e) => controls.start(e)} 
        className="w-full sm:w-10 flex justify-center py-2 sm:py-6 cursor-grab active:cursor-grabbing bg-gray-50 hover:bg-gray-100 rounded-lg touch-none"
        title="Sürüklemek için basılı tutun"
      >
        <span className="text-gray-400 text-xl">☰</span>
      </div>

      <div className="w-full sm:w-28 h-48 sm:h-24 shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative pointer-events-none">
        {gonderi.kapak_gorseli && gonderi.kapak_gorseli.includes('.mp4') ? (
          <video src={gonderi.kapak_gorseli} className="w-full h-full object-cover" />
        ) : (
          <img src={gonderi.kapak_gorseli} alt="Kapak" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 w-full">
        <h3 className="font-bold text-gray-800 text-lg sm:text-base">{gonderi.baslik || 'Başlıksız Gönderi'}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 my-1">{gonderi.kisa_ozet}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-md">🖼️ {gonderi.medya_url?.length || 0} Medya</span>
          <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-md">👁️ {gonderi.goruntulenme || 0} Görüntülenme</span>
          <span className="text-xs font-medium px-2 py-1 bg-red-50 text-red-700 rounded-md">❤️ {formatInstagramSayi(gonderi.begeni_sayisi || 0)} Beğeni</span>
        </div>
      </div>

      <div className="flex w-full sm:w-auto gap-2 mt-2 sm:mt-0 sm:flex-col">
        <button onClick={() => duzenlemeyiBaslat(gonderi)} className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white font-bold rounded-xl transition-colors text-sm text-center">
          ✏️ Düzenle
        </button>
        <button onClick={() => gonderiSil(gonderi.id, gonderi.medya_url)} className="flex-1 sm:flex-none px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-xl transition-colors text-sm text-center">
          🗑️ Sil
        </button>
      </div>
    </Reorder.Item>
  );
};

// --- ANA BİLEŞEN ---
export default function GonderilerListesi() {
  const [gonderiler, setGonderiler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [duzenlenenGonderi, setDuzenlenenGonderi] = useState<any>(null);
  const [baslik, setBaslik] = useState('');
  const [kisaOzet, setKisaOzet] = useState('');
  const [uzunMetin, setUzunMetin] = useState('');
  const [begeniSayisi, setBegeniSayisi] = useState('0');
  
  const [mevcutMedyalar, setMevcutMedyalar] = useState<string[]>([]);
  const [silinecekMedyalar, setSilinecekMedyalar] = useState<string[]>([]);
  const [yeniDosyalar, setYeniDosyalar] = useState<File[]>([]);
  
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    verileriGetir();
  }, []);

  const verileriGetir = async () => {
    const { data } = await supabase
      .from('gerceklesen_dilekler')
      .select('*')
      .order('sira', { ascending: true })       
      .order('created_at', { ascending: false }); 
    if (data) setGonderiler(data);
    setYukleniyor(false);
  };

  // --- SÜRÜKLE BIRAK SIRAYI KAYDETME (Kritik Düzeltme) ---
  const sirayiKaydet = async (yeniListe: any[]) => {
    setGonderiler(yeniListe); // Ekranda anında güncelle

    try {
      // Her bir elemanın yeni sıra indeksini veritabanına kaydediyoruz
      for (let i = 0; i < yeniListe.length; i++) {
        await supabase
          .from('gerceklesen_dilekler')
          .update({ sira: i })
          .eq('id', yeniListe[i].id);
      }
    } catch (error) {
      console.error("Sıra güncellenirken hata oluştu:", error);
      verileriGetir(); // Hata olursa orijinal veriyi tekrar çek
    }
  };

  const gonderiSil = async (id: string, medyaUrlleri: string[]) => {
    const onay = window.confirm("Bu gönderiyi kalıcı olarak silmek istediğinize emin misiniz?");
    if (!onay) return;

    try {
      const silinecekYollar = medyaUrlleri.map(url => url.split('/hikayeler/')[1]).filter(Boolean);
      if (silinecekYollar.length > 0) {
        await supabase.storage.from('hikayeler').remove(silinecekYollar);
      }
      await supabase.from('gerceklesen_dilekler').delete().eq('id', id);
      setGonderiler(gonderiler.filter(g => g.id !== id));
    } catch (error: any) {
      alert("Hata: " + error.message);
    }
  };

  const duzenlemeyiBaslat = (gonderi: any) => {
    setDuzenlenenGonderi(gonderi);
    setBaslik(gonderi.baslik || '');
    setKisaOzet(gonderi.kisa_ozet || '');
    setUzunMetin(gonderi.uzun_metin || '');
    setBegeniSayisi(String(gonderi.begeni_sayisi || 0));
    setMevcutMedyalar([...(gonderi.medya_url || [])]);
    setSilinecekMedyalar([]);
    setYeniDosyalar([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duzenlemeyiIptalEt = () => {
    setDuzenlenenGonderi(null);
  };

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

  const gonderiyiGuncelle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIslemYapiliyor(true);

    if (mevcutMedyalar.length === 0 && yeniDosyalar.length === 0) {
      alert("En az bir görsel/video kalmalıdır!");
      setIslemYapiliyor(false); return;
    }

    try {
      let eklenenUrller: string[] = [];
      for (const dosya of yeniDosyalar) {
        const uzanti = dosya.name.split('.').pop();
        const isim = `${Date.now()}-${Math.random().toString(36).substring(2)}.${uzanti}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('hikayeler').upload(`public/${isim}`, dosya);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('hikayeler').getPublicUrl(uploadData.path);
        eklenenUrller.push(publicUrl);
      }

      if (silinecekMedyalar.length > 0) {
        const silinecekYollar = silinecekMedyalar.map(url => url.split('/hikayeler/')[1]).filter(Boolean);
        await supabase.storage.from('hikayeler').remove(silinecekYollar);
      }

      const finalMedyalar = [...mevcutMedyalar, ...eklenenUrller];
      const yeniKapak = finalMedyalar[0];

      const { data, error } = await supabase.from('gerceklesen_dilekler').update({
        baslik: baslik.trim() || 'Başlıksız Gönderi',
        kisa_ozet: kisaOzet.trim() || '',
        uzun_metin: uzunMetin.trim() || '',
        begeni_sayisi: parseInt(begeniSayisi) || 0,
        medya_url: finalMedyalar, 
        kapak_gorseli: yeniKapak
      }).eq('id', duzenlenenGonderi.id).select().single();

      if (error) throw error;

      setGonderiler(gonderiler.map(g => g.id === duzenlenenGonderi.id ? data : g));
      alert("Gönderi başarıyla güncellendi!");
      duzenlemeyiIptalEt();
    } catch (error: any) {
      alert("Güncelleme hatası: " + error.message);
    } finally {
      setIslemYapiliyor(false);
    }
  };

  if (yukleniyor) return <p className="text-gray-500 p-4">Gönderiler yükleniyor...</p>;

  if (duzenlenenGonderi) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-10 animate-fade-in-up">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">Gönderiyi Düzenle</h2>
          <button onClick={duzenlemeyiIptalEt} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
            &larr; Listeye Geri Dön
          </button>
        </div>

        <form onSubmit={gonderiyiGuncelle} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Başlık (İsteğe Bağlı)</label>
            <input type="text" value={baslik} onChange={(e) => setBaslik(e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Beğeni Sayısı</label>
            <input type="number" min="0" value={begeniSayisi} onChange={(e) => setBegeniSayisi(e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kısa Özet (İsteğe Bağlı)</label>
            <textarea rows={2} value={kisaOzet} onChange={(e) => setKisaOzet(e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Uzun Hikaye (İsteğe Bağlı)</label>
            <textarea rows={8} value={uzunMetin} onChange={(e) => setUzunMetin(e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <label className="block text-sm font-bold text-gray-700 mb-4">Medya Yönetimi (İlk görsel Kapak olur)</label>
            <div className="flex flex-wrap gap-4 mb-4">
              {mevcutMedyalar.map((url, index) => (
                <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-300 shadow-sm group">
                  {url.includes('.mp4') ? <video src={url} className="w-full h-full object-cover" /> : <img src={url} className="w-full h-full object-cover" />}
                  <button type="button" onClick={() => mevcutMedyayiKaldir(url)} className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-2xl">&times;</button>
                  {index === 0 && <span className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-[10px] font-bold text-center py-1">KAPAK</span>}
                </div>
              ))}
              {yeniDosyalar.map((dosya, index) => (
                <div key={`yeni-${index}`} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-400 shadow-sm group">
                  <img src={URL.createObjectURL(dosya)} className="w-full h-full object-cover opacity-70" />
                  <button type="button" onClick={() => yeniDosyayiKaldir(index)} className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-2xl">&times;</button>
                  <span className="absolute bottom-0 left-0 right-0 bg-blue-500/90 text-white text-[10px] font-bold text-center py-1">YENİ</span>
                </div>
              ))}
            </div>
            <input type="file" multiple accept="image/*,video/*" onChange={yeniDosyaSecildi} ref={dosyaInputRef} className="hidden" />
            <button type="button" onClick={() => dosyaInputRef.current?.click()} className="w-full py-4 border-2 border-dashed border-gray-400 text-gray-600 font-bold rounded-xl hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              + Yeni Görsel veya Video Ekle
            </button>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
            <button type="button" onClick={duzenlemeyiIptalEt} disabled={islemYapiliyor} className="w-full sm:w-1/3 py-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-colors">
              İptal Et
            </button>
            <button type="submit" disabled={islemYapiliyor} className="w-full sm:w-2/3 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-md transition-colors">
              {islemYapiliyor ? 'Değişiklikler Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Yüklenen Gönderiler</h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg mt-2 sm:mt-0">
          En üstteki gönderi ana sayfada ilk sırada görünür. Sırayı değiştirmek için (☰) simgesinden sürükleyin.
        </span>
      </div>

      {gonderiler.length === 0 ? (
        <p className="text-gray-500">Henüz hiç gönderi eklenmemiş.</p>
      ) : (
        <Reorder.Group axis="y" values={gonderiler} onReorder={sirayiKaydet} className="space-y-4">
          {gonderiler.map((gonderi) => (
            <SuruklenebilirKart 
              key={gonderi.id} 
              gonderi={gonderi} 
              duzenlemeyiBaslat={duzenlemeyiBaslat} 
              gonderiSil={gonderiSil} 
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}