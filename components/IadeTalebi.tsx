"use client";

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IadeTalebi() {
  const [modalAcik, setModalAcik] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [basariMesaji, setBasariMesaji] = useState(false);
  
  const [form, setForm] = useState({ ad_soyad: '', iban: '', tutar: '', mesaj: '' });
  const [dekont, setDekont] = useState<File | null>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const formGonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dekont) {
      alert("Lütfen işlem dekontunu yükleyin.");
      return;
    }

    setYukleniyor(true);
    try {
      // 1. Dekontu Supabase Storage'a Yükle
      const uzanti = dekont.name.split('.').pop();
      const dosyaAdi = `dekontlar/${Date.now()}-${Math.random().toString(36).substring(2)}.${uzanti}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hikayeler')
        .upload(dosyaAdi, dekont);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('hikayeler').getPublicUrl(uploadData.path);

      // 2. Veritabanına Kaydet
      const { error: dbError } = await supabase.from('iade_talepleri').insert([{
        ad_soyad: form.ad_soyad,
        iban: form.iban,
        tutar: form.tutar,
        mesaj: form.mesaj,
        dekont_url: publicUrl
      }]);

      if (dbError) throw dbError;

      setBasariMesaji(true);
      setTimeout(() => {
        setModalAcik(false);
        setBasariMesaji(false);
        setForm({ ad_soyad: '', iban: '', tutar: '', mesaj: '' });
        setDekont(null);
      }, 3000);

    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="w-full flex justify-center mt-3">
      {/* İade Butonu (Bağış butonunun altında daha sönük, güven verici renkte) */}
      <button 
        onClick={() => setModalAcik(true)}
        className="text-sm font-medium text-gray-500 hover:text-gray-800 underline decoration-gray-300 underline-offset-4 transition-colors"
      >
        Bağış İade Talebinde Bulun
      </button>

      {/* MODAL (AÇILIR PENCERE) */}
      {modalAcik && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setModalAcik(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
            
            <h2 className="text-xl font-bold text-gray-800 mb-1">İade Talebi</h2>
            <p className="text-xs text-gray-500 mb-6">Bağışınızı koşulsuz olarak iade alabilirsiniz.</p>

            {basariMesaji ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
                <h3 className="text-lg font-bold text-gray-800">Talebiniz Alındı</h3>
                <p className="text-gray-500 text-sm mt-2">İade işleminiz incelenip en kısa sürede hesabınıza aktarılacaktır.</p>
              </div>
            ) : (
              <form onSubmit={formGonder} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <input required type="text" value={form.ad_soyad} onChange={(e) => setForm({...form, ad_soyad: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">IBAN Numaranız</label>
                  <input required type="text" placeholder="TR..." value={form.iban} onChange={(e) => setForm({...form, iban: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">İade İstenen Tutar (₺)</label>
                  <input required type="number" value={form.tutar} onChange={(e) => setForm({...form, tutar: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dekont (Zorunlu)</label>
                  <input type="file" accept="image/*,.pdf" ref={dosyaInputRef} onChange={(e) => setDekont(e.target.files?.[0] || null)} className="hidden" />
                  <button type="button" onClick={() => dosyaInputRef.current?.click()} className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
                    {dekont ? `Seçildi: ${dekont.name}` : '+ Dekont Seç / Yükle'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Neden (İsteğe Bağlı)</label>
                  <textarea rows={2} value={form.mesaj} onChange={(e) => setForm({...form, mesaj: e.target.value})} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none resize-none focus:border-orange-500" placeholder="Kısaca belirtebilirsiniz..." />
                </div>
                <button type="submit" disabled={yukleniyor} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 mt-2 transition-colors">
                  {yukleniyor ? 'Gönderiliyor...' : 'Talebi Gönder'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}