import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sol Menü (Sidebar) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 p-1">
              <img src="/logo.png" alt="Logo" className="w-full h-full rounded-full object-cover" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {/* Aktif Linkler */}
          <Link href="/admin" className="block px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            📝 Hikaye / Gönderi Ekle
          </Link>
          <Link href="/admin/gonderiler" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            🗑️ Yüklenen Gönderiler
          </Link>

          {/* Yapım Aşamasındaki Linkler */}
          <div className="block px-4 py-3 text-sm font-medium text-gray-400 cursor-not-allowed hover:bg-gray-50 rounded-lg mt-4">
            💰 Bağış Yönetimi (Yakında)
          </div>
          <div className="block px-4 py-3 text-sm font-medium text-gray-400 cursor-not-allowed hover:bg-gray-50 rounded-lg">
            ⚙️ Site Ayarları (Yakında)
          </div>
        </nav>
      </aside>

      {/* Sağ İçerik Alanı */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}