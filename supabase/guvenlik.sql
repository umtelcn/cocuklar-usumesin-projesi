-- =============================================================================
-- Çocuklar Üşümesin — Güvenlik (RLS) düzenlemeleri
--
-- NASIL ÇALIŞTIRILIR: Supabase Dashboard > SQL Editor'a yapıştırıp "Run".
-- Tekrar tekrar çalıştırılabilir (idempotent); tek bir transaction içindedir.
--
-- NE YAPAR:
--   1) bagis_gizli_bilgiler : anonim bağışçıların GERÇEK adını tutan, dışarıya
--      tamamen kapalı tablo. Yalnızca sunucu (service role) yazar/okur.
--   2) yardim_talepleri, iade_talepleri : anon rolü artık yalnızca INSERT
--      yapabilir; SELECT / UPDATE / DELETE kapatılır (telefon, adres, IBAN ve
--      dekont bağlantıları herkese açık okunamaz).
--
-- VARSAYIM: Yönetici kullanıcılar Supabase Auth ile giriş yapar ve
--   public.profiles tablosunda kayıtlıdır. Bu kullanıcılar talepleri görmeye
--   ve güncellemeye devam eder. Yönetim paneliniz verileri anon anahtarla
--   okuyorsa bu betikten sonra BOŞ liste görür; paneli giriş yapmış kullanıcı
--   (authenticated) veya service role ile okuyacak şekilde ayarlayın.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Gerçek adların saklandığı gizli tablo
-- -----------------------------------------------------------------------------
create table if not exists public.bagis_gizli_bilgiler (
  bagis_id        bigint primary key
                  references public.bagislar (id) on delete cascade,
  gercek_ad_soyad text not null,
  created_at      timestamptz not null default now()
);

comment on table public.bagis_gizli_bilgiler is
  'Bağışçının gerçek adı. bagislar.ad_soyad anonim bağışlarda "Anonim Bağışçı" olur; gerçek ad yalnızca burada durur.';

alter table public.bagis_gizli_bilgiler enable row level security;

revoke all on public.bagis_gizli_bilgiler from anon, authenticated;
grant all on public.bagis_gizli_bilgiler to service_role;
grant select on public.bagis_gizli_bilgiler to authenticated;

drop policy if exists "yonetici_gizli_bilgi_okur" on public.bagis_gizli_bilgiler;
create policy "yonetici_gizli_bilgi_okur"
  on public.bagis_gizli_bilgiler
  for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid()));
-- anon için hiçbir politika yok => anon bu tabloya hiçbir şekilde erişemez.

-- -----------------------------------------------------------------------------
-- 2) yardim_talepleri ve iade_talepleri: anon yalnızca INSERT
-- -----------------------------------------------------------------------------
alter table public.yardim_talepleri enable row level security;
alter table public.iade_talepleri   enable row level security;

-- anon / public rolüne tanınmış mevcut TÜM politikaları kaldır
-- (yalnızca "authenticated" vb. rollere özel politikalara dokunulmaz).
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('yardim_talepleri', 'iade_talepleri')
      and (roles && array['anon', 'public']::name[])
  loop
    execute format('drop policy if exists %I on %I.%I',
                   p.policyname, p.schemaname, p.tablename);
  end loop;
end
$$;

-- Tablo yetkileri: anon yalnızca ekleyebilir.
revoke all on public.yardim_talepleri from anon;
revoke all on public.iade_talepleri   from anon;
grant insert on public.yardim_talepleri to anon;
grant insert on public.iade_talepleri   to anon;
grant select, insert, update, delete on public.yardim_talepleri to authenticated;
grant select, insert, update, delete on public.iade_talepleri   to authenticated;

-- Ziyaretçi (anon) ve giriş yapmış kullanıcı form gönderebilir.
drop policy if exists "herkes_yardim_talebi_ekler" on public.yardim_talepleri;
create policy "herkes_yardim_talebi_ekler"
  on public.yardim_talepleri
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "herkes_iade_talebi_ekler" on public.iade_talepleri;
create policy "herkes_iade_talebi_ekler"
  on public.iade_talepleri
  for insert
  to anon, authenticated
  with check (true);

-- Yöneticiler (profiles tablosunda kayıtlı, giriş yapmış kullanıcılar)
-- talepleri okuyabilir, güncelleyebilir ve silebilir.
drop policy if exists "yonetici_yardim_talebi_yonetir" on public.yardim_talepleri;
create policy "yonetici_yardim_talebi_yonetir"
  on public.yardim_talepleri
  for all
  to authenticated
  using      (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

drop policy if exists "yonetici_iade_talebi_yonetir" on public.iade_talepleri;
create policy "yonetici_iade_talebi_yonetir"
  on public.iade_talepleri
  for all
  to authenticated
  using      (exists (select 1 from public.profiles p where p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid()));

commit;

-- -----------------------------------------------------------------------------
-- DOĞRULAMA (çalıştırdıktan sonra):
--   select tablename, policyname, roles, cmd
--   from pg_policies
--   where tablename in ('yardim_talepleri','iade_talepleri','bagis_gizli_bilgiler')
--   order by 1, 2;
--
-- Beklenen: anon yalnızca "..._ekler" (INSERT) politikalarında görünür.
-- Tarayıcıdan anon anahtarla `select * from yardim_talepleri` => boş dizi.
-- -----------------------------------------------------------------------------
