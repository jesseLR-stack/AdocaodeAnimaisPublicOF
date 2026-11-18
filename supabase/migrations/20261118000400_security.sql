-- =============================================================================
-- AdoteAmigo — Migration 004: Row Level Security, privilégios, storage e realtime
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções: por padrão NENHUMA função é executável por clientes.
-- Liberamos explicitamente apenas as que fazem parte da API pública.
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Usadas dentro de políticas RLS (precisam ser executáveis pelo papel da requisição).
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.has_permission(text) to anon, authenticated;
grant execute on function public.is_active_user(uuid) to anon, authenticated;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;
grant execute on function public.normalize_text(text) to anon, authenticated;
grant execute on function public.distance_km(float8, float8, float8, float8) to anon, authenticated;
grant execute on function public.is_client_request() to anon, authenticated;
grant execute on function public.slugify(text) to anon, authenticated;

-- API pública (RPC).
grant execute on function public.public_stats() to anon, authenticated;
grant execute on function public.increment_animal_view(uuid) to anon, authenticated;
grant execute on function public.get_animal_whatsapp(uuid) to authenticated;
grant execute on function public.set_primary_image(uuid) to authenticated;
grant execute on function public.start_conversation(uuid, text) to authenticated;
grant execute on function public.start_conversation_from_interest(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.my_conversations() to authenticated;
grant execute on function public.unread_messages_count() to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.admin_set_animal_status(uuid, public.animal_status, text) to authenticated;
grant execute on function public.admin_clear_animal_flags(uuid, text) to authenticated;
grant execute on function public.admin_set_health_verified(uuid, boolean, text) to authenticated;
grant execute on function public.admin_set_user_status(uuid, public.account_status, text) to authenticated;
grant execute on function public.admin_set_profile_verified(uuid, boolean, text) to authenticated;
grant execute on function public.admin_update_report(uuid, public.report_status, text) to authenticated;
grant execute on function public.admin_update_setting(text, jsonb) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- -----------------------------------------------------------------------------
-- Busca do catálogo (SECURITY INVOKER: respeita RLS de quem consulta)
-- -----------------------------------------------------------------------------
create or replace function public.search_animals(
  p_query        text default null,
  p_species      public.animal_species[] default null,
  p_sex          public.animal_sex default null,
  p_size         public.animal_size[] default null,
  p_age_group    public.animal_age_group[] default null,
  p_breed        text default null,
  p_uf           char(2) default null,
  p_city         integer default null,
  p_ref_city     integer default null,
  p_radius_km    integer default null,
  p_neutered     boolean default null,
  p_vaccinated   boolean default null,
  p_special_needs boolean default null,
  p_status       public.animal_status default 'disponivel',
  p_sort         text default 'recentes',
  p_limit        integer default 24,
  p_offset       integer default 0
) returns table (
  id uuid, slug text, name text, species public.animal_species, species_other text, breed text,
  age_group public.animal_age_group, age_months integer, sex public.animal_sex, size public.animal_size,
  city_name text, uf char(2), neutered public.health_info, vaccinated public.health_info,
  special_needs boolean, status public.animal_status, view_count integer,
  published_at timestamptz, updated_at timestamptz, adopted_at timestamptz,
  image_path text, owner_name text, owner_type public.profile_type, owner_verified boolean,
  distance_km double precision, total_count bigint
) language sql stable security invoker set search_path = '' as $$
  with ref as (
    select latitude, longitude from public.cities where id = p_ref_city
  ), q as (
    select case when nullif(btrim(p_query), '') is null then null
                else websearch_to_tsquery('portuguese', public.normalize_text(p_query)) end as tsq
  )
  select a.id, a.slug, a.name, a.species, a.species_other, a.breed, a.age_group, a.age_months, a.sex, a.size,
         c.name, a.uf, a.neutered, a.vaccinated, a.special_needs, a.status, a.view_count,
         a.published_at, a.updated_at, a.adopted_at,
         (select i.storage_path from public.animal_images i where i.animal_id = a.id
           order by i.is_primary desc, i.position asc limit 1),
         p.full_name, p.profile_type, p.is_verified,
         case when ref.latitude is null then null
              else public.distance_km(ref.latitude, ref.longitude, c.latitude, c.longitude) end,
         count(*) over ()
    from public.animals a
    join public.cities c on c.id = a.city_id
    join public.profiles p on p.id = a.owner_id
    left join ref on true
    cross join q
   where a.status = coalesce(p_status, 'disponivel')
     and (p_species is null or a.species = any(p_species))
     and (p_sex is null or a.sex = p_sex)
     and (p_size is null or a.size = any(p_size))
     and (p_age_group is null or a.age_group = any(p_age_group))
     and (nullif(btrim(p_breed), '') is null or public.normalize_text(a.breed) like '%' || public.normalize_text(p_breed) || '%')
     and (p_uf is null or a.uf = p_uf)
     and (p_city is null or a.city_id = p_city)
     and (p_neutered is null or (p_neutered and a.neutered = 'sim') or (not p_neutered and a.neutered <> 'sim'))
     and (p_vaccinated is null or (p_vaccinated and a.vaccinated in ('sim', 'parcial')) or (not p_vaccinated and a.vaccinated not in ('sim', 'parcial')))
     and (p_special_needs is null or a.special_needs = p_special_needs)
     and (q.tsq is null or a.search_vector @@ q.tsq or public.normalize_text(a.breed) like '%' || public.normalize_text(p_query) || '%')
     and (p_radius_km is null or ref.latitude is null
          or public.distance_km(ref.latitude, ref.longitude, c.latitude, c.longitude) <= p_radius_km)
   order by
     case when p_sort = 'proximos' and ref.latitude is not null
          then public.distance_km(ref.latitude, ref.longitude, c.latitude, c.longitude) end asc nulls last,
     case when p_sort = 'atualizados' then a.updated_at end desc nulls last,
     case when p_sort = 'visualizados' then a.view_count end desc nulls last,
     case when p_status = 'adotado' then a.adopted_at end desc nulls last,
     a.published_at desc
   limit least(greatest(coalesce(p_limit, 24), 1), 48)
  offset greatest(coalesce(p_offset, 0), 0)
$$;
grant execute on function public.search_animals(text, public.animal_species[], public.animal_sex, public.animal_size[],
  public.animal_age_group[], text, char, integer, integer, integer, boolean, boolean, boolean,
  public.animal_status, text, integer, integer) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Habilita RLS em todas as tabelas
-- -----------------------------------------------------------------------------
alter table public.states                     enable row level security;
alter table public.cities                     enable row level security;
alter table public.profiles                   enable row level security;
alter table public.profiles_private           enable row level security;
alter table public.organizations              enable row level security;
alter table public.organization_verifications enable row level security;
alter table public.animals                    enable row level security;
alter table public.animal_contacts            enable row level security;
alter table public.animal_images              enable row level security;
alter table public.favorites                  enable row level security;
alter table public.adoption_interests         enable row level security;
alter table public.conversations              enable row level security;
alter table public.conversation_participants  enable row level security;
alter table public.messages                   enable row level security;
alter table public.user_blocks                enable row level security;
alter table public.reports                    enable row level security;
alter table public.notifications              enable row level security;
alter table public.terms_acceptances          enable row level security;
alter table public.moderation_logs            enable row level security;
alter table public.admin_roles                enable row level security;
alter table public.staff_permissions          enable row level security;
alter table public.platform_settings          enable row level security;
alter table public.rate_limit_events          enable row level security;
alter table public.adoption_stories           enable row level security;

-- Privilégios de tabela: começamos do zero e liberamos o mínimo necessário.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.states, public.cities to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (full_name, avatar_url, bio, profile_type, city_id) on public.profiles to authenticated;
grant select, update (phone) on public.profiles_private to authenticated;
grant select on public.organizations to anon, authenticated;
grant insert (owner_id, name, description, cnpj, website, instagram, city_id, uf),
      update (name, description, cnpj, website, instagram, city_id, uf) on public.organizations to authenticated;
grant select, insert (organization_id, requested_by, message) on public.organization_verifications to authenticated;
grant select on public.animals to anon, authenticated;
grant insert (id, owner_id, name, species, species_other, breed, age_group, age_months, sex, size, description, story,
              personality, temperament, good_with, vaccinated, neutered, dewormed, vet_info, special_needs,
              special_needs_details, city_id, region, contact_preference, accepts_messages),
      update (name, species, species_other, breed, age_group, age_months, sex, size, description, story,
              personality, temperament, good_with, vaccinated, neutered, dewormed, vet_info, special_needs,
              special_needs_details, city_id, region, contact_preference, accepts_messages, status, status_reason)
      on public.animals to authenticated;
grant select, insert, update, delete on public.animal_contacts to authenticated;
grant select on public.animal_images to anon, authenticated;
grant insert (animal_id, storage_path, position, is_primary, width, height, alt_text),
      update (position, alt_text), delete on public.animal_images to authenticated;
grant select, insert (user_id, animal_id), delete on public.favorites to authenticated;
grant select, insert (animal_id, interested_id, message, housing_info),
      update (status, owner_note) on public.adoption_interests to authenticated;
grant select on public.conversations to authenticated;
grant select on public.conversation_participants to authenticated;
grant select, insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant select, insert, delete on public.user_blocks to authenticated;
grant select, insert (reporter_id, target_type, animal_id, reported_user_id, conversation_id, reason, description)
      on public.reports to authenticated;
grant select, update (read_at), delete on public.notifications to authenticated;
grant select on public.terms_acceptances to authenticated;
grant insert (user_id, document, version) on public.terms_acceptances to authenticated;
grant select on public.moderation_logs to authenticated;
grant select on public.admin_roles to authenticated;
grant select on public.staff_permissions to authenticated;
grant select on public.platform_settings to anon, authenticated;
grant select on public.adoption_stories to anon, authenticated;
grant insert (animal_id, author_id, title, body), update (title, body, is_published), delete
      on public.adoption_stories to authenticated;

-- -----------------------------------------------------------------------------
-- Políticas
-- -----------------------------------------------------------------------------
create policy "localidades públicas" on public.states for select using (true);
create policy "cidades públicas" on public.cities for select using (true);

-- Perfis: públicos quando ativos; o titular e a equipe veem sempre.
create policy "perfis visíveis" on public.profiles for select
  using (account_status = 'ativo' or id = auth.uid() or public.has_permission('users.view'));
create policy "titular atualiza o próprio perfil" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "dados privados do titular" on public.profiles_private for select to authenticated
  using (id = auth.uid() or public.has_permission('users.view'));
create policy "titular atualiza dados privados" on public.profiles_private for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "organizações públicas" on public.organizations for select
  using (public.is_active_user(owner_id) or owner_id = auth.uid() or public.has_permission('users.view'));
create policy "titular cria organização" on public.organizations for insert to authenticated
  with check (owner_id = auth.uid() and public.is_active_user());
create policy "titular edita organização" on public.organizations for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "verificações do titular ou equipe" on public.organization_verifications for select to authenticated
  using (requested_by = auth.uid() or public.has_permission('organizations.verify'));
create policy "titular solicita verificação" on public.organization_verifications for insert to authenticated
  with check (requested_by = auth.uid() and exists (
    select 1 from public.organizations o where o.id = organization_id and o.owner_id = auth.uid()));

-- Animais
create policy "animais públicos" on public.animals for select
  using (
    (status in ('disponivel', 'adotado') and public.is_active_user(owner_id))
    or owner_id = auth.uid()
    or public.has_permission('animals.moderate')
  );
create policy "usuário publica animais" on public.animals for insert to authenticated
  with check (owner_id = auth.uid());
create policy "dono edita animal" on public.animals for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "contato visível ao dono" on public.animal_contacts for select to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()));
create policy "dono gerencia contato" on public.animal_contacts for all to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()));

