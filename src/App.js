import './App.css';
import { FaHeart, FaHandHoldingHeart, FaStar } from 'react-icons/fa';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HelpPage from './components/HelpPage';
import AddProduct from './components/AddProduct';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center">
              <div className="w-full max-w-sm overflow-hidden rounded-3xl mt-12">
                <img
                  src="/logo.png"
                  alt="Çocuklar Üşümesin"
                  className="w-full h-80 object-cover"
                />
              </div>
              <div className="w-full max-w-sm text-center px-4 mt-8">
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text font-['Poppins'] shadow-sm whitespace-nowrap">
                  Çocuklar Üşümesin
                </h1>
                <p className="text-lg text-gray-600 mt-4 font-medium">
                  Sevgiyle ısıtalım, umutla saralım!
                </p>
              </div>
              <div className="w-full max-w-sm flex flex-col gap-4 mt-6 px-4 pb-8">
                <div className="bg-orange-500 text-white rounded-xl shadow-lg p-4 transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3">
                    <FaHeart className="text-3xl" />
                    <div>
                      <h2 className="text-lg font-semibold">Yardım Et</h2>
                      <p className="text-sm mt-1">Bağışınla bir çocuğu ısıt!</p>
                    </div>
                  </div>
                  <Link
                    to="/help"
                    className="w-full bg-white text-orange-500 py-1.5 rounded-lg mt-3 font-medium hover:bg-gray-100 block text-center"
                  >
                    Şimdi Bağış Yap
                  </Link>
                </div>
                <div className="bg-gray-50 text-gray-800 rounded-xl shadow-md p-4 transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3">
                    <FaHandHoldingHeart className="text-3xl text-gray-600" />
                    <div>
                      <h2 className="text-lg font-semibold">Yardım Talebinde Bulun</h2>
                      <p className="text-sm mt-1">İhtiyacın varsa, hemen başvur!</p>
                    </div>
                  </div>
                  <button className="w-full bg-gray-200 text-gray-800 py-1.5 rounded-lg mt-3 font-medium hover:bg-gray-300">
                    Başvur
                  </button>
                </div>
                <div className="bg-gray-50 text-gray-800 rounded-xl shadow-md p-4 transform hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3">
                    <FaStar className="text-3xl text-gray-600" />
                    <div>
                      <h2 className="text-lg font-semibold">Gönüllü Ol</h2>
                      <p className="text-sm mt-1">Ekibimize katıl, değişim yarat!</p>
                    </div>
                  </div>
                  <button className="w-full bg-gray-200 text-gray-800 py-1.5 rounded-lg mt-3 font-medium hover:bg-gray-300">
                    Katıl
                  </button>
                </div>
              </div>
            </div>
          }
        />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/admin-add-product" element={<AddProduct />} />
      </Routes>
    </Router>
  );
}

export default App;