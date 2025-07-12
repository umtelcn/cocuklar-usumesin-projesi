import './App.css';
import { FaHeart, FaHandHoldingHeart, FaStar, FaShoppingBasket, FaCreditCard, FaCheckCircle, FaCopy, FaArrowLeft, FaComment, FaInstagram } from 'react-icons/fa';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import AddProduct from './components/AddProduct';
import RequestHelp from './components/RequestHelp';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://aoagoenbbsdhskebhmrq.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYWdvZW5iYnNkaHNrZWJobXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMDA5MzksImV4cCI6MjA2NzY3NjkzOX0.8LohSV1ZaJSTl7Luo85NZjP0PMApfQy8C82cErfCRNQ';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState([]);
  const [manualAmount, setManualAmount] = useState('');
  const [formData, setFormData] = useState({ name: '', instagram: '', message: '' });
  const [products, setProducts] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);

  // Verileri çek
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('urunler')
        .select('*')
        .eq('aktif', true)
        .order('sira', { ascending: true });
      if (productsError) console.error('Ürünler alınamadı:', productsError);
      else setProducts(productsData);

      const { data: donationsData, error: donationsError } = await supabase
        .from('bagislar')
        .select(`
          id,
          ad_soyad,
          instagram_kullanici_adi,
          nakdi_tutar,
          mesaj,
          bagis_detaylari (
            urun_id,
            adet,
            urunler (ad)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      if (donationsError) console.error('Bağışlar alınamadı:', donationsError);
      else setRecentDonations(donationsData);

      setLoading(false);
    };
    fetchData();
  }, []);

  // Toplam tutar
  const totalAmount = cart.reduce((sum, item) => sum + item.o_anki_fiyat * item.quantity, 0) +
    (manualAmount ? parseFloat(manualAmount) || 0 : 0);

  // Sepete ekle
  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, o_anki_fiyat: product.fiyat }]);
    }
  };

  // Sepetten çıkar
  const removeFromCart = (productId) => {
    const existing = cart.find((item) => item.id === productId);
    if (existing.quantity === 1) {
      setCart(cart.filter((item) => item.id !== productId));
    } else {
      setCart(cart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    }
  };

  // Form güncelleme
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Kopyala fonksiyonu
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Kopyalandı!');
    });
  };

  // Bağış kaydet
  const saveDonation = async () => {
    const { data: donation, error: donationError } = await supabase
      .from('bagislar')
      .insert({
        ad_soyad: formData.name,
        instagram_kullanici_adi: formData.instagram,
        nakdi_tutar: manualAmount ? parseFloat(manualAmount) : 0,
        toplam_tutar: totalAmount,
        mesaj: formData.message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (donationError) {
      console.error('Bağış kaydedilemedi:', donationError);
      return false;
    }

    const bagisDetaylari = cart.map((item) => ({
      bagis_id: donation.id,
      urun_id: item.id,
      adet: item.quantity,
      o_anki_fiyat: item.o_anki_fiyat,
    }));

    if (bagisDetaylari.length > 0) {
      const { error: detailsError } = await supabase
        .from('bagis_detaylari')
        .insert(bagisDetaylari);
      if (detailsError) {
        console.error('Bağış detayları kaydedilemedi:', detailsError);
        return false;
      }
    }

    return true;
  };

  // Geri dönme fonksiyonu
  const goBack = () => {
    if (showThankYou) {
      setShowThankYou(false);
      setStep(1);
      setCart([]);
      setManualAmount('');
      setFormData({ name: '', instagram: '', message: '' });
    } else if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center px-6 pb-12">
              {/* Logo ve Slogan */}
              <div className="w-full max-w-sm overflow-hidden rounded-3xl mt-12 shadow-lg">
                <img
                  src="/logo.png"
                  alt="Çocuklar Üşümesin"
                  className="w-full h-80 object-cover"
                />
              </div>
              <div className="w-full max-w-sm text-center mt-8">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text font-['Poppins'] shadow-sm whitespace-nowrap">
                  Çocuklar Üşümesin
                </h1>
                <p className="text-xl text-gray-600 mt-4 font-medium">
                  Sevgiyle ısıtalım, umutla saralım!
                </p>
              </div>

              {/* Yardım Sepeti */}
              <div className="w-full max-w-sm mt-12">
                {step !== 1 && (
                  <button
                    onClick={goBack}
                    className="fixed top-4 left-4 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                  >
                    <FaArrowLeft className="text-xl" />
                  </button>
                )}
                {step === 1 && (
                  <div>
                    {/* Başlık Kartı - Daha sade bir arka plan ile */}
                    <div className="flex items-center gap-3 bg-orange-100 rounded-2xl p-4 shadow-lg">
                      <FaShoppingBasket className="text-4xl text-orange-600" />
                      <h2 className="text-2xl font-extrabold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                        Yardım Sepeti
                      </h2>
                    </div>
                    {loading ? (
                      <p className="mt-6 text-gray-600 text-center">Yükleniyor...</p>
                    ) : (
                      <>
                        <div className="mt-6 flex flex-col gap-4">
                          {products.map((product) => (
                            <div
                              key={product.id}
                              // Tutarlı hover efekti eklendi
                              className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full"
                            >
                              <img
                                src={product.gorsel_yolu}
                                alt={product.ad}
                                className="w-20 h-20 object-cover rounded-xl"
                                onError={(e) => (e.target.src = 'https://via.placeholder.com/80')}
                              />
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">{product.ad}</h3>
                                <p className="text-xl font-bold text-orange-600">{product.fiyat} TL</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => removeFromCart(product.id)}
                                  className="bg-gray-200 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all duration-200"
                                  disabled={!cart.find((item) => item.id === product.id)}
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium">
                                  {cart.find((item) => item.id === product.id)?.quantity || 0}
                                </span>
                                <button
                                  onClick={() => addToCart(product)}
                                  className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all duration-200"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 flex items-center justify-center">
                          <div className="flex-1 h-px bg-gray-300"></div>
                          <span className="mx-4 text-sm text-gray-600 font-medium">veya</span>
                          <div className="flex-1 h-px bg-gray-300"></div>
                        </div>
                        <div className="mt-4">
                          <div className="bg-white rounded-2xl shadow-lg p-4 transform hover:scale-105 hover:shadow-xl transition-all duration-300 w-full">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <FaHandHoldingHeart className="text-orange-600" /> Diğer Yardımlar
                            </h3>
                            <input
                              type="number"
                              value={manualAmount}
                              onChange={(e) => setManualAmount(e.target.value)}
                              placeholder="Bağış miktarı (TL)"
                              className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200"
                            />
                          </div>
                        </div>
                        <div className="mt-6 bg-orange-100 rounded-2xl shadow-lg p-4 flex justify-between items-center">
                          <p className="text-lg font-semibold text-gray-800">Toplam Tutar</p>
                          <p className="text-2xl font-bold text-orange-600">{totalAmount.toLocaleString('tr-TR')} TL</p>
                        </div>
                        <button
                          onClick={() => setStep(2)}
                          className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                          disabled={cart.length === 0 && !manualAmount}
                        >
                          Ödemeye Geç
                        </button>
                        <div className="mt-12">
                          <div className="flex items-center gap-3 mb-4">
                            <FaHeart className="text-3xl text-orange-600" />
                            <h3 className="text-xl font-semibold text-gray-800">Son Yapılan Yardımlar</h3>
                          </div>
                          <div className="flex flex-col gap-3">
                            {recentDonations.map((donation) => (
                              <div
                                key={donation.id}
                                // Tutarlı hover efekti eklendi
                                className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-4 transform hover:scale-105 hover:shadow-xl transition-all duration-300 w-full"
                              >
                                <div className="flex items-center gap-3">
                                  <FaHandHoldingHeart className="text-orange-500 text-xl flex-shrink-0" />
                                  {donation.instagram_kullanici_adi ? (
                                    <a
                                      href={`https://instagram.com/${donation.instagram_kullanici_adi.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-blue-600 hover:underline"
                                    >
                                      <FaInstagram />
                                      <span className="font-semibold">{donation.instagram_kullanici_adi}</span>
                                    </a>
                                  ) : (
                                    <p className="font-semibold text-gray-800">{donation.ad_soyad || 'Anonim Bağışçı'}</p>
                                  )}
                                </div>
                                {(donation.bagis_detaylari?.length > 0 || donation.nakdi_tutar > 0) && (
                                  <div className="flex items-start gap-3 pl-1 border-t pt-4">
                                    <FaShoppingBasket className="text-orange-500 text-xl mt-1 flex-shrink-0" />
                                    <div className="flex flex-col gap-1">
                                      {donation.bagis_detaylari.map((detay, index) => (
                                        <p key={index} className="text-gray-700">
                                          {detay.adet} adet {detay.urunler.ad}
                                        </p>
                                      ))}
                                      {donation.nakdi_tutar > 0 && (
                                        <p className="text-gray-700 font-medium">
                                          {donation.nakdi_tutar.toLocaleString('tr-TR')} TL Nakdi Bağış
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {donation.mesaj && (
                                  <div className="bg-orange-50 p-3 rounded-lg flex items-start gap-3 mt-2">
                                    <FaComment className="text-orange-500 text-lg mt-1 flex-shrink-0" />
                                    <p className="text-gray-600 italic">"{donation.mesaj}"</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="w-full max-w-sm mt-12">
                    <div className="bg-orange-100 rounded-2xl shadow-lg p-4 flex justify-between items-center">
                      <p className="text-lg font-semibold text-gray-800">Toplam Tutar</p>
                      <p className="text-2xl font-bold text-orange-600">{totalAmount.toLocaleString('tr-TR')} TL</p>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mt-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">Ödeme Bilgileri</h2>
                    <div className="mt-4 flex flex-col gap-4">
                      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-800">
                          Alıcı: Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği
                        </p>
                        <button
                          onClick={() => copyToClipboard('Çocuklar Üşümesin Yardımlaşma ve Dayanışma Derneği')}
                          className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-all duration-200"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl shadow-lg p-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">
                          TL IBAN: TR36 0001 0011 5098 1058 3050 01
                        </p>
                        <button
                          onClick={() => copyToClipboard('TR36 0001 0011 5098 1058 3050 01')}
                          className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 transition-all duration-200"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">USD IBAN: TR79 0001 0011 5098 1058 3050 03</p>
                        <button
                          onClick={() => copyToClipboard('TR79 0001 0011 5098 1058 3050 03')}
                          className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-all duration-200"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between">
                        <p className="text-sm text-gray-600">EUR IBAN: TR09 0001 0011 5098 1058 3050 02</p>
                        <button
                          onClick={() => copyToClipboard('TR09 0001 0011 5098 1058 3050 02')}
                          className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition-all duration-200"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 text-center">Not: Alıcı kısmına kısaca "Çocuklar Üşümesin" yazabilirsiniz.</p>
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                    >
                      EFT/Havale Yaptım, Devam Et
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="w-full mt-2 bg-gray-200 text-gray-800 py-3 rounded-xl text-lg font-semibold hover:bg-gray-300 transition-all duration-300 flex items-center justify-center"
                    >
                      <FaArrowLeft className="mr-2" /> Geri
                    </button>
                  </div>
                )}

                {step === 3 && !showThankYou && (
                  <div className="w-full max-w-sm mt-12">
                    <h2 className="text-2xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">Teşekkürler!</h2>
                    <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ad Soyad <span className="text-xs text-gray-500">(İsteğe bağlı)</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Adınız Soyadınız"
                        className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200"
                      />
                      <div className="flex items-center my-4">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="mx-2 text-sm text-gray-600">veya</span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                      <label className="block text-sm font-medium text-gray-700">
                        Instagram Kullanıcı Adı <span className="text-xs text-gray-500">(İsteğe bağlı)</span>
                      </label>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleFormChange}
                        placeholder="@kullaniciadi"
                        className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200"
                      />
                      <label className="block mt-4 text-sm font-medium text-gray-700">
                        Mesajınız <span className="text-xs text-gray-500">(İsteğe bağlı)</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleFormChange}
                        placeholder="Mesajınızı buraya yazın"
                        className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200"
                        rows="4"
                      />
                      <button
                        onClick={async () => {
                          const success = await saveDonation();
                          if (success) {
                            setShowThankYou(true);
                          } else {
                            alert('Bağış kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
                          }
                        }}
                        className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                      >
                        Tamamlandı
                      </button>
                      <button
                        onClick={() => setStep(2)}
                        className="w-full mt-2 bg-gray-200 text-gray-800 py-3 rounded-xl text-lg font-semibold hover:bg-gray-300 transition-all duration-300 flex items-center justify-center"
                      >
                        <FaArrowLeft className="mr-2" /> Geri
                      </button>
                    </div>
                  </div>
                )}

                {showThankYou && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl m-4">
                      <FaCheckCircle className="text-5xl text-green-500 mx-auto" />
                      <h2 className="text-2xl font-bold text-gray-800 mt-4">Teşekkür Ederiz!</h2>
                      <p className="text-lg text-gray-600 mt-2">
                        Bağışınızla bir çocuğun gülüşünü ısıttınız! Desteğiniz bizim için çok değerli.
                      </p>
                      <button
                        onClick={() => {
                          setShowThankYou(false);
                          setStep(1);
                          setCart([]);
                          setManualAmount('');
                          setFormData({ name: '', instagram: '', message: '' });
                        }}
                        className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                      >
                        Anasayfaya Dön
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Yardım Talebi ve Gönüllü Ol Butonları */}
              <div className="w-full max-w-sm flex flex-col gap-4 mt-12 px-4 pb-12">
                <div className="bg-gray-50 rounded-2xl shadow-lg p-4 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <FaHandHoldingHeart className="text-3xl text-orange-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Yardım Talebinde Bulun</h2>
                      <p className="text-sm mt-1 text-gray-600">İhtiyacın varsa, hemen başvur!</p>
                    </div>
                  </div>
                  <Link
                    to="/request-help"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-xl mt-3 font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 block text-center"
                  >
                    Başvur
                  </Link>
                </div>
                <div className="bg-gray-50 rounded-2xl shadow-lg p-4 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <FaStar className="text-3xl text-orange-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Gönüllü Ol</h2>
                      <p className="text-sm mt-1 text-gray-600">Ekibimize katıl, değişim yarat!</p>
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-xl mt-3 font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300">
                    Katıl
                  </button>
                </div>
              </div>
            </div>
          }
        />
        <Route path="/admin-add-product" element={<AddProduct />} />
        <Route path="/request-help" element={<RequestHelp />} />
      </Routes>
    </Router>
  );
}

export default App;