"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IadelerListesi() {
  const [talepler, setTalepler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // Kopyalandı bildirimi için state
  const [kopyalananIban, setKopyalananIban] = useState<string | null>(null);

  // Tam ekran dekont modalı için state
  const [secilenDekont, setSecilenDekont] = useState<string | null>(null);

  useEffect(() => {
    const talepleriGetir = async () => {
      const { data } = await supabase.from('iade_talepleri').select('*').order('created_at', { ascending: false });
      if (data) setTalepler(data);
      setYukleniyor(false);
    };
    talepleriGetir();
  }, []);

  const durumGuncelle = async (id: string, yeniDurum: string) => {
    const onay = window.confirm(`Bu talebi "${yeniDurum}" olarak işaretlemek istediğinize emin misiniz?`);
    if (!onay) return;

    const { error } = await supabase.from('iade_talepleri').update({ durum: yeniDurum }).eq('id', id);
    if (!error) {
      setTalepler(talepler.map(t => t.id === id ? { ...t, durum: yeniDurum } : t));
    } else {
      alert("Hata oluştu: " + error.message);
    }
  };

  // IBAN Kopyalama Fonksiyonu
  const ibanKopyala = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setKopyalananIban(iban);
    setTimeout(() => setKopyalananIban(null), 2000); // 2 saniye sonra yazıyı eski haline getir
  };

  if (yukleniyor) return <p className="text-gray-500 p-4">İade talepleri yükleniyor...</p>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-8 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Bağış İade Talepleri</h2>
      
      {talepler.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">Şu an bekleyen veya tamamlanmış bir iade talebi bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {talepler.map((talep) => (
             <div key={talep.id} className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between hover:bg-gray-50 transition-colors">
               
               {/* SOL TARAF: BİLGİLER */}
               <div className="flex-1 space-y-2 w-full">
                 <div className="flex flex-wrap items-center justify-between gap-2">
                   <h3 className="font-extrabold text-gray-900 text-lg uppercase tracking-tight">{talep.ad_soyad}</h3>
                   
                   {/* DURUM ROZETİ */}
                   <span className={`px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                     talep.durum === 'Bekliyor' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                     talep.durum === 'İade Edildi' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                   }`}>
                     {talep.durum}
                   </span>
                 </div>

                 {/* TUTAR */}
                 <p className="text-sm font-semibold text-gray-700">
                   İstenen Tutar: <span className="text-orange-600 font-extrabold text-base">{talep.tutar} ₺</span>
                 </p>

                 {/* IBAN VE KOPYALA BUTONU */}
                 <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 max-w-md">
                   <span className="text-xs text-gray-400 font-bold uppercase">IBAN:</span>
                   <span className="text-sm font-mono font-bold text-gray-800 flex-1 truncate">{talep.iban}</span>
                   
                   <button 
                     onClick={() => ibanKopyala(talep.iban)}
                     className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-bold rounded-lg transition-colors shrink-0 border border-gray-200"
                   >
                     {kopyalananIban === talep.iban ? '✓ Kopyalandı' : '📋 Kopyala'}
                   </button>
                 </div>

                 {/* KULLANICI MESAJI (VARSA) */}
                 {talep.mesaj && (
                   <p className="text-xs text-gray-600 italic bg-white p-2.5 rounded-xl border border-gray-200">
                     <span className="font-bold not-italic text-gray-400">Not:</span> "{talep.mesaj}"
                   </p>
                 )}

                 <p className="text-[11px] text-gray-400 font-medium">Tarih: {new Date(talep.created_at).toLocaleString('tr-TR')}</p>
               </div>

               {/* SAĞ TARAF: AKSİYONLAR VE DEKONT */}
               <div className="flex flex-row lg:flex-col gap-2.5 w-full lg:w-48 shrink-0 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-5 border-gray-200">
                 
                 {/* DEKONT GÖRÜNTÜLEME BUTONU (MODAL AÇAR) */}
                 <button 
                   onClick={() => setSecilenDekont(talep.dekont_url)} 
                   className="flex-1 lg:flex-none text-center py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors border border-blue-100 flex items-center justify-center gap-1.5"
                 >
                   <span>📄</span> Dekontu Aç
                 </button>

                 {/* ONAYLA / REDDET */}
                 {talep.durum === 'Bekliyor' ? (
                   <>
                     <button onClick={() => durumGuncelle(talep.id, 'İade Edildi')} className="flex-1 lg:flex-none py-2.5 bg-green-600 text-white font-bold rounded-xl text-xs hover:bg-green-700 transition-colors shadow-sm">
                       ✓ Onayla
                     </button>
                     <button onClick={() => durumGuncelle(talep.id, 'Reddedildi')} className="flex-1 lg:flex-none py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 border border-red-100 transition-colors">
                       ✕ Reddet
                     </button>
                   </>
                 ) : (
                   <button onClick={() => durumGuncelle(talep.id, 'Bekliyor')} className="w-full py-2 text-gray-400 hover:text-orange-600 text-xs font-bold underline">
                     Bekliyor'a Çevir
                   </button>
                 )}
               </div>

             </div>
          ))}
        </div>
      )}

      {/* --- TAM EKRAN DEKONT MODALI (ÖNİZLEME) --- */}
      {secilenDekont && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSecilenDekont(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            
            {/* KAPATMA BUTONU */}
            <button 
              onClick={() => setSecilenDekont(null)} 
              className="absolute -top-12 right-0 text-white text-3xl font-bold bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            >
              &times;
            </button>

            {/* DEKONT GÖRSELİ VEYA PDF ÖNİZLEMESİ */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full flex items-center justify-center p-2">
              {secilenDekont.includes('.pdf') ? (
                <iframe src={secilenDekont} className="w-full h-[75vh] rounded-xl" />
              ) : (
                <img src={secilenDekont} alt="Dekont" className="max-h-[80vh] w-auto object-contain rounded-xl" />
              )}
            </div>

            <a 
              href={secilenDekont} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-4 px-6 py-3 bg-white text-gray-900 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Yeni Sekmede Aç / İndir ↗
            </a>
          </div>
        </div>
      )}

    </div>
  );
}