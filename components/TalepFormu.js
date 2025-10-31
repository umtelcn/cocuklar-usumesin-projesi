import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPhotoFilm } from '@fortawesome/free-solid-svg-icons';

export default function TalepFormu({
    formData,
    setFormData,
    loading,
    iller,
    ilceler,
    handleIlChange,
    handleFileChange,
    handleSubmit,
    submissionStatus,
    fileInputRef
}) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Yardım Talebinde Bulun</h2>
                <p className="text-gray-500 mt-2">Desteğe ihtiyacınız varsa, formu doldurarak bize ulaşabilirsiniz.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="talep_ad" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                        {/* ## GÖRSEL İYİLEŞTİRME ## */}
                        <input type="text" id="talep_ad" value={formData.ad_soyad} onChange={e => setFormData({ ...formData, ad_soyad: e.target.value })} required className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label htmlFor="talep_telefon" className="block text-sm font-medium text-gray-700">Telefon Numarası</label>
                        {/* ## GÖRSEL İYİLEŞTİRME ## */}
                        <input type="tel" id="talep_telefon" value={formData.telefon} onChange={e => setFormData({ ...formData, telefon: e.target.value })} required className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="talep_il" className="block text-sm font-medium text-gray-700">İl</label>
                        {/* ## GÖRSEL İYİLEŞTİRME ## */}
                        <select id="talep_il" value={formData.il} onChange={handleIlChange} required className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
                            <option value="" disabled>İl Seçiniz</option>
                            {loading.iller ? <option>Yükleniyor...</option> : iller.map(il => <option key={il.id} value={il.name}>{il.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="talep_ilce" className="block text-sm font-medium text-gray-700">İlçe</label>
                        {/* ## GÖRSEL İYİLEŞTİRME ## */}
                        <select id="talep_ilce" value={formData.ilce} onChange={e => setFormData({ ...formData, ilce: e.target.value })} disabled={!formData.il || ilceler.length === 0} required className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-200">
                            <option value="" disabled>İlçe Seçiniz</option>
                            {ilceler.map(ilce => <option key={ilce.id} value={ilce.name}>{ilce.name}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="talep_mesaj" className="block text-sm font-medium text-gray-700">Mesajınız / Talep Detayları</label>
                    {/* ## GÖRSEL İYİLEŞTİRME ## */}
                    <textarea id="talep_mesaj" rows="4" value={formData.mesaj} onChange={e => setFormData({ ...formData, mesaj: e.target.value })} className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durumu Anlatan Görseller (İsteğe Bağlı)</label>
                    {/* ## GÖRSEL İYİLEŞTİRME ## */}
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                        <div className="text-center">
                            <FontAwesomeIcon icon={faPhotoFilm} className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label htmlFor="gorsel-input" className="relative cursor-pointer rounded-md bg-white font-semibold text-orange-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-600 focus-within:ring-offset-2 hover:text-orange-500">
                                    <span>Dosya yükleyin</span>
                                    <input id="gorsel-input" type="file" multiple onChange={handleFileChange} ref={fileInputRef} accept="image/*" className="sr-only" />
                                </label>
                                <p className="pl-1">veya sürükleyip bırakın</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">PNG, JPG, vb. en fazla 5MB</p>
                        </div>
                    </div>
                    {formData.gorseller && formData.gorseller.length > 0 && (
                         <div className="mt-4 grid grid-cols-3 gap-2">
                            {Array.from(formData.gorseller).map((file, index) => (
                                <div key={index} className="relative">
                                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full object-cover rounded-md" />
                                    <p className="absolute bottom-0 left-0 right-0 truncate bg-black bg-opacity-50 px-1 py-0.5 text-xs text-white">{file.name}</p>
                                </div>
                            ))}
                         </div>
                    )}
                </div>
                <button type="submit" disabled={loading.form} className="w-full bg-orange-500 text-white py-3 rounded-xl text-lg font-semibold hover:bg-orange-600 disabled:opacity-70 flex items-center justify-center">
                    {loading.form && <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />}
                    {loading.form ? 'Gönderiliyor...' : 'Talebi Gönder'}
                </button>
            </form>
            {submissionStatus.message && (
                <div className={`mt-4 text-center font-semibold ${submissionStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                    {submissionStatus.message}
                </div>
            )}
        </div>
    );
}