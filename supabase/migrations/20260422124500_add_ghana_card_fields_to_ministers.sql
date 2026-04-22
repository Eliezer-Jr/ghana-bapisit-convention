alter table public.ministers
add column if not exists ghana_card_number text,
add column if not exists ghana_card_front_name text,
add column if not exists ghana_card_front_type text,
add column if not exists ghana_card_front_url text,
add column if not exists ghana_card_back_name text,
add column if not exists ghana_card_back_type text,
add column if not exists ghana_card_back_url text;

insert into storage.buckets (id, name, public)
values ('ghana-card-documents', 'ghana-card-documents', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view ghana card documents" on storage.objects;
create policy "Anyone can view ghana card documents"
on storage.objects for select
using (bucket_id = 'ghana-card-documents');

drop policy if exists "Authenticated users can upload ghana card documents" on storage.objects;
create policy "Authenticated users can upload ghana card documents"
on storage.objects for insert
with check (bucket_id = 'ghana-card-documents' and auth.uid() is not null);

drop policy if exists "Authenticated users can update ghana card documents" on storage.objects;
create policy "Authenticated users can update ghana card documents"
on storage.objects for update
using (bucket_id = 'ghana-card-documents' and auth.uid() is not null);

drop policy if exists "Authenticated users can delete ghana card documents" on storage.objects;
create policy "Authenticated users can delete ghana card documents"
on storage.objects for delete
using (bucket_id = 'ghana-card-documents' and auth.uid() is not null);
