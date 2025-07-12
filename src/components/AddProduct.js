import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCheckCircle, FaUpload, FaEdit, FaTrash } from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const supabaseUrl = 'https://aoagoenbbsdhskebhmrq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYWdvZW5iYnNkaHNrZWJobXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMDA5MzksImV4cCI6MjA2NzY3NjkzOX0.8LohSV1ZaJSTl7Luo85NZjP0PMApfQy8C82cErfCRNQ';
const supabase = createClient(supabaseUrl, supabaseKey);

function AddProduct() {
  const [tab, setTab] = useState('add');
  const [formData, setFormData] = useState({ ad: '', fiyat: '', sira: '' });
  const [editFormData, setEditFormData] = useState({});
  const [file, setFile] = useState(null);
  const [products, setProducts] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Ürünleri çek
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('urunler')
        .select('*')
        .eq('aktif', true)
        .order('sira', { ascending: true });
      if (error) {
        console.error('Ürünler alınamadı:', error);
        setError(`Ürünler yüklenirken hata: ${error.message}`);
      } else {
        setProducts(data);
        // Her ürün için editFormData başlat
        const initialEditData = data.reduce((acc, product) => ({
          ...acc,
          [product.id]: { ad: product.ad, fiyat: product.fiyat, sira: product.sira },
        }), {});
        setEditFormData(initialEditData);
      }
    };
    fetchProducts();
  }, []);

  // Form güncelleme
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditFormChange = (id, e) => {
    setEditFormData({
      ...editFormData,
      [id]: { ...editFormData[id], [e.target.name]: e.target.value },
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Ürün ekle
  const saveProduct = async () => {
    if (!formData.ad || !formData.fiyat || !formData.sira || !file) {
      setError('Tüm alanları doldurun ve bir görsel seçin.');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('urun-gorselleri')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Görsel yüklenemedi:', uploadError);
      setError(`Görsel yüklenirken hata: ${uploadError.message}. Bucket 'urun-gorselleri' olduğundan emin olun.`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('urun-gorselleri')
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase
      .from('urunler')
      .insert({
        ad: formData.ad,
        fiyat: parseFloat(formData.fiyat),
        gorsel_yolu: urlData.publicUrl,
        sira: parseInt(formData.sira),
        aktif: true,
      });

    if (insertError) {
      console.error('Ürün kaydedilemedi:', insertError);
      setError(`Ürün kaydedilirken hata: ${insertError.message}`);
      return;
    }

    setShowSuccess(true);
    setFormData({ ad: '', fiyat: '', sira: '' });
    setFile(null);
    const { data } = await supabase
      .from('urunler')
      .select('*')
      .eq('aktif', true)
      .order('sira', { ascending: true });
    setProducts(data || []);
    setEditFormData(data.reduce((acc, product) => ({
      ...acc,
      [product.id]: { ad: product.ad, fiyat: product.fiyat, sira: product.sira },
    }), {}));
  };

  // Ürün düzenle
  const editProduct = async (id) => {
    const productData = editFormData[id];
    if (!productData.ad || !productData.fiyat || !productData.sira) {
      setError('Başlık, fiyat ve sıra zorunlu.');
      return;
    }

    const updateData = {
      ad: productData.ad,
      fiyat: parseFloat(productData.fiyat),
      sira: parseInt(productData.sira),
    };

    const { error } = await supabase
      .from('urunler')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Ürün güncellenemedi:', error);
      setError(`Ürün güncellenirken hata: ${error.message}`);
      return;
    }

    const { data } = await supabase
      .from('urunler')
      .select('*')
      .eq('aktif', true)
      .order('sira', { ascending: true });
    setProducts(data || []);
    setEditFormData(data.reduce((acc, product) => ({
      ...acc,
      [product.id]: { ad: product.ad, fiyat: product.fiyat, sira: product.sira },
    }), {}));
  };

  // Ürün sil
  const deleteProduct = async (id, gorsel_yolu) => {
    const fileName = gorsel_yolu.split('/').pop();
    const { error: deleteStorageError } = await supabase.storage
      .from('urun-gorselleri')
      .remove([fileName]);

    if (deleteStorageError) {
      console.error('Görsel silinemedi:', deleteStorageError);
      setError(`Görsel silinirken hata: ${deleteStorageError.message}`);
      return;
    }

    const { error } = await supabase
      .from('urunler')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ürün silinemedi:', error);
      setError(`Ürün silinirken hata: ${error.message}`);
      return;
    }

    const { data } = await supabase
      .from('urunler')
      .select('*')
      .eq('aktif', true)
      .order('sira', { ascending: true });
    setProducts(data || []);
    setEditFormData(data.reduce((acc, product) => ({
      ...acc,
      [product.id]: { ad: product.ad, fiyat: product.fiyat, sira: product.sira },
    }), {}));
  };

  // Sürükle-bırak sıralama
  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const reorderedProducts = Array.from(products);
    const [moved] = reorderedProducts.splice(result.source.index, 1);
    reorderedProducts.splice(result.destination.index, 0, moved);

    setProducts(reorderedProducts);

    const updates = reorderedProducts.map((product, index) => ({
      id: product.id,
      sira: index + 1,
    }));

    const { error } = await supabase
      .from('urunler')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error('Sıralama güncellenemedi:', error);
      setError(`Sıralama güncellenirken hata: ${error.message}`);
      const { data } = await supabase
        .from('urunler')
        .select('*')
        .eq('aktif', true)
        .order('sira', { ascending: true });
      setProducts(data || []);
      setEditFormData(data.reduce((acc, product) => ({
        ...acc,
        [product.id]: { ad: product.ad, fiyat: product.fiyat, sira: product.sira },
      }), {}));
    } else {
      setEditFormData(reorderedProducts.reduce((acc, product, index) => ({
        ...acc,
        [product.id]: { ad: product.ad, fiyat: product.fiyat, sira: index + 1 },
      }), {}));
    }
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
        Ürün Yönetimi
      </h2>
      <div className="w-full max-w-sm mt-6 flex gap-4">
        <button
          onClick={() => setTab('add')}
          className={`w-1/2 py-2 rounded-xl text-lg font-semibold ${
            tab === 'add'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Ürün Ekle
        </button>
        <button
          onClick={() => setTab('edit')}
          className={`w-1/2 py-2 rounded-xl text-lg font-semibold ${
            tab === 'edit'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Ürün Düzenle
        </button>
      </div>

      {/* Ürün Ekle */}
      {tab === 'add' && (
        <div className="w-full max-w-sm mt-6 bg-white rounded-xl shadow-md p-6">
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          <label className="block text-sm font-medium text-gray-700">
            Ürün Adı <span className="text-xs text-gray-500">(Zorunlu)</span>
          </label>
          <input
            type="text"
            name="ad"
            value={formData.ad}
            onChange={handleFormChange}
            placeholder="Örn: Battaniye"
            className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          />
          <label className="block mt-4 text-sm font-medium text-gray-700">
            Fiyat (TL) <span className="text-xs text-gray-500">(Zorunlu)</span>
          </label>
          <input
            type="number"
            name="fiyat"
            value={formData.fiyat}
            onChange={handleFormChange}
            placeholder="Örn: 100"
            className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          />
          <label className="block mt-4 text-sm font-medium text-gray-700">
            Görsel <span className="text-xs text-gray-500">(Zorunlu)</span>
          </label>
          <div className="relative mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 border rounded-xl bg-gray-50 opacity-0 absolute"
            />
            <div className="w-full p-3 border rounded-xl bg-gray-50 flex items-center justify-between">
              <span className="text-gray-500">{file ? file.name : 'Görsel seçin'}</span>
              <FaUpload className="text-orange-500" />
            </div>
          </div>
          <label className="block mt-4 text-sm font-medium text-gray-700">
            Sıra <span className="text-xs text-gray-500">(Zorunlu)</span>
          </label>
          <input
            type="number"
            name="sira"
            value={formData.sira}
            onChange={handleFormChange}
            placeholder="Örn: 1"
            className="w-full mt-2 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
          />
          <button
            onClick={saveProduct}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600"
          >
            Ürünü Ekle
          </button>
        </div>
      )}

      {/* Ürün Düzenle */}
      {tab === 'edit' && (
        <div className="w-full max-w-sm mt-6">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="products">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-4">
                  {products.map((product, index) => (
                    <Draggable key={product.id} draggableId={String(product.id)} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 hover:shadow-xl transition-shadow duration-300"
                        >
                          <img
                            src={product.gorsel_yolu}
                            alt={product.ad}
                            className="w-16 h-16 object-cover rounded-xl"
                            onError={(e) => (e.target.src = 'https://via.placeholder.com/64')}
                          />
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                              Ürün Adı
                            </label>
                            <input
                              type="text"
                              name="ad"
                              value={editFormData[product.id]?.ad || product.ad}
                              onChange={(e) => handleEditFormChange(product.id, e)}
                              className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
                            />
                            <label className="block mt-2 text-sm font-medium text-gray-700">
                              Fiyat (TL)
                            </label>
                            <input
                              type="number"
                              name="fiyat"
                              value={editFormData[product.id]?.fiyat || product.fiyat}
                              onChange={(e) => handleEditFormChange(product.id, e)}
                              className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
                            />
                            <label className="block mt-2 text-sm font-medium text-gray-700">
                              Sıra
                            </label>
                            <input
                              type="number"
                              name="sira"
                              value={editFormData[product.id]?.sira || product.sira}
                              onChange={(e) => handleEditFormChange(product.id, e)}
                              className="w-full mt-1 p-2 border rounded-lg bg-gray-50"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editProduct(product.id)}
                              className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id, product.gorsel_yolu)}
                              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}
        </div>
      )}

      {/* Başarı Modal’ı */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <FaCheckCircle className="text-5xl text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800 mt-4">Ürün Eklendi!</h2>
            <p className="text-lg text-gray-600 mt-2">
              Yeni ürün başarıyla eklendi. Teşekkür ederiz!
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

export default AddProduct;