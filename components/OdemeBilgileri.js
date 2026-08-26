import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

function CopyableField({ label, value, note }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value.replace(/\s/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    {label && <span className="text-xs text-gray-500">{label}</span>}
                    <p className="font-semibold text-gray-800 break-all">{value}</p>
                </div>
                <button onClick={handleCopy} className="text-orange-500 p-2 rounded-lg hover:bg-orange-100 w-10 text-center flex-shrink-0 transition-colors">
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? 'text-green-500' : ''} />
                </button>
            </div>
            {/* ## GÖRSEL DÜZELTME BURADA ## */}
            {note && <div className="mt-3 border-t border-gray-100 pt-2"><p className="text-xs text-gray-500 italic">{note}</p></div>}
        </div>
    );
}

export default function OdemeBilgileri({ checkoutAmount, setStep }) {
    return (
        <div className="w-full max-w-sm animate-fade-in">
            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl shadow-md p-4 flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-800">Toplam Tutar</p>
                <p className="text-2xl font-bold text-orange-600">{(checkoutAmount || 0).toLocaleString('tr-TR')} TL</p>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Ödeme Bilgileri</h2>
            <div className="flex flex-col gap-4">
                <CopyableField 
                    value="Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği" 
                    note='Not: Alıcı adına kısaca "Çocuklar Üşümesin" yazabilirsiniz.' 
                />
                <CopyableField label="TL IBAN" value="TR36 0001 0011 5098 1058 3050 01" />
                <CopyableField label="USD IBAN" value="TR79 0001 0011 5098 1058 3050 03" />
                <CopyableField label="EURO IBAN" value="TR09 0001 0011 5098 1058 3050 02" />
            </div>
            <div className="mt-6 flex flex-col gap-2">
                <button onClick={() => setStep(3)} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all">
                    EFT/Havale Yaptım, Devam Et
                </button>
                <button onClick={() => setStep(1)} className="w-full text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
                    Geri Dön
                </button>
            </div>
        </div>
    );
}