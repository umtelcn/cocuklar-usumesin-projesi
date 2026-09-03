"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import InstagramGaleri from '@/components/InstagramGaleri';
import BagisFormu from '@/components/BagisFormu';
import IadeTalebi from '@/components/IadeTalebi';
import BagisListesi from '@/components/BagisListesi';
import SikcaSorulanSorular from '@/components/SikcaSorulanSorular'; 
import TalepFormu from '@/components/TalepFormu'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHandHoldingHeart, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

export default function YardimSayfasi() {
  const [aktifSekme, setAktifSekme] = useState<'bagis' | 'talep' | 'hakkimizda'>('bagis');

  useEffect(() => {
    const ziyaretEdildi = sessionStorage.getItem('site_ziyaret_edildi');
    if (!ziyaretEdildi) {
      supabase.rpc('site_ziyaret_artir')
        .then(() => {
          sessionStorage.setItem('site_ziyaret_edildi', 'true');
        })
        .catch(err => {
          console.error("Ziyaret sayacı artırılamadı:", err);
        });
    }
  }, []);

  return (
    <div className="w-full space-y-4 pb-10">
      
      {/* 3'LÜ MİNİMALİST ÜST ÜSTE SEKME MENÜSÜ */}
      <div className="w-full max-w-md mx-auto px-4 pt-4">
        <div className="flex items-center justify-around border-b border-gray-200">
          
          <button
            onClick={() => setAktifSekme('bagis')}
            className={`relative pb-3 px-3 text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-colors duration-200 ${
              aktifSekme === 'bagis' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FontAwesomeIcon icon={faHeart} className="text-lg" />
            <span>Bağış Yap</span>
            {aktifSekme === 'bagis' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-t-full"></div>
            )}
          </button>

          <button
            onClick={() => setAktifSekme('talep')}
            className={`relative pb-3 px-3 text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-colors duration-200 ${
              aktifSekme === 'talep' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-lg" />
            <span>Yardım Talebi</span>
            {aktifSekme === 'talep' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-t-full"></div>
            )}
          </button>

          <button
            onClick={() => setAktifSekme('hakkimizda')}
            className={`relative pb-3 px-3 text-xs sm:text-sm font-bold flex flex-col items-center gap-1.5 transition-colors duration-200 ${
              aktifSekme === 'hakkimizda' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <FontAwesomeIcon icon={faCircleInfo} className="text-lg" />
            <span>Hakkımızda</span>
            {aktifSekme === 'hakkimizda' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-t-full"></div>
            )}
          </button>

        </div>
      </div>

      {/* SEKME İÇERİKLERİ */}
      <div className="w-full transition-all duration-300">
        
        {/* 1. SEKME: BAĞIŞ YAP (Ana Galeri + Bağış modülleri) */}
        {aktifSekme === 'bagis' && (
          <div className="space-y-2 animate-fade-in">
            <InstagramGaleri />
            
            <div className="space-y-1">
              <BagisFormu />
              <IadeTalebi />
            </div>

            <BagisListesi />
          </div>
        )}

        {/* 2. SEKME: YARDIM TALEBİ */}
        {aktifSekme === 'talep' && (
          <div className="animate-fade-in py-2">
            <TalepFormu />
          </div>
        )}

        {/* 3. SEKME: HAKKIMIZDA & SSS */}
        {aktifSekme === 'hakkimizda' && (
          <div className="w-full max-w-md mx-auto px-4 py-2 space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Hakkımızda</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
               Derneğimiz; Türkiye'nin dört bir yanındaki dezavantajlı çocuklarımızın gıda, giyim ve eğitim materyali ihtiyaçlarını karşılamak, aynı zamanda onların saf hayallerini hayata geçirmek misyonuyla yola çıkmış, ülkemizin en büyük gönüllü sosyal yardım hareketlerinden biridir.
              </p>
            </div>

            {/* Sıkça Sorulan Sorular Bileşeni */}
            <SikcaSorulanSorular />
          </div>
        )}

      </div>

    </div>
  );
}