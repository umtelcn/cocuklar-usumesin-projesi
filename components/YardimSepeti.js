import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons';

export default function YardimSepeti({
  urunler,
  loading,
  toplamAdet,
  toplamTutar,
  manualAmount,
  setManualAmount,
  handleUrunAdetChange,
  handleNextStep
}) {
  return (
    <div className="animate-fade-in">
      {/* Sepet Başlığı */}
      <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Yardım Sepeti</h2>
        <div className="relative">
          <FontAwesomeIcon icon={faCartShopping} className="text-2xl text-gray-400" />
          {toplamAdet > 0 && (
            <div className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              <span>{toplamAdet}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ürün Listesi */}
      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Ürünler yükleniyor...</p>
        ) : (
          urunler.map(urun => (
            <div key={urun.id} className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transition-shadow duration-300">
              <img src={urun.gorsel_yolu} alt={urun.ad} onError={(e) => e.target.src='https://via.placeholder.com/80'} className="w-20 h-20 object-cover rounded-xl" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{urun.ad}</h3>
                <p className="text-xl font-bold text-orange-600">{urun.fiyat} TL</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-gray-200 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors" onClick={() => handleUrunAdetChange(urun.id, -1)}>-</button>
                <span className="text-sm font-medium w-6 text-center">{urun.adet}</span>
                <button className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors" onClick={() => handleUrunAdetChange(urun.id, 1)}>+</button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Veya Bölümü */}
      <div className="flex items-center justify-center my-6">
        {/* ## GÖRSEL İYİLEŞTİRME ## */}
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="mx-4 text-sm text-gray-500 font-medium">veya</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>
      
      {/* Nakdi Bağış */}
      <div>
        <div className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-orange-600" /> Diğer Yardımlar
          </h3>
          <input 
            type="number" 
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            placeholder="Nakdi bağış miktarı (TL)" 
            // ## GÖRSEL İYİLEŞTİRME ##
            className="w-full mt-2 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          />
        </div>
      </div>
      
      {/* Toplam Tutar ve Ödeme Butonu */}
      <div className="sticky bottom-0 mt-6 pt-4 bg-gradient-to-t from-blue-50 to-transparent">
        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl shadow-md p-4 flex justify-between items-center mb-2">
          <p className="text-lg font-semibold text-gray-800">Toplam Tutar</p>
          <p className="text-2xl font-bold text-orange-600">
            {(toplamTutar || 0).toLocaleString('tr-TR')} TL
          </p>
        </div>
        {/* ## GÖRSEL İYİLEŞTİRME ## */}
        <button 
          onClick={handleNextStep} 
          disabled={toplamTutar === 0} 
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Ödemeye Geç
        </button>
      </div>
    </div>
  );
}