create policy "imagens seguem o animal" on public.animal_images for select
  using (exists (select 1 from public.animals a where a.id = animal_id));  -- RLS de animals se aplica
create policy "dono adiciona imagens" on public.animal_images for insert to authenticated
  with check (exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()));
create policy "dono edita imagens" on public.animal_images for update to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()));
create policy "dono remove imagens" on public.animal_images for delete to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and (a.owner_id = auth.uid() or public.has_permission('animals.moderate'))));

-- Favoritos
create policy "favoritos do titular" on public.favorites for select to authenticated using (user_id = auth.uid());
create policy "titular favorita" on public.favorites for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.animals a where a.id = animal_id));
create policy "titular remove favorito" on public.favorites for delete to authenticated using (user_id = auth.uid());

-- Interesses
create policy "interesses das partes" on public.adoption_interests for select to authenticated
  using (interested_id = auth.uid() or owner_id = auth.uid() or public.has_permission('reports.manage'));
create policy "usuário registra interesse" on public.adoption_interests for insert to authenticated
  with check (interested_id = auth.uid());
create policy "partes atualizam interesse" on public.adoption_interests for update to authenticated
  using (interested_id = auth.uid() or owner_id = auth.uid())
  with check (interested_id = auth.uid() or owner_id = auth.uid());

