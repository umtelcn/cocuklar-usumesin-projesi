-- =============================================================================
-- Eski anonim bağışlarda herkese açık adı baş harflere çevirir.
-- "Ahmet Can Yılmaz" -> "A. Y."  (gerçek ad bagis_gizli_bilgiler'den okunur)
--
-- NASIL ÇALIŞTIRILIR: Supabase Dashboard > SQL Editor'a yapıştırıp "Run".
-- Tekrar çalıştırılabilir. Yeni bağışlarda bu işi API otomatik yapar.
-- =============================================================================

update public.bagislar b
set ad_soyad = (
  select string_agg(upper(translate(left(t.parca, 1), 'iı', 'İI')) || '.', ' ' order by t.sira)
  from unnest(regexp_split_to_array(trim(g.gercek_ad_soyad), '\s+'))
       with ordinality as t(parca, sira)
  where t.sira = 1
     or t.sira = array_length(regexp_split_to_array(trim(g.gercek_ad_soyad), '\s+'), 1)
)
from public.bagis_gizli_bilgiler g
where g.bagis_id = b.id
  and b.is_anonymous = true
  and trim(g.gercek_ad_soyad) <> '';
