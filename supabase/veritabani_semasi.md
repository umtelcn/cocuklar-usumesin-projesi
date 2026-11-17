# 🗄️ Çocuklar Üşümesin — Supabase Veritabanı Şeması (AI Referans Belgesi)

> **Son Güncelleme:** 2026-11-16 20:40:17  
> **Amaç:** Bu belge, projede çalışan yapay zeka ajanlarının (AI Agents) Supabase veritabanındaki tüm tabloları, sütun tiplerini, RPC fonksiyonlarını ve Storage klasörlerini hatasız tanıması için otomatik üretilmiştir.

---

## 🗂️ 1. Storage Klasörleri (Buckets)

- **`urun-gorselleri`** — Public (Herkese Açık)
- **`talep-gorselleri`** — Public (Herkese Açık)
- **`gorseler`** — Public (Herkese Açık)
- **`hikayeler`** — Public (Herkese Açık)

---

## ⚙️ 2. Veritabanı Fonksiyonları (RPC)

- **`supabase.rpc('goruntulenme_artir')`**
- **`supabase.rpc('site_ziyaret_artir')`**

---

## 📦 3. Tablolar ve Sütun Yapıları (Toplam 13 Tablo)

### 📌 Tablo: `public.bagis_detaylari` *(Kayıt Sayısı: 17289)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `bigint` | 🔑 PK |  |
| `bagis_id` | `bigint` | Evet | Note: This is a Foreign Key to `bagislar.id`.<fk table='bagislar' column='id'/> |
| `urun_id` | `bigint` | Evet | Note: This is a Foreign Key to `urunler.id`.<fk table='urunler' column='id'/> |
| `adet` | `integer` | Evet |  |
| `o_anki_fiyat` | `integer` | Evet | Bağış yapıldığı andaki tek bir ürünün fiyatı. |

### 📌 Tablo: `public.bagis_gizli_bilgiler` *(Kayıt Sayısı: 168)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `bagis_id` | `bigint` | 🔑 PK |  |
| `gercek_ad_soyad` | `text` | Evet |  |
| `created_at` | `timestamp with time zone` | Evet | Default: `now()` |

### 📌 Tablo: `public.bagislar` *(Kayıt Sayısı: 22929)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `bigint` | 🔑 PK |  |
| `created_at` | `timestamp with time zone` | Evet | Default: `now()` |
| `ad_soyad` | `text` | Hayır |  |
| `instagram_kullanici_adi` | `text` | Hayır |  |
| `mesaj` | `text` | Hayır |  |
| `nakdi_tutar` | `integer` | Evet | Default: `0` Doğrudan girilen nakdi bağış miktarı. |
| `toplam_tutar` | `integer` | Evet | Ürünlerin o anki fiyatları üzerinden hesaplanan toplam sepet tutarı + nakdi tutar. |
| `is_anonymous` | `boolean` | Hayır | Default: `False` |

### 📌 Tablo: `public.gerceklesen_dilekler` *(Kayıt Sayısı: 5)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `uuid` | 🔑 PK | Default: `gen_random_uuid()` |
| `baslik` | `text` | Evet |  |
| `kisa_ozet` | `text` | Evet |  |
| `uzun_metin` | `text` | Evet |  |
| `kapak_gorseli` | `text` | Evet |  |
| `medya_url` | `text[]` | Hayır |  |
| `created_at` | `timestamp with time zone` | Hayır | Default: `now()` |
| `goruntulenme` | `integer` | Hayır | Default: `0` |
| `sira` | `integer` | Hayır | Default: `0` |
| `begeni_sayisi` | `integer` | Hayır | Default: `0` |

### 📌 Tablo: `public.iade_talepleri` *(Kayıt Sayısı: 2)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `uuid` | 🔑 PK | Default: `gen_random_uuid()` |
| `ad_soyad` | `text` | Evet |  |
| `iban` | `text` | Evet |  |
| `tutar` | `text` | Evet |  |
| `mesaj` | `text` | Hayır |  |
| `dekont_url` | `text` | Evet |  |
| `durum` | `text` | Hayır | Default: `Bekliyor` |
| `created_at` | `timestamp with time zone` | Hayır | Default: `now()` |

### 📌 Tablo: `public.ilceler` *(Kayıt Sayısı: 973)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `integer` | 🔑 PK |  |
| `il_id` | `integer` | Hayır | Note: This is a Foreign Key to `iller.id`.<fk table='iller' column='id'/> |
| `ad` | `text` | Evet |  |

### 📌 Tablo: `public.iller` *(Kayıt Sayısı: 84)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `integer` | 🔑 PK |  |
| `ad` | `text` | Evet |  |

### 📌 Tablo: `public.instagram_posts` *(Kayıt Sayısı: 4)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `bigint` | 🔑 PK |  |
| `img_url` | `text` | Evet |  |
| `likes` | `text` | Evet |  |
| `post_url` | `text` | Evet |  |
| `is_active` | `boolean` | Hayır | Default: `True` |
| `display_order` | `integer` | Hayır | Default: `0` |
| `created_at` | `timestamp with time zone` | Hayır | Default: `now()` |

### 📌 Tablo: `public.profiles` *(Kayıt Sayısı: 2)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `uuid` | 🔑 PK |  |
| `email` | `text` | Evet |  |
| `created_at` | `timestamp with time zone` | Hayır | Default: `now()` |

### 📌 Tablo: `public.sikca_sorulan_sorular` *(Kayıt Sayısı: 7)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `uuid` | 🔑 PK | Default: `gen_random_uuid()` |
| `soru` | `text` | Evet |  |
| `cevap` | `text` | Evet |  |
| `sira` | `integer` | Hayır | Default: `0` |
| `created_at` | `timestamp with time zone` | Hayır | Default: `now()` |

### 📌 Tablo: `public.site_istatistikleri` *(Kayıt Sayısı: 1)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `integer` | 🔑 PK |  |
| `toplam_ziyaret` | `integer` | Hayır | Default: `0` |

### 📌 Tablo: `public.urunler` *(Kayıt Sayısı: 8)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `bigint` | 🔑 PK |  |
| `ad` | `text` | Evet |  |
| `fiyat` | `integer` | Evet |  |
| `gorsel_yolu` | `text` | Evet |  |
| `aktif` | `boolean` | Evet | Default: `True` |
| `sira` | `integer` | Evet | Default: `0` |

### 📌 Tablo: `public.yardim_talepleri` *(Kayıt Sayısı: 100)*

| Sütun Adı | Veri Tipi (Format) | Zorunlu / PK | Varsayılan / Açıklama |
|-----------|--------------------|--------------|-----------------------|
| `id` | `bigint` | 🔑 PK |  |
| `created_at` | `timestamp with time zone` | Evet | Default: `timezone('utc'::text, now())` |
| `ad_soyad` | `text` | Hayır |  |
| `telefon` | `text` | Hayır |  |
| `il` | `text` | Hayır |  |
| `ilce` | `text` | Hayır |  |
| `mesaj` | `text` | Hayır |  |
| `gorsel_yollari` | `text[]` | Hayır | Supabase Storage'a yüklenen görsellerin dosya yollarını içeren dizi. |
| `durum` | `text` | Hayır | Default: `Yeni Talep` |