-- Conversas: somente participantes. A equipe só lê conversas que foram denunciadas.
create policy "participantes veem conversa" on public.conversations for select to authenticated
  using (public.is_conversation_participant(id)
         or (public.has_permission('conversations.review')
             and exists (select 1 from public.reports r where r.conversation_id = id)));
create policy "participantes veem participantes" on public.conversation_participants for select to authenticated
  using (public.is_conversation_participant(conversation_id)
         or (public.has_permission('conversations.review')
             and exists (select 1 from public.reports r where r.conversation_id = conversation_participants.conversation_id)));
create policy "participantes leem mensagens" on public.messages for select to authenticated
  using (public.is_conversation_participant(conversation_id)
         or (public.has_permission('conversations.review')
             and exists (select 1 from public.reports r where r.conversation_id = messages.conversation_id)));
create policy "participantes enviam mensagens" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- Bloqueios
create policy "bloqueios do titular" on public.user_blocks for select to authenticated using (blocker_id = auth.uid());
create policy "titular bloqueia" on public.user_blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "titular desbloqueia" on public.user_blocks for delete to authenticated using (blocker_id = auth.uid());

-- Denúncias
create policy "denúncias do autor ou equipe" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.has_permission('reports.manage'));
create policy "usuário denuncia" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- Notificações
create policy "notificações do titular" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "titular marca como lida" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "titular remove notificação" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- Termos
create policy "aceites do titular" on public.terms_acceptances for select to authenticated
  using (user_id = auth.uid() or public.has_permission('users.view'));
