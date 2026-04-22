alter table public.educational_qualifications
add column if not exists document_name text,
add column if not exists document_type text,
add column if not exists document_url text;

insert into storage.buckets (id, name, public)
values ('qualification-documents', 'qualification-documents', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view qualification documents" on storage.objects;
create policy "Anyone can view qualification documents"
on storage.objects for select
using (bucket_id = 'qualification-documents');

drop policy if exists "Authenticated users can upload qualification documents" on storage.objects;
create policy "Authenticated users can upload qualification documents"
on storage.objects for insert
with check (bucket_id = 'qualification-documents' and auth.uid() is not null);

drop policy if exists "Authenticated users can update qualification documents" on storage.objects;
create policy "Authenticated users can update qualification documents"
on storage.objects for update
using (bucket_id = 'qualification-documents' and auth.uid() is not null);

drop policy if exists "Authenticated users can delete qualification documents" on storage.objects;
create policy "Authenticated users can delete qualification documents"
on storage.objects for delete
using (bucket_id = 'qualification-documents' and auth.uid() is not null);
