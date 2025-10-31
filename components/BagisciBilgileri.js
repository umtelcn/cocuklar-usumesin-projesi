import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function BagisciBilgileri({
  donationFormData,
  setDonationFormData,
  saveDonation,
  loading,
  setStep
}) {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDonationFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Değerli Desteğiniz İçin Teşekkürler!</h2>
      <p className="text-gray-600 mt-2">Dilerseniz aşağıdaki bilgileri doldurarak adınızı "İyilik Hareketimiz" bölümünde yayınlatabilirsiniz.</p>
      
      <div className="mt-6 bg-white rounded-xl shadow-md p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
          <input 
            id="name"
            name="name" 
            type="text" 
            value={donationFormData.name}
            onChange={handleInputChange}
            placeholder="Adınız Soyadınız" 
            className="w-full mt-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          />
        </div>

        <div className="flex items-center justify-center my-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="mx-4 text-xs text-gray-400 font-medium">veya</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">Instagram Kullanıcı Adı</label>
          <input 
            id="instagram"
            name="instagram"
            type="text"
            value={donationFormData.instagram}
            onChange={handleInputChange} 
            placeholder="@kullaniciadi" 
            className="w-full mt-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          />
        </div>
        
        <div className="mt-4 flex items-center">
          <input 
            id="isAnonymous" 
            name="isAnonymous"
            type="checkbox"
            checked={donationFormData.isAnonymous}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">Bilgilerimi bağış listesinde gizle</label>
        </div>

        {/* ## GÖRSEL DÜZELTME BURADA ## */}
        <div className="my-6 border-t border-gray-100"></div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mesajınız <span className="text-xs text-gray-500">(İsteğe bağlı)</span></label>
          <textarea 
            id="message" 
            name="message"
            value={donationFormData.message}
            onChange={handleInputChange}
            placeholder="Mesajınızı buraya yazın" 
            rows="4" 
            className="w-full mt-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          ></textarea>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button onClick={saveDonation} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-70 flex items-center justify-center transition-all">
          {loading && <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />}
          {loading ? 'Kaydediliyor...' : 'Tamamla ve Teşekkür Kartını Gör'}
        </button>
        <button onClick={() => setStep(2)} className="w-full text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors">
            Geri Dön
        </button>
      </div>
    </div>
  );
}