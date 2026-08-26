'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck, faHeart, faArrowRight, faArrowLeft, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

// Gönderdiğin kopyalanabilir alan bileşeni[cite: 1]
function CopyableField({ label, value, note, isWarning = false }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value.replace(/\s/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className={`bg-white rounded-xl shadow-sm border ${isWarning ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'} p-4`}>
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    {label && <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</span>}
                    <p className="font-bold text-gray-800 text-sm md:text-base break-all">{value}</p>
                </div>
                <button onClick={handleCopy} className="text-orange-500 p-2 rounded-lg hover:bg-orange-50 w-10 h-10 flex items-center justify-center flex-shrink-0 transition-colors border border-orange-100">
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? 'text-green-500' : ''} />
                </button>
            </div>
            {note && (
                <div className="mt-3 border-t border-gray-100/60 pt-2">
                    <p className={`text-xs font-semibold ${isWarning ? 'text-red-500' : 'text-gray-500 italic'}`}>{note}</p>
                </div>
            )}
        </div>
    );
}

export default function BagisFormu() {
    const [step, setStep] = useState(0); 
    const [amount, setAmount] = useState('');
    const [name, setName] = useState('');
    const [instagramUser, setInstagramUser] = useState('');
    const [message, setMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('bagislar')
                .insert([{
                    nakdi_tutar: Number(amount),
                    toplam_tutar: Number(amount),
                    ad_soyad: isAnonymous ? 'Gizli Kahraman' : name,
                    instagram_kullanici_adi: isAnonymous ? null : instagramUser,
                    mesaj: message,
                    is_anonymous: isAnonymous,
                }]);

            if (error) throw error;
            setStep(3); // Başarılı ekranı
        } catch (error) {
            console.error("Hata:", error);
            alert("Kayıt sırasında hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(0);
        setAmount('');
        setName('');
        setInstagramUser('');
        setMessage('');
        setIsAnonymous(false);
    };

    return (
        <div className="w-full max-w-md mx-auto px-4 mt-8">
            
            {/* ADIM 0: Tutar Girme */}
            {step === 0 && (
                <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 p-6 border border-orange-50 relative overflow-hidden animate-fade-in">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-red-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                            <FontAwesomeIcon icon={faHeart} />
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900">Bağış Yap</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 font-medium">Faaliyetlerimiz için bağışta bulunabilirsiniz.</p>
                    
                    <div className="relative mb-4">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">₺</span>
                        <input 
                            type="number" 
                            placeholder="0,00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-2xl text-gray-800 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => amount > 0 ? setStep(1) : alert('Lütfen geçerli bir tutar girin')}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 text-lg"
                    >
                        <span>İlerle</span>
                        <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                </div>
            )}

            {/* ADIM 1: IBAN ve Ödeme Bilgileri[cite: 1] */}
            {step === 1 && (
                <div className="animate-fade-in bg-gray-50 p-1 md:p-4 rounded-3xl">
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl shadow-sm p-5 flex justify-between items-center mb-6">
                        <p className="text-lg font-bold text-gray-800">Toplam Tutar</p>
                        <p className="text-2xl font-black text-orange-600">{Number(amount).toLocaleString('tr-TR')} TL</p>
                    </div>
                    
                    <h2 className="text-xl font-extrabold text-gray-800 mb-4 px-2">Banka Hesaplarımız</h2>
                    
                    <div className="flex flex-col gap-3">
                        <CopyableField 
                            label="TL IBAN" 
                            value="TR36 0001 0011 5098 1058 3050 01" 
                        />
                        <CopyableField 
                            label="ALICI ADI"
                            value="Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği" 
                            note='⚠️ Lütfen:Açıklama kısmına "Bağış" yazınız.'
                            isWarning={true}
                        />
                    </div>
                    
                    <div className="mt-6 flex flex-col gap-3">
                        <button onClick={() => setStep(2)} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl text-lg font-bold hover:shadow-lg transition-all shadow-orange-500/25">
                            Ödemeyi yaptım, devam
                        </button>
                        <button onClick={() => setStep(0)} className="w-full text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faArrowLeft} /> Geri Dön
                        </button>
                    </div>
                </div>
            )}

            {/* ADIM 2: Kişisel Bilgiler */}
            {step === 2 && (
                <div className="animate-fade-in bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                    <h3 className="text-xl font-extrabold text-gray-900 mb-1">Son Bir Adım</h3>
                    <p className="text-sm text-gray-500 mb-6 font-medium">Destekçilerimiz arasında yer almak için form doldurun.</p>
                    
                    <div className="space-y-4">
                        <div className="flex flex-col gap-4 relative">
                            <input 
                                type="text" 
                                placeholder="Adınız Soyadınız"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isAnonymous}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-orange-400 disabled:opacity-50"
                            />
                            
                            <div className="flex items-center justify-center my-1 relative">
                                <div className="absolute w-full h-px bg-gray-200"></div>
                                <span className="bg-white px-3 text-xs font-bold text-gray-400 uppercase tracking-widest relative z-10">Veya</span>
                            </div>

                            <input 
                                type="text" 
                                placeholder="@instagram kullanıcı adınız"
                                value={instagramUser}
                                onChange={(e) => setInstagramUser(e.target.value)}
                                disabled={isAnonymous}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-orange-400 disabled:opacity-50"
                            />
                        </div>

                        <textarea 
                            placeholder="Gönlünüzden geçen kısa bir not..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-orange-400 h-24 resize-none"
                        ></textarea>
                        
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-orange-50/50 border border-orange-100 hover:bg-orange-50 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faShieldHalved} className="text-orange-500"/> Bilgilerimi Gizle
                                </span>
                            </div>
                        </label>
                    </div>
                    
                    <div className="mt-8 flex gap-3">
                        <button onClick={() => setStep(1)} className="px-5 py-4 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <button onClick={handleSubmit} disabled={loading} className="flex-1 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg disabled:opacity-50">
                            {loading ? 'İşleniyor...' : 'Bağışımı Tamamla'}
                        </button>
                    </div>
                </div>
            )}

            {/* ADIM 3: Başarılı */}
            {step === 3 && (
                <div className="animate-fade-in bg-white rounded-3xl shadow-xl p-8 text-center border border-green-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FontAwesomeIcon icon={faCheck} className="text-4xl text-green-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Sonsuz Teşekkürler!</h3>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                        Yapmış olduğunuz bağış başarıyla kaydedildi. Bir çocuğun kışına güneş oldunuz.
                    </p>
                    <button onClick={resetForm} className="w-full py-4 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-colors">
                        Yeni Bağış Yap
                    </button>
                </div>
            )}

        </div>
    );
}