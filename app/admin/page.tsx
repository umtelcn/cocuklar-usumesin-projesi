"use client";

import { useState } from 'react';
import Link from 'next/link';

// Modüllerimiz
import GonderiEkle from '@/components/admin/GonderiEkle';
import GonderilerListesi from '@/components/admin/GonderilerListesi';
import IadelerListesi from '@/components/admin/IadelerListesi';
import SiralamaYonetimi from '@/components/admin/SiralamaYonetimi';
import SssYonetimi from '@/components/admin/SssYonetimi'; // <--- SSS Yönetimi

export default function AdminDashboard() {
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const [aktifSekme, setAktifSekme] = useState('ekle'); 

  const menuDegistir = (sekme: string) => {
    setAktifSekme(sekme);
    setMobilMenuAcik(false);
  };

  const AktifIcerigiGoster = () => {
    switch (aktifSekme) {
      case 'ekle':
        return <GonderiEkle />;
      case 'listele':
        return <GonderilerListesi />;
      case 'siralama':
        return <SiralamaYonetimi />;
      case 'sss':
        return <SssYonetimi />; // <--- SSS Görünümü
      case 'iadeler':
        return <IadelerListesi />;
      default:
        return <GonderiEkle />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* MOBİL ÜST BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
        <button onClick={() => setMobilMenuAcik(!mobilMenuAcik)} className="text-2xl text-gray-600">
          {mobilMenuAcik ? '✕' : '☰'}
        </button>
      </div>

      {mobilMenuAcik && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobilMenuAcik(false)}></div>}

      {/* SOL MENÜ (Sidebar) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${mobilMenuAcik ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 hidden md:block">
          <Link href="/" className="text-lg font-bold text-gray-800">Admin Panel</Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => menuDegistir('ekle')} 
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${aktifSekme === 'ekle' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            📝 Gönderi Ekle
          </button>
          
          <button 
            onClick={() => menuDegistir('listele')} 
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${aktifSekme === 'listele' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            🗑️ Yüklenen Gönderiler
          </button>

          <button 
            onClick={() => menuDegistir('siralama')} 
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${aktifSekme === 'siralama' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            ↕️ Sıralama Yönetimi
          </button>

          {/* SSS Yönetimi Butonu */}
          <button 
            onClick={() => menuDegistir('sss')} 
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${aktifSekme === 'sss' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            ❓ SSS Yönetimi
          </button>

          <button 
            onClick={() => menuDegistir('iadeler')} 
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${aktifSekme === 'iadeler' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            💸 İade Talepleri
          </button>
        </nav>
      </aside>

      {/* SAĞ İÇERİK ALANI */}
      <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 w-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {AktifIcerigiGoster()}
        </div>
      </main>
    </div>
  );
}