import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCheckCircle, FaUpload, FaSpinner, FaTrash } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function RequestHelp() {
  const [formData, setFormData] = useState({
    ad_soyad: '',
    sehir: '',
    ilce: '',
    telefon: '',
    mesaj: '',
  });
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sehirler, setSehirler] = useState([]);
  const [ilceler, setIlceler] = useState([]);
  const navigate = useNavigate();

  // Şehirleri çek
  useEffect(() => {
    const fetchSehirler = async () => {
      const { data, error } = await supabase
        .from('iller')
        .select('id, ad')
        .order('ad', { ascending: true });
      if (error) {
        console.error('Şehirler alınamadı:', error);
        setErrors((prev) => ({ ...prev, genel: 'Şehirler yüklenirken hata oluştu.' }));
      } else {
        setSehirler(data);
      }
    };
    fetchSehirler();
  }, []);

  // İlçeleri çek
  useEffect(() => {
    const fetchIlceler = async () => {
      if (formData.sehir) {
        const selectedSehir = sehirler.find((s) => s.ad === formData.sehir);
        if (selectedSehir) {
          const { data, error } = await supabase
            .from('ilceler')
            .select('id, ad')
            .eq('il_id', selectedSehir.id)
            .order('ad', { ascending: true });
          if (error) {
            console.error('İlçeler alınamadı:', error);
            setErrors((prev) => ({ ...prev, genel: 'İlçeler yüklenirken hata oluştu.' }));
          } else {
            setIlceler(data);
            setFormData((prev) => ({ ...prev, ilce: '' }));
          }
        }
      } else {
        setIlceler([]);
      }
    };
    fetchIlceler();
  }, [formData.sehir, sehirler]);

  // Form güncelleme
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Görsel seçimi ve önizleme
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      setErrors((prev) => ({ ...prev, gorsel: 'En fazla 5 görsel yüklenebilir.' }));
      return;
    }
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    setErrors((prev) => ({ ...prev, gorsel: '' }));

    const previews = newFiles.map((file) => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(previews).then((results) => setFilePreviews(results));
  };

  // Görsel silme
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, gorsel: '' }));
  };

  // Form gönderimi
  const submitRequest = async () => {
    const newErrors = {};
    if (!formData.sehir) newErrors.sehir = 'Şehir seçimi zorunlu.';
    if (!formData.ilce) newErrors.ilce = 'İlçe seçimi zorunlu.';
    if (!formData.telefon) newErrors.telefon = 'Telefon numarası zorunlu.';
    else if (!/^[0-9]{10}$/.test(formData.telefon)) newErrors.telefon = 'Geçerli bir 10 haneli telefon numarası girin (örneğin: 5551234567).';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Yardım talebini kaydet
    const selectedSehir = sehirler.find((s) => s.ad === formData.sehir);
    const selectedIlce = ilceler.find((i) => i.ad === formData.ilce);
    const { data: talepData, error: insertError } = await supabase
      .from('yardim_talepleri')
      .insert({
        ad_soyad: formData.ad_soyad,
        il_id: selectedSehir?.id,
        ilce_id: selectedIlce?.id,
        telefon: formData.telefon,
        mesaj: formData.mesaj,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Talep kaydedilemedi:', insertError);
      setErrors({ genel: `Talep kaydedilirken hata: ${insertError.message}` });
      setLoading(false);
      return;
    }

    // Görselleri kaydet
    const gorselYollari = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('yardim-talepleri')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Görsel yüklenemedi:', uploadError);
        setErrors({ genel: `Görsel yüklenirken hata: ${uploadError.message}. Bucket 'yardim-talepleri' olduğundan emin olun.` });
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('yardim-talepleri')
        .getPublicUrl(fileName);
      gorselYollari.push({ talep_id: talepData.id, gorsel_yolu: urlData.publicUrl });
    }

    if (gorselYollari.length > 0) {
      const { error: gorselError } = await supabase
        .from('yardim_talepleri_gorseller')
        .insert(gorselYollari);

      if (gorselError) {
        console.error('Görseller kaydedilemedi:', gorselError);
        setErrors({ genel: `Görseller kaydedilirken hata: ${gorselError.message}` });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setShowSuccess(true);
    setFormData({ ad_soyad: '', sehir: '', ilce: '', telefon: '', mesaj: '' });
    setFiles([]);
    setFilePreviews([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center px-4">
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-full shadow-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
      >
        <FaArrowLeft className="text-xl" />
      </button>
      <h2 className="text-2xl font-bold text-gray-800 mt-8 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
        Yardım Talebinde Bulun
      </h2>
      <div className="w-full max-w-sm mt-6 bg-white rounded-xl shadow-md p-6">
        {errors.genel && (
          <p className="text-red-500 text-sm mb-4">{errors.genel}</p>
        )}
        <label className="block text-sm font-medium text-gray-700">
          Ad Soyad <span className="text-xs text-gray-500">(Zorunlu değil)</span>
        </label>
        <input
          type="text"
          name="ad_soyad"
          value={formData.ad_soyad}
          onChange={handleFormChange}
          placeholder="Adınız Soyadınız"
          className={`w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200 ${errors.ad_soyad ? 'border-red-500' : ''}`}
        />
        {errors.ad_soyad && <p className="text-red-500 text-xs mt-1">{errors.ad_soyad}</p>}
        <label className="block mt-4 text-sm font-medium text-gray-700">
          Şehir <span className="text-xs text-gray-500">(Zorunlu)</span>
        </label>
        <select
          name="sehir"
          value={formData.sehir}
          onChange={handleFormChange}
          className={`w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200 ${errors.sehir ? 'border-red-500' : ''}`}
        >
          <option value="">Şehir seçin</option>
          {sehirler.map((sehir) => (
            <option key={sehir.id} value={sehir.ad}>{sehir.ad}</option>
          ))}
        </select>
        {errors.sehir && <p className="text-red-500 text-xs mt-1">{errors.sehir}</p>}
        <label className="block mt-4 text-sm font-medium text-gray-700">
          İlçe <span className="text-xs text-gray-500">(Zorunlu)</span>
        </label>
        <select
          name="ilce"
          value={formData.ilce}
          onChange={handleFormChange}
          className={`w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200 ${errors.ilce ? 'border-red-500' : ''}`}
          disabled={!formData.sehir}
        >
          <option value="">İlçe seçin</option>
          {ilceler.map((ilce) => (
            <option key={ilce.id} value={ilce.ad}>{ilce.ad}</option>
          ))}
        </select>
        {errors.ilce && <p className="text-red-500 text-xs mt-1">{errors.ilce}</p>}
        <label className="block mt-4 text-sm font-medium text-gray-700">
          Telefon Numarası <span className="text-xs text-gray-500">(Zorunlu)</span>
        </label>
        <input
          type="tel"
          name="telefon"
          value={formData.telefon}
          onChange={handleFormChange}
          placeholder="Örn: 5551234567"
          className={`w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200 ${errors.telefon ? 'border-red-500' : ''}`}
        />
        {errors.telefon && <p className="text-red-500 text-xs mt-1">{errors.telefon}</p>}
        <label className="block mt-4 text-sm font-medium text-gray-700">
          Mesajınız <span className="text-xs text-gray-500">(Zorunlu değil)</span>
        </label>
        <textarea
          name="mesaj"
          value={formData.mesaj}
          onChange={handleFormChange}
          placeholder="Yardım talebinizi açıklayın"
          className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 transition-all duration-200"
          rows="4"
        />
        <label className="block mt-4 text-sm font-medium text-gray-700">
          Görseller <span className="text-xs text-gray-500">(En fazla 5, isteğe bağlı)</span>
        </label>
        <div className="relative mt-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="w-full p-3 border rounded-xl bg-gray-50 opacity-0 absolute"
          />
          <div className={`w-full p-3 border rounded-xl bg-gray-50 flex items-center justify-between ${errors.gorsel ? 'border-red-500' : ''}`}>
            <span className="text-gray-500">{files.length > 0 ? `${files.length} görsel seçildi` : 'Görsel seçin'}</span>
            <FaUpload className="text-orange-500" />
          </div>
        </div>
        {errors.gorsel && <p className="text-red-500 text-xs mt-1">{errors.gorsel}</p>}
        {filePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {filePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img src={preview} alt={`Önizleme ${index + 1}`} className="w-full h-20 object-cover rounded-xl" />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={submitRequest}
          className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 flex items-center justify-center"
          disabled={loading}
        >
          {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
          {loading ? 'Gönderiliyor...' : 'Talebi Gönder'}
        </button>
      </div>

      {/* Başarı Modal’ı */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <FaCheckCircle className="text-5xl text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800 mt-4">Talep Gönderildi!</h2>
            <p className="text-lg text-gray-600 mt-2">
              Yardım talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600"
            >
              Anasayfaya Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestHelp;
