"use client";

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HikayeEklePage() {
  const [baslik, setBaslik] = useState('');
  const [kisaOzet, setKisaOzet] = useState('');
  const [uzunMetin, setUzunMetin] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState({ tip: '', metin: '' });

  const [medyalar, setMedyalar] = useState<{ id: string; file: File; url: string; type: string }[]>([]);
  const [tasinacakIndex, setTasinacakIndex] = useState<number | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  // --- MEDYA YÖNETİMİ ---
  const dosyaSecimi = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const yeniDosyalar = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image'
      }));
      setMedyalar((prev) => [...prev, ...yeniDosyalar]);
    }
    if (dosyaInputRef.current) dosyaInputRef.current.value = '';
  };

  const medyayiSil = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Silmeye basınca taşıma tetiklenmesin
    setMedyalar(prev => prev.filter(m => m.id !== id));
    setTasinacakIndex(null);
  };

  const sirayiGuncelle = (kaynak: number, hedef: number) => {
    const yeniSira = [...medyalar];
    const [tasinan] = yeniSira.splice(kaynak, 1);
    yeniSira.splice(hedef, 0, tasinan); // Hedef konuma yerleştir, diğerlerini kaydır
    setMedyalar(yeniSira);
  };

  // --- PC İÇİN SÜRÜKLE-BIRAK ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('kaynakIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent, hedefIndex: number) => {
    e.preventDefault();
    const kaynakIndex = parseInt(e.dataTransfer.getData('kaynakIndex'));
    if (!isNaN(kaynakIndex) && kaynakIndex !== hedefIndex) {
      sirayiGuncelle(kaynakIndex, hedefIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // --- MOBİL İÇİN DOKUN & YERLEŞTİR ---
  const mobilTasimaYoneticisi = (index: number) => {
    if (tasinacakIndex === null) {
      setTasinacakIndex(index); // İlk dokunuş: Taşınacak olanı seç
    } else {
      if (tasinacakIndex !== index) {
        sirayiGuncelle(tasinacakIndex, index); // İkinci dokunuş: Hedefe yerleştir
      }
      setTasinacakIndex(null); // Seçimi temizle
    }
  };

  // --- SUPABASE VERİTABANI YÜKLEME ---
  const formGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    setMesaj({ tip: '', metin: '' });

    if (medyalar.length === 0) {
      setMesaj({ tip: 'hata', metin: 'Lütfen en az bir görsel veya video ekleyin.' });
      setYukleniyor(false);
      return;
    }

    try {
      const yuklenenUrller: string[] = [];

      for (const medya of medyalar) {
        const dosyaUzantisi = medya.file.name.split('.').pop();
        const rastgeleIsim = `${Date.now()}-${Math.random().toString(36).substring(2)}.${dosyaUzantisi}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('hikayeler')
          .upload(`public/${rastgeleIsim}`, medya.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('hikayeler')
          .getPublicUrl(uploadData.path);

        yuklenenUrller.push(publicUrl);
      }

      const { error: dbError } = await supabase
        .from('gerceklesen_dilekler')
        .insert([{
          baslik: baslik || 'Başlıksız Gönderi',
          kisa_ozet: kisaOzet || '',
          uzun_metin: uzunMetin || '',
          kapak_gorseli: yuklenenUrller[0], 
          medya_url: yuklenenUrller
        }]);

      if (dbError) throw dbError;

      setMesaj({ tip: 'basari', metin: 'Gönderi başarıyla yayınlandı!' });
      setBaslik(''); setKisaOzet(''); setUzunMetin(''); setMedyalar([]);
      
    } catch (error: any) {
      setMesaj({ tip: 'hata', metin: 'Bir hata oluştu: ' + error.message });
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Yeni Gönderi Ekle</h1>
      
      {mesaj.metin && (
        <div className={`p-4 mb-6 rounded-lg font-medium ${mesaj.tip === 'hata' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {mesaj.metin}
        </div>
      )}

      <form onSubmit={formGonder} className="space-y-6">
        
        {/* METİN ALANLARI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlık <span className="text-gray-400 font-normal">(İsteğe Bağlı)</span></label>
              <input type="text" value={baslik} onChange={(e) => setBaslik(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Örn: Ahmet'in Kışlık Bot Mutluluğu"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kısa Özet <span className="text-gray-400 font-normal">(İsteğe Bağlı)</span></label>
              <textarea rows={3} value={kisaOzet} onChange={(e) => setKisaOzet(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Sosyal medya veya kısa kartlar için özet..."/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Uzun Hikaye <span className="text-gray-400 font-normal">(İsteğe Bağlı)</span></label>
            <textarea rows={8} value={uzunMetin} onChange={(e) => setUzunMetin(e.target.value)} className="w-full h-[calc(100%-28px)] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Detaylar, duygular, teşekkür mesajları..."/>
          </div>
        </div>

        {/* GİZLİ DOSYA INPUTU (Artık sadece ızgara içindeki Ekle butonuyla tetikleniyor) */}
        <input 
          type="file" multiple accept="image/*,video/*" 
          onChange={dosyaSecimi} ref={dosyaInputRef} className="hidden" 
        />

        {/* İNTERAKTİF MEDYA IZGARASI */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Medya Galerisi <span className="text-red-500 font-normal">(En az 1 görsel/video zorunlu)</span></label>
            {tasinacakIndex !== null && (
              <span className="text-xs font-bold text-blue-600 animate-pulse">Hedef konuma dokunun...</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 min-h-[150px]">
            
            {medyalar.map((medya, index) => (
              <div 
                key={medya.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
                onClick={() => mobilTasimaYoneticisi(index)}
                className={`relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-all border-2 group
                  ${tasinacakIndex === index ? 'border-blue-500 scale-95 shadow-lg ring-4 ring-blue-100' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
              >
                {/* Sıra Numarası ve Kapak Etiketi */}
                <div className="absolute top-2 left-2 z-10 flex gap-1 items-center">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                    {index + 1}
                  </span>
                  {index === 0 && (
                    <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md">Kapak</span>
                  )}
                </div>

                {/* Mobil Taşıma İkonu (Mobilde her zaman görünür, PC'de hover ile görünür) */}
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); mobilTasimaYoneticisi(index); }}
                  className="absolute bottom-2 left-2 z-10 bg-white/90 text-blue-600 text-[10px] font-bold px-2 py-1 rounded shadow md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  {tasinacakIndex === index ? 'İptal Et' : 'Yer Değiştir'}
                </button>

                {/* Silme Butonu */}
                <button 
                  type="button" 
                  onClick={(e) => medyayiSil(medya.id, e)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>

                {/* Medya Önizlemesi */}
                <div className="w-full h-full pointer-events-none">
                  {medya.type === 'video' ? (
                    <video src={medya.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={medya.url} alt="Önizleme" className="w-full h-full object-cover" />
                  )}
                </div>
                
                {/* Taşıma Modu Overlay */}
                {tasinacakIndex !== null && tasinacakIndex !== index && (
                  <div className="absolute inset-0 bg-blue-500/10 hover:bg-blue-500/30 transition-colors"></div>
                )}
              </div>
            ))}

            {/* IZGARA İÇİ EKLEME KUTUSU (+) */}
            <div 
              onClick={() => dosyaInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-400 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center transition-colors group"
            >
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-2 transition-colors">
                <span className="text-gray-500 group-hover:text-blue-600 text-xl font-bold">+</span>
              </div>
              <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600">Medya Ekle</span>
            </div>

          </div>
          <p className="mt-2 text-xs text-gray-500">
            PC'de: Farenizle sürükleyip bırakın. <br/> Mobilde: Önce "Yer Değiştir"e, sonra taşımak istediğiniz konuma dokunun.
          </p>
        </div>

        {/* GÖNDER BUTONU */}
        <button 
          type="submit" 
          disabled={yukleniyor}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all shadow-md ${yukleniyor ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
        >
          {yukleniyor ? 'Yükleniyor, Lütfen Bekleyin...' : 'Gönderiyi Yayınla'}
        </button>
      </form>
    </div>
  );
}