create policy "titular registra aceite" on public.terms_acceptances for insert to authenticated
  with check (user_id = auth.uid() and version = public.setting('legal_versions') ->> document::text);

-- Auditoria e equipe
create policy "equipe lê auditoria" on public.moderation_logs for select to authenticated
  using (public.has_permission('logs.view') or (public.is_staff() and actor_id = auth.uid()));
create policy "papel próprio ou admin" on public.admin_roles for select to authenticated
  using (user_id = auth.uid() or public.has_permission('settings.manage'));
create policy "equipe lê permissões" on public.staff_permissions for select to authenticated
  using (public.is_staff());
create policy "configurações públicas" on public.platform_settings for select using (true);

-- Histórias de adoção
create policy "histórias publicadas" on public.adoption_stories for select
  using (is_published or author_id = auth.uid() or public.has_permission('animals.moderate'));
create policy "autor publica história" on public.adoption_stories for insert to authenticated
  with check (author_id = auth.uid() and public.is_active_user()
              and (animal_id is null or exists (select 1 from public.animals a
                    where a.id = animal_id and a.owner_id = auth.uid() and a.status = 'adotado')));
create policy "autor edita história" on public.adoption_stories for update to authenticated
  using (author_id = auth.uid() or public.has_permission('animals.moderate'));
create policy "autor remove história" on public.adoption_stories for delete to authenticated
  using (author_id = auth.uid() or public.has_permission('animals.moderate'));

-- public.setting é usada pela política de aceite.
grant execute on function public.setting(text) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: buckets e políticas (pasta raiz = id do usuário)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('animal-images', 'animal-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "upload na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id in ('animal-images', 'avatars')
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.is_active_user());
create policy "atualiza na própria pasta" on storage.objects for update to authenticated
  using (bucket_id in ('animal-images', 'avatars') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "remove da própria pasta" on storage.objects for delete to authenticated
  using (bucket_id in ('animal-images', 'avatars')
         and ((storage.foldername(name))[1] = auth.uid()::text or public.has_permission('animals.moderate')));

-- -----------------------------------------------------------------------------
-- Realtime: mensagens e notificações (RLS aplicada às assinaturas)
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;
