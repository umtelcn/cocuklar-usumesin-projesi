import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faHandHoldingHeart, faBasketShopping, faComment } from '@fortawesome/free-solid-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';

export default function SonBagislar({ donations, loading }) {
  return (
    <div className="w-full max-w-sm mt-16">
      {/* Başlık */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full shadow-lg">
          <FontAwesomeIcon icon={faShieldHalved} className="text-4xl text-white" />
        </div>
        <h3 className="mt-4 text-2xl font-extrabold text-gray-800">İyilik Hareketimiz</h3>
        <p className="mt-1 text-sm text-gray-500">Desteğinizle hayalleri gerçeğe dönüştürüyoruz.</p>
      </div>

      {/* Bağış Listesi */}
      <div className="mt-6">
        {loading && <p className="text-center text-gray-500 py-4">Son bağışlar yükleniyor...</p>}
        {!loading && donations.length === 0 && <p className="text-center text-gray-500 py-4">Henüz görüntülenecek bağış yok.</p>}
        
        <div className="flex flex-col gap-3">
          {!loading && donations.map(donation => (
            <div key={donation.id} className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-4 hover:shadow-xl transition-shadow duration-300">
              
              {/* Bağışçı Bilgisi */}
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faHandHoldingHeart} className="text-orange-500 text-xl flex-shrink-0" />
                {donation.is_anonymous ? (
                  <p className="font-semibold text-gray-800">Anonim Bağışçı</p>
                ) : (
                  donation.instagram_kullanici_adi ? (
                    <a href={`https://instagram.com/${donation.instagram_kullanici_adi.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      <FontAwesomeIcon icon={faInstagram} />
                      <span className="font-semibold">{donation.instagram_kullanici_adi}</span>
                    </a>
                  ) : (
                    <p className="font-semibold text-gray-800">{donation.ad_soyad || 'Anonim Bağışçı'}</p>
                  )
                )}
              </div>
              
              {/* Bağış Detayları (Ürün veya Nakdi) */}
              {(donation.bagis_detaylari?.length > 0 || donation.nakdi_tutar > 0) && (
                // ## İYİLEŞTİRME BURADA ##
                // Kenarlık rengini çok açık bir gri (`border-gray-100`) yaparak daha yumuşak bir ayrım sağlıyoruz.
                <div className="flex items-start gap-3 pl-1 border-t border-gray-100 pt-4"> 
                  <FontAwesomeIcon icon={faBasketShopping} className="text-orange-500 text-xl mt-1 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    {donation.bagis_detaylari.map(detay => (
                      <p key={detay.id} className="text-gray-700">{`${detay.adet} adet ${detay.urunler.ad}`}</p>
                    ))}
                    {donation.nakdi_tutar > 0 && (
                      <p className="text-gray-700 font-medium">{`${donation.nakdi_tutar.toLocaleString('tr-TR')} TL Nakdi Bağış`}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Mesaj */}
              {donation.mesaj && (
                <div className="bg-orange-50 p-3 rounded-lg flex items-start gap-3 mt-2">
                  <FontAwesomeIcon icon={faComment} className="text-orange-500 text-lg mt-1 flex-shrink-0" />
                  <p className="text-gray-600 italic">{`"${donation.mesaj}"`}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}