'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// BİLEŞENLER
import YardimSepeti from '@/components/YardimSepeti';
import SonBagislar from '@/components/SonBagislar';
import TalepFormu from '@/components/TalepFormu';
import GonulluOl from '@/components/GonulluOl';
import OdemeBilgileri from '@/components/OdemeBilgileri';
import BagisciBilgileri from '@/components/BagisciBilgileri';
import TesekkurKarti from '@/components/TesekkurKarti';

// İKONLAR
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandHoldingHeart, faHandHoldingHand, faHandshakeAngle, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

// TİP TANIMLAMALARI
type Urun = { id: number; fiyat: number; ad: string; gorsel_yolu: string; adet: number; };
type BagisDetay = { id: number; adet: number; urunler: { ad: string }; };
type Bagis = { id: number; created_at: string; is_anonymous: boolean; instagram_kullanici_adi: string | null; ad_soyad: string | null; nakdi_tutar: number; mesaj: string | null; bagis_detaylari: BagisDetay[]; };
type Ilce = { id: number; name: string; };
type Il = { id: number; name: string; districts: Ilce[]; };

export default function YardimSayfasi() {
  // === STATE'LER (Tipleriyle birlikte) ===
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('sepet');
  const [loading, setLoading] = useState({ urunler: true, donations: true, iller: true, form: false, saving: false });
  const [submissionStatus, setSubmissionStatus] = useState({ success: false, message: '' });
  
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [manualAmount, setManualAmount] = useState('');
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [donationFormData, setDonationFormData] = useState({ name: '', instagram: '', message: '', isAnonymous: false });
  const [thankYouCardData, setThankYouCardData] = useState({ name: 'İsimsiz Kahraman', amount: 0, itemImage: null as string | null });
  
  const [recentDonations, setRecentDonations] = useState<Bagis[]>([]);
  
  const [talepFormData, setTalepFormData] = useState({ ad_soyad: '', telefon: '', il: '', ilce: '', mesaj: '', gorseller: null as FileList | null });
  const [ilVerisi, setIlVerisi] = useState<Il[]>([]);
  const [ilceler, setIlceler] = useState<Ilce[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRecentDonations = async () => {
    setLoading(prev => ({ ...prev, donations: true }));
    const { data, error } = await supabase.from('bagislar').select('*, bagis_detaylari(*, urunler(ad))').order('created_at', { ascending: false }).limit(20);
    if (error) console.error("Son bağışlar çekilemedi:", error);
    else setRecentDonations(data as Bagis[]);
    setLoading(prev => ({ ...prev, donations: false }));
  };
  
  useEffect(() => {
    const getUrunler = async () => {
      setLoading(prev => ({ ...prev, urunler: true }));
      const { data, error } = await supabase.from('urunler').select('*').eq('aktif', true).order('sira', { ascending: true });
      if (error) console.error("Ürün çekme hatası:", error.message);
      else setUrunler(data.map(u => ({ ...u, adet: 0 })) as Urun[]);
      setLoading(prev => ({ ...prev, urunler: false }));
    };

    const getIller = async () => {
        setLoading(prev => ({ ...prev, iller: true }));
        try {
            const response = await fetch('https://turkiyeapi.dev/api/v1/provinces');
            const result = await response.json();
            setIlVerisi(result.data || []);
        } catch (error) {
            console.error("İller yüklenirken hata oluştu:", error);
        } finally {
            setLoading(prev => ({ ...prev, iller: false }));
        }
    };

    getUrunler();
    getRecentDonations();
    getIller();
  }, []);

  const toplamAdet = useMemo(() => urunler.reduce((sum, urun) => sum + urun.adet, 0), [urunler]);
  const toplamTutar = useMemo(() => urunler.reduce((sum, u) => sum + u.fiyat * u.adet, 0) + (Number(manualAmount) || 0), [urunler, manualAmount]);
  const handleUrunAdetChange = (urunId: number, miktar: number) => setUrunler(urunler.map(u => u.id === urunId ? { ...u, adet: Math.max(0, u.adet + miktar) } : u));
  const handleNextStep = () => { if (toplamTutar > 0) { setCheckoutAmount(toplamTutar); setStep(2); } };
  const handleIlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const secilenIlAdi = e.target.value;
    const secilenIlData = ilVerisi.find(il => il.name === secilenIlAdi);
    setIlceler(secilenIlData ? secilenIlData.districts : []);
    setTalepFormData(prev => ({ ...prev, il: secilenIlAdi, ilce: '' }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubmissionStatus({ success: false, message: '' });
    setTalepFormData(prev => ({ ...prev, gorseller: event.target.files }));
  };

  const handleTalepSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!talepFormData.ad_soyad || !talepFormData.telefon || !talepFormData.il || !talepFormData.ilce) {
      alert('Lütfen Ad, Telefon, İl ve İlçe alanlarını doldurun.');
      return;
    }
    setLoading(prev => ({ ...prev, form: true }));
    setSubmissionStatus({ success: false, message: 'Talebiniz gönderiliyor...' });
    const gorselYollari: string[] = [];
    if (talepFormData.gorseller) {
      for (const file of Array.from(talepFormData.gorseller)) {
        const { data, error } = await supabase.storage.from('talep-gorselleri').upload(`${Date.now()}-${file.name}`, file);
        if (error) {
          setSubmissionStatus({ success: false, message: `Görsel yükleme hatası: ${error.message}` });
          setLoading(prev => ({ ...prev, form: false }));
          return;
        }
        gorselYollari.push(data.path);
      }
    }
    const { error: insertError } = await supabase.from('yardim_talepleri').insert([{ ...talepFormData, gorseller: undefined, gorsel_yollari: gorselYollari }]);
    if (insertError) {
      setSubmissionStatus({ success: false, message: 'Hata: Talep gönderilemedi.' });
    } else {
      setSubmissionStatus({ success: true, message: 'Talebiniz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz.' });
      setStep(5);
      setTalepFormData({ ad_soyad: '', telefon: '', il: '', ilce: '', mesaj: '', gorseller: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setLoading(prev => ({ ...prev, form: false }));
  };
  const saveDonation = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    let cardDisplayName = 'İsimsiz Kahraman';
    if (donationFormData.name.trim()) cardDisplayName = donationFormData.name.trim();
    else if (donationFormData.instagram.trim()) cardDisplayName = donationFormData.instagram.trim();
    const sepetUrunleri = urunler.filter(u => u.adet > 0);
    setThankYouCardData({ name: cardDisplayName, amount: checkoutAmount, itemImage: sepetUrunleri[0]?.gorsel_yolu || null });
    const donationPayload = { ad_soyad: donationFormData.name || null, instagram_kullanici_adi: donationFormData.instagram || null, mesaj: donationFormData.message || null, is_anonymous: donationFormData.isAnonymous, nakdi_tutar: Number(manualAmount) || 0, toplam_tutar: checkoutAmount };
    const { data: donation, error } = await supabase.from('bagislar').insert([donationPayload]).select().single();
    if (error) { console.error("Supabase Hata Detayı: ", error); alert('Bir hata oluştu. Lütfen tekrar deneyin.'); setLoading(prev => ({ ...prev, saving: false })); return; }
    if (sepetUrunleri.length > 0) {
      const bagisDetaylari = sepetUrunleri.map(item => ({ bagis_id: donation.id, urun_id: item.id, adet: item.adet, o_anki_fiyat: item.fiyat }));
      await supabase.from('bagis_detaylari').insert(bagisDetaylari);
    }
    setLoading(prev => ({ ...prev, saving: false }));
    setStep(4);
  };
  const share = (platform: 'twitter' | 'instagram', downloadAction: () => void) => {
    const text = encodeURIComponent(`Ben de 'Çocuklar Üşümesin' diyerek ${thankYouCardData.amount} TL değerinde yardımda bulundum! #cocuklarusumesin`);
    const url = encodeURIComponent('https://cocuklarusumesin.com');
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    else if (platform === 'instagram') {
      alert('Kartınız indiriliyor. Instagram Hikayenizde paylaşabilirsiniz.');
      downloadAction();
    }
  };
  const resetState = () => {
    setStep(1);
    setActiveTab('sepet');
    setDonationFormData({ name: '', instagram: '', message: '', isAnonymous: false });
    setManualAmount('');
    setUrunler(prev => prev.map(u => ({ ...u, adet: 0 })));
    getRecentDonations();
  };
  return (
    <div className="w-full max-w-sm">
      {step === 1 && (
        <>
          <div className="border-b border-gray-200 mb-6"><nav className="-mb-px flex space-x-6">
            <button onClick={() => setActiveTab('sepet')} className={`${activeTab === 'sepet' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300`}><FontAwesomeIcon icon={faHandHoldingHeart} /><span>Yardım Yap</span></button>
            <button onClick={() => { setActiveTab('talep'); setSubmissionStatus({ success: false, message: '' }); }} className={`${activeTab === 'talep' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300`}><FontAwesomeIcon icon={faHandHoldingHand} /><span>Talep Et</span></button>
            <button onClick={() => setActiveTab('gonullu')} className={`${activeTab === 'gonullu' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300`}><FontAwesomeIcon icon={faHandshakeAngle} /><span>Gönüllü Ol</span></button>
          </nav></div>
          {activeTab === 'sepet' && (<><YardimSepeti {...{ urunler, loading: loading.urunler, toplamAdet, toplamTutar, manualAmount, setManualAmount, handleUrunAdetChange, handleNextStep }} /><SonBagislar donations={recentDonations} loading={loading.donations} /></>)}
          {activeTab === 'talep' && <TalepFormu {...{ formData: talepFormData, setFormData: setTalepFormData, loading, iller: ilVerisi, ilceler, handleIlChange, handleFileChange, handleSubmit: handleTalepSubmit, submissionStatus, fileInputRef }} />}
          {activeTab === 'gonullu' && <GonulluOl />}
        </>
      )}
      {step === 2 && <OdemeBilgileri checkoutAmount={checkoutAmount} setStep={setStep} />}
      {step === 3 && <BagisciBilgileri {...{ donationFormData, setDonationFormData, saveDonation, loading: loading.saving, setStep }} />}
      {step === 4 && <TesekkurKarti cardData={thankYouCardData} share={share} resetState={resetState} />}
      {step === 5 && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl m-4"><FontAwesomeIcon icon={faPaperPlane} className="text-6xl text-blue-500 mx-auto" /><h2 className="text-3xl font-bold text-gray-800 mt-5">İşlem Tamamlandı!</h2><p className="text-lg text-gray-600 mt-2">{submissionStatus.message}</p><button onClick={() => setStep(1)} className="w-full mt-8 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600">Anasayfaya Dön</button></div>
        </div>
      )}
    </div>
  );
}