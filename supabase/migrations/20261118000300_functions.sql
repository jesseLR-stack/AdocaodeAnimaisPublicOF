-- =============================================================================
-- AdoteAmigo — Migration 003: funções, gatilhos e regras de negócio
-- =============================================================================
-- Funções SECURITY DEFINER sempre fixam search_path e validam auth.uid().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Configurações iniciais e permissões da equipe
-- -----------------------------------------------------------------------------
insert into public.platform_settings (key, value, description) values
  ('legal_versions', '{"termos_uso":"1.0","politica_privacidade":"1.0","diretrizes_comunidade":"1.0","politica_adocao":"1.0"}',
   'Versões vigentes dos documentos legais. O cadastro exige aceite das versões atuais.'),
  ('rate_limits', '{"animal_create":{"max":5,"window_minutes":1440},"message_send":{"max":30,"window_minutes":5},"interest_create":{"max":15,"window_minutes":1440},"report_create":{"max":10,"window_minutes":1440},"conversation_create":{"max":20,"window_minutes":1440},"whatsapp_reveal":{"max":30,"window_minutes":1440}}',
   'Limites anti-spam por usuário: máximo de ações por janela de tempo.'),
  ('minimum_age', '18', 'Idade mínima para criar conta.'),
  ('blocked_terms', '["pix","venda","vendo","r$","valor","deposito","depósito","taxa de entrega","pague","cartao de credito","cartão de crédito","transferencia","transferência"]',
   'Termos que sinalizam possível venda ou golpe em anúncios e mensagens (não bloqueiam; apenas sinalizam para a moderação).')
on conflict (key) do nothing;

insert into public.staff_permissions (role, permission) values
  ('admin', 'dashboard.view'), ('admin', 'animals.moderate'), ('admin', 'reports.manage'),
  ('admin', 'users.view'), ('admin', 'users.suspend'), ('admin', 'users.block'),
  ('admin', 'organizations.verify'), ('admin', 'settings.manage'), ('admin', 'logs.view'),
  ('admin', 'conversations.review'),
  ('moderador', 'dashboard.view'), ('moderador', 'animals.moderate'), ('moderador', 'reports.manage'),
  ('moderador', 'users.view'), ('moderador', 'users.suspend'), ('moderador', 'conversations.review')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- Funções de autorização
-- -----------------------------------------------------------------------------
create or replace function public.staff_role_of(uid uuid)
returns public.staff_role language sql stable security definer set search_path = '' as $$
  select role from public.admin_roles where user_id = uid
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid())
$$;

create or replace function public.has_permission(perm text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_roles r
    join public.staff_permissions p on p.role = r.role
    where r.user_id = auth.uid() and p.permission = perm
  )
$$;

create or replace function public.is_active_user(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = uid and account_status = 'ativo')
$$;

create or replace function public.is_conversation_participant(conv uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conv and user_id = uid
  )
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

-- Contexto da requisição: true quando a chamada vem de um cliente (anon/authenticated)
-- e não está dentro de uma operação privilegiada iniciada por função interna.
create or replace function public.is_client_request()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(auth.role(), '') in ('authenticated', 'anon')
     and coalesce(current_setting('adoteamigo.privileged', true), '') <> 'on'
$$;

create or replace function public.set_privileged(enabled boolean)
returns void language sql security definer set search_path = '' as $$
  select set_config('adoteamigo.privileged', case when enabled then 'on' else 'off' end, true);
$$;

-- -----------------------------------------------------------------------------
-- Utilitários
-- -----------------------------------------------------------------------------
create or replace function public.slugify(value text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(public.normalize_text(value), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.setting(setting_key text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select value from public.platform_settings where key = setting_key
$$;

-- Lança exceção se o usuário excedeu o limite configurado para a ação.
create or replace function public.enforce_rate_limit(action_name text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  cfg jsonb := public.setting('rate_limits') -> action_name;
  used integer;
begin
  if auth.uid() is null or cfg is null then return; end if;
  select count(*) into used from public.rate_limit_events
   where user_id = auth.uid() and action = action_name
     and created_at > now() - make_interval(mins => (cfg->>'window_minutes')::int);
  if used >= (cfg->>'max')::int then
    raise exception 'Limite de ações atingido. Tente novamente mais tarde.'
      using errcode = 'P0429', hint = action_name;
  end if;
  insert into public.rate_limit_events (user_id, action) values (auth.uid(), action_name);
end $$;

-- Sinais de risco em texto livre: links externos, termos de venda/golpe, telefones.
create or replace function public.detect_risk_flags(content text)
returns text[] language plpgsql stable security definer set search_path = '' as $$
declare
  flags text[] := '{}';
  normalized text := public.normalize_text(content);
  term text;
begin
  if content is null then return flags; end if;
  if normalized ~ '(https?://|www\.|bit\.ly|tinyurl|\.com(\.br)?\b|\.net\b|\.xyz\b)' then
    flags := array_append(flags, 'link_externo');
  end if;
  for term in select public.normalize_text(jsonb_array_elements_text(public.setting('blocked_terms'))) loop
    if position(term in normalized) > 0 then
      flags := array_append(flags, 'possivel_venda_ou_golpe');
      exit;
    end if;
  end loop;
  if normalized ~ '(\d[\s.-]?){10,}' then
    flags := array_append(flags, 'telefone_no_texto');
  end if;
  return flags;
end $$;

create or replace function public.log_moderation(
  p_action text, p_target_type text, p_target_id uuid, p_reason text, p_metadata jsonb default '{}'
) returns void language sql security definer set search_path = '' as $$
  insert into public.moderation_logs (actor_id, actor_role, action, target_type, target_id, reason, metadata)
  values (auth.uid(), coalesce(public.staff_role_of(auth.uid())::text, 'sistema'), p_action, p_target_type, p_target_id, p_reason, coalesce(p_metadata, '{}'));
$$;

create or replace function public.notify(
  p_user uuid, p_type text, p_title text, p_body text, p_link text
) returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user, p_type, p_title, p_body, p_link);
$$;

-- Distância aproximada (km) pela fórmula de Haversine.
create or replace function public.distance_km(lat1 float8, lon1 float8, lat2 float8, lon2 float8)
returns float8 language sql immutable parallel safe as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ))
$$;

-- -----------------------------------------------------------------------------
-- Cadastro: cria o perfil a partir dos metadados do Supabase Auth
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}');
  versions jsonb := public.setting('legal_versions');
  min_age int := coalesce((public.setting('minimum_age'))::text::int, 18);
  v_birth date;
  v_name text := btrim(coalesce(meta->>'full_name', ''));
  v_city integer := nullif(meta->>'city_id', '')::integer;
  v_uf char(2);
  base_slug text;
  doc text;
begin
  -- Idade mínima (Código Civil: capacidade plena aos 18; ver Política de Privacidade).
  begin
    v_birth := (meta->>'birth_date')::date;
  exception when others then
    v_birth := null;
  end;
  if v_birth is null then
    raise exception 'Data de nascimento obrigatória.' using errcode = '22023';
  end if;
  if v_birth > (current_date - make_interval(years => min_age)) then
    raise exception 'É necessário ter pelo menos % anos para criar uma conta.', min_age using errcode = '22023';
  end if;
  if char_length(v_name) < 2 then
    raise exception 'Nome obrigatório.' using errcode = '22023';
  end if;
  if v_city is not null then
    select uf into v_uf from public.cities where id = v_city;
    if v_uf is null then raise exception 'Cidade inválida.' using errcode = '22023'; end if;
  end if;

  -- Aceite obrigatório das versões vigentes dos Termos e da Política de Privacidade.
  if coalesce(meta->'accepted_terms'->>'termos_uso', '') <> versions->>'termos_uso'
     or coalesce(meta->'accepted_terms'->>'politica_privacidade', '') <> versions->>'politica_privacidade' then
    raise exception 'É necessário aceitar os Termos de Uso e a Política de Privacidade vigentes.' using errcode = '22023';
  end if;

  base_slug := coalesce(nullif(public.slugify(v_name), ''), 'usuario');
  insert into public.profiles (id, full_name, slug, profile_type, city_id, uf)
  values (
    new.id, v_name,
    base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 6),
    coalesce(nullif(meta->>'profile_type', '')::public.profile_type, 'pessoa_fisica'),
    v_city, v_uf
  );
  insert into public.profiles_private (id, birth_date, phone)
  values (new.id, v_birth, nullif(regexp_replace(coalesce(meta->>'phone', ''), '\D', '', 'g'), ''));

  for doc in select jsonb_object_keys(meta->'accepted_terms') loop
    if versions ? doc and meta->'accepted_terms'->>doc = versions->>doc then
      insert into public.terms_acceptances (user_id, document, version)
      values (new.id, doc::public.legal_document, versions->>doc)
      on conflict do nothing;
    end if;
  end loop;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Perfis: impede autoalteração de campos sensíveis
-- -----------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_client_request() then
    if new.account_status is distinct from old.account_status
       or new.status_reason is distinct from old.status_reason
       or new.is_verified is distinct from old.is_verified
       or new.slug is distinct from old.slug
       or new.id is distinct from old.id then
      raise exception 'Campo não pode ser alterado pelo usuário.' using errcode = '42501';
    end if;
  end if;
  if new.city_id is distinct from old.city_id then
    select uf into new.uf from public.cities where id = new.city_id;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- -----------------------------------------------------------------------------
-- Animais: publicação automática com validações de segurança
-- -----------------------------------------------------------------------------
create or replace function public.animals_search_vector_refresh()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.search_vector :=
    setweight(to_tsvector('portuguese', public.normalize_text(new.name)), 'A') ||
    setweight(to_tsvector('portuguese', public.normalize_text(coalesce(new.breed, '') || ' ' || coalesce(new.species_other, ''))), 'B') ||
    setweight(to_tsvector('portuguese', public.normalize_text(coalesce(new.personality, '') || ' ' || array_to_string(new.temperament, ' '))), 'C') ||
    setweight(to_tsvector('portuguese', public.normalize_text(coalesce(new.description, '') || ' ' || coalesce(new.story, ''))), 'D');
  return new;
end $$;
create trigger animals_search_vector before insert or update of name, breed, species_other, personality, temperament, description, story
  on public.animals for each row execute function public.animals_search_vector_refresh();

create or replace function public.animals_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  dup_count int;
begin
  if public.is_client_request() then
    if new.owner_id is distinct from auth.uid() then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    if not public.is_active_user() then
      raise exception 'Sua conta não pode publicar anúncios no momento.' using errcode = '42501';
    end if;
    perform public.enforce_rate_limit('animal_create');
    -- Publicação automática: o usuário não escolhe status de moderação.
    new.status := 'disponivel';
    new.moderation_locked := false;
    new.health_verified := false;
    new.view_count := 0;
    new.published_at := now();
    new.adopted_at := null;
  end if;

  select uf into new.uf from public.cities where id = new.city_id;
  new.slug := coalesce(nullif(public.slugify(new.name), ''), 'animal') || '-' ||
              substr(replace(new.id::text, '-', ''), 1, 6);

  new.risk_flags := public.detect_risk_flags(
    concat_ws(' ', new.name, new.description, new.story, new.personality, new.vet_info, new.special_needs_details, new.region));

  -- Publicação repetida: mesmo anunciante, mesmo nome e espécie nos últimos 30 dias.
  select count(*) into dup_count from public.animals
   where owner_id = new.owner_id and species = new.species
     and public.normalize_text(name) = public.normalize_text(new.name)
     and created_at > now() - interval '30 days'
     and status <> 'removido';
  if dup_count > 0 then
    new.risk_flags := array_append(new.risk_flags, 'publicacao_repetida');
  end if;
  return new;
end $$;
create trigger animals_before_insert before insert on public.animals
  for each row execute function public.animals_before_insert();

create or replace function public.animals_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_client_request() then
    if old.moderation_locked then
      raise exception 'Este anúncio está bloqueado pela moderação.' using errcode = '42501';
    end if;
    if new.status in ('suspenso') then
      raise exception 'Status permitido somente para a moderação.' using errcode = '42501';
    end if;
    if new.owner_id is distinct from old.owner_id or new.slug is distinct from old.slug
       or new.view_count is distinct from old.view_count
       or new.health_verified is distinct from old.health_verified
       or new.moderation_locked is distinct from old.moderation_locked
       or new.published_at is distinct from old.published_at then
      raise exception 'Campo não pode ser alterado pelo usuário.' using errcode = '42501';
    end if;
    if not public.is_active_user() then
      raise exception 'Sua conta não pode editar anúncios no momento.' using errcode = '42501';
    end if;
    -- Reavalia sinais de risco quando o conteúdo muda (mantém os sinais existentes).
    if (new.description, new.story, new.personality, new.vet_info, new.name)
       is distinct from (old.description, old.story, old.personality, old.vet_info, old.name) then
      new.risk_flags := (
        select coalesce(array_agg(distinct f), '{}') from unnest(
          old.risk_flags || public.detect_risk_flags(
            concat_ws(' ', new.name, new.description, new.story, new.personality, new.vet_info, new.special_needs_details, new.region))
        ) f);
    else
      new.risk_flags := old.risk_flags;
    end if;
  end if;

  if new.city_id is distinct from old.city_id then
    select uf into new.uf from public.cities where id = new.city_id;
  end if;
  if new.status = 'adotado' and old.status <> 'adotado' then
    new.adopted_at := now();
  elsif new.status <> 'adotado' then
    new.adopted_at := null;
  end if;
  return new;
end $$;
create trigger animals_before_update before update on public.animals
  for each row execute function public.animals_before_update();

-- Notifica quem favoritou quando o animal é adotado.
create or replace function public.animals_after_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'adotado' and old.status <> 'adotado' then
    insert into public.notifications (user_id, type, title, body, link)
    select f.user_id, 'animal_adotado', new.name || ' encontrou um lar!',
           'Um animal que você favoritou foi marcado como adotado.', '/animais/' || new.slug
      from public.favorites f where f.user_id <> new.owner_id and f.animal_id = new.id;
  end if;
  return new;
end $$;
create trigger animals_after_status_change after update of status on public.animals
  for each row execute function public.animals_after_status_change();

-- Contador de visualizações (chamado pelo servidor ao abrir a página do animal).
create or replace function public.increment_animal_view(p_animal uuid)
returns void language sql security definer set search_path = '' as $$
  update public.animals set view_count = view_count + 1
   where id = p_animal and status in ('disponivel', 'adotado');
$$;

-- Imagens: máximo de 10 por animal e apenas no diretório do dono.
create or replace function public.animal_images_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.animals where id = new.animal_id;
  if public.is_client_request() then
    if v_owner is distinct from auth.uid() then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    if split_part(new.storage_path, '/', 1) <> auth.uid()::text then
      raise exception 'Caminho de imagem inválido.' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.animal_images where animal_id = new.animal_id) >= 10 then
    raise exception 'Limite de 10 fotos por animal.' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger animal_images_guard before insert or update on public.animal_images
  for each row execute function public.animal_images_guard();

-- Define a foto principal (desmarca as demais de forma atômica).
create or replace function public.set_primary_image(p_image uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_animal uuid;
begin
  select i.animal_id into v_animal from public.animal_images i
    join public.animals a on a.id = i.animal_id
   where i.id = p_image and (a.owner_id = auth.uid() or public.has_permission('animals.moderate'));
  if v_animal is null then
    raise exception 'Imagem não encontrada.' using errcode = '42501';
  end if;
  update public.animal_images set is_primary = false where animal_id = v_animal and is_primary;
  update public.animal_images set is_primary = true where id = p_image;
end $$;

-- WhatsApp: número só é revelado a usuários autenticados, com limite e se autorizado.
create or replace function public.get_animal_whatsapp(p_animal uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_number text;
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para falar pelo WhatsApp.' using errcode = '42501';
  end if;
  select c.whatsapp, a.owner_id into v_number, v_owner
    from public.animals a join public.animal_contacts c on c.animal_id = a.id
   where a.id = p_animal and a.status = 'disponivel'
     and a.contact_preference in ('whatsapp', 'ambos')
     and public.is_active_user(a.owner_id);
  if v_number is null then
    raise exception 'Contato por WhatsApp indisponível para este anúncio.' using errcode = 'P0002';
  end if;
  if public.is_blocked_between(auth.uid(), v_owner) then
    raise exception 'Contato indisponível.' using errcode = '42501';
  end if;
  if v_owner <> auth.uid() then
    perform public.enforce_rate_limit('whatsapp_reveal');
  end if;
  return v_number;
end $$;

-- -----------------------------------------------------------------------------
-- Interesse em adoção
-- -----------------------------------------------------------------------------
create or replace function public.adoption_interests_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_animal record;
begin
  select id, owner_id, status, name, slug into v_animal from public.animals where id = new.animal_id;
  if v_animal.id is null or v_animal.status <> 'disponivel' then
    raise exception 'Este animal não está disponível para adoção.' using errcode = '22023';
  end if;
  if public.is_client_request() then
    if new.interested_id is distinct from auth.uid() then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    if not public.is_active_user() then
      raise exception 'Sua conta não pode enviar interesses no momento.' using errcode = '42501';
    end if;
    if public.is_blocked_between(auth.uid(), v_animal.owner_id) then
      raise exception 'Não é possível enviar interesse para este anunciante.' using errcode = '42501';
    end if;
    perform public.enforce_rate_limit('interest_create');
    new.status := 'enviado';
    new.owner_note := null;
    new.conversation_id := null;
  end if;
  new.owner_id := v_animal.owner_id;
  if new.owner_id = new.interested_id then
    raise exception 'Você não pode demonstrar interesse no seu próprio anúncio.' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger adoption_interests_before_insert before insert on public.adoption_interests
  for each row execute function public.adoption_interests_before_insert();

create or replace function public.adoption_interests_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
begin
  select name into v_name from public.animals where id = new.animal_id;
  perform public.notify(new.owner_id, 'interesse_recebido',
    'Novo interesse em ' || v_name,
    'Alguém demonstrou interesse em adotar ' || v_name || '.',
    '/painel/interesses/recebidos');
  return new;
end $$;
create trigger adoption_interests_after_insert after insert on public.adoption_interests
  for each row execute function public.adoption_interests_after_insert();

-- Transições permitidas: interessado só cancela; anunciante analisa.
create or replace function public.adoption_interests_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_client_request() then
    if (new.animal_id, new.interested_id, new.owner_id, new.message, new.created_at, coalesce(new.housing_info, ''))
       is distinct from (old.animal_id, old.interested_id, old.owner_id, old.message, old.created_at, coalesce(old.housing_info, '')) then
      raise exception 'Campo não pode ser alterado.' using errcode = '42501';
    end if;
    if auth.uid() = old.interested_id then
      if new.status <> 'cancelado' or new.owner_note is distinct from old.owner_note then
        raise exception 'Você só pode cancelar o seu interesse.' using errcode = '42501';
      end if;
    elsif auth.uid() = old.owner_id then
      if old.status = 'cancelado' then
        raise exception 'Este interesse foi cancelado pelo interessado.' using errcode = '22023';
      end if;
      if new.status not in ('visualizado', 'em_conversa', 'aceito', 'recusado') then
        raise exception 'Status inválido.' using errcode = '22023';
      end if;
    else
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
  end if;
  if new.status is distinct from old.status and new.status in ('aceito', 'recusado') then
    perform public.notify(new.interested_id, 'interesse_atualizado',
      case new.status when 'aceito' then 'Seu interesse foi aceito para conversa'
                      else 'Seu interesse foi analisado' end,
      'O anunciante atualizou o seu pedido. Lembre-se: aceitar o interesse não conclui a adoção.',
      '/painel/interesses/enviados');
  end if;
  return new;
end $$;
create trigger adoption_interests_before_update before update on public.adoption_interests
  for each row execute function public.adoption_interests_before_update();

-- -----------------------------------------------------------------------------
-- Chat: criação de conversa e envio de mensagens
-- -----------------------------------------------------------------------------
-- Inicia (ou reaproveita) a conversa entre o usuário atual e o anunciante de um animal.
create or replace function public.start_conversation(p_animal uuid, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_accepts boolean;
  v_status public.animal_status;
  v_conv uuid;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta para conversar.' using errcode = '42501';
  end if;
  if not public.is_active_user() then
    raise exception 'Sua conta não pode enviar mensagens no momento.' using errcode = '42501';
  end if;
  select owner_id, accepts_messages, status, name into v_owner, v_accepts, v_status, v_name
    from public.animals where id = p_animal;
  if v_owner is null or v_status not in ('disponivel', 'adotado', 'pausado') then
    raise exception 'Anúncio indisponível.' using errcode = 'P0002';
  end if;
  if v_owner = auth.uid() then
    raise exception 'Você não pode iniciar uma conversa com você mesmo.' using errcode = '22023';
  end if;
  if public.is_blocked_between(auth.uid(), v_owner) then
    raise exception 'Não é possível conversar com este usuário.' using errcode = '42501';
  end if;

  select c.id into v_conv from public.conversations c
    join public.conversation_participants p1 on p1.conversation_id = c.id and p1.user_id = auth.uid()
    join public.conversation_participants p2 on p2.conversation_id = c.id and p2.user_id = v_owner
   where c.animal_id = p_animal
   limit 1;

  if v_conv is null then
    if not v_accepts or v_status <> 'disponivel' then
      raise exception 'O anunciante não está recebendo mensagens para este anúncio.' using errcode = '22023';
    end if;
    perform public.enforce_rate_limit('conversation_create');
    insert into public.conversations (animal_id, created_by) values (p_animal, auth.uid()) returning id into v_conv;
    insert into public.conversation_participants (conversation_id, user_id)
      values (v_conv, auth.uid()), (v_conv, v_owner);
    perform public.notify(v_owner, 'nova_conversa', 'Nova conversa sobre ' || v_name,
      'Você recebeu uma nova mensagem.', '/painel/conversas/' || v_conv);
  end if;

  if p_message is not null and char_length(btrim(p_message)) > 0 then
    insert into public.messages (conversation_id, sender_id, body) values (v_conv, auth.uid(), p_message);
  end if;
  perform public.set_privileged(true);
  update public.adoption_interests set conversation_id = v_conv, status = case when status in ('enviado','visualizado') then 'em_conversa' else status end
   where animal_id = p_animal and interested_id = auth.uid() and status <> 'cancelado' and conversation_id is null;
  perform public.set_privileged(false);
  return v_conv;
end $$;

-- O anunciante inicia a conversa a partir de um interesse recebido.
create or replace function public.start_conversation_from_interest(p_interest uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_int record;
  v_conv uuid;
begin
  select * into v_int from public.adoption_interests where id = p_interest and owner_id = auth.uid();
  if v_int.id is null then
    raise exception 'Interesse não encontrado.' using errcode = '42501';
  end if;
  if v_int.status = 'cancelado' then
    raise exception 'Este interesse foi cancelado.' using errcode = '22023';
  end if;
  if not public.is_active_user() or public.is_blocked_between(auth.uid(), v_int.interested_id) then
    raise exception 'Não é possível conversar com este usuário.' using errcode = '42501';
  end if;
  if v_int.conversation_id is not null then
    return v_int.conversation_id;
  end if;
  select c.id into v_conv from public.conversations c
    join public.conversation_participants p1 on p1.conversation_id = c.id and p1.user_id = auth.uid()
    join public.conversation_participants p2 on p2.conversation_id = c.id and p2.user_id = v_int.interested_id
   where c.animal_id = v_int.animal_id limit 1;
  perform public.set_privileged(true);
  if v_conv is null then
    insert into public.conversations (animal_id, created_by) values (v_int.animal_id, auth.uid()) returning id into v_conv;
    insert into public.conversation_participants (conversation_id, user_id)
      values (v_conv, auth.uid()), (v_conv, v_int.interested_id);
    insert into public.messages (conversation_id, sender_id, body)
      values (v_conv, v_int.interested_id, v_int.message);
    perform public.notify(v_int.interested_id, 'nova_conversa', 'O anunciante iniciou uma conversa',
      'Responda pelo chat do AdoteAmigo.', '/painel/conversas/' || v_conv);
  end if;
  update public.adoption_interests set conversation_id = v_conv,
         status = case when status in ('enviado', 'visualizado') then 'em_conversa' else status end
   where id = p_interest;
  perform public.set_privileged(false);
  return v_conv;
end $$;

create or replace function public.messages_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  other uuid;
begin
  if public.is_client_request() then
    if new.sender_id is distinct from auth.uid() then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
  end if;
  if not public.is_conversation_participant(new.conversation_id, new.sender_id) then
    raise exception 'Você não participa desta conversa.' using errcode = '42501';
  end if;
  if not public.is_active_user(new.sender_id) then
    raise exception 'Sua conta não pode enviar mensagens no momento.' using errcode = '42501';
  end if;
  select user_id into other from public.conversation_participants
   where conversation_id = new.conversation_id and user_id <> new.sender_id limit 1;
  if other is not null and public.is_blocked_between(new.sender_id, other) then
    raise exception 'Não é possível enviar mensagens para este usuário.' using errcode = '42501';
  end if;
  if public.is_client_request() then
    perform public.enforce_rate_limit('message_send');
  end if;
  new.body := btrim(new.body);
  new.flagged := cardinality(public.detect_risk_flags(new.body)) > 0;
  new.created_at := clock_timestamp();
  return new;
end $$;
create trigger messages_before_insert before insert on public.messages
  for each row execute function public.messages_before_insert();

create or replace function public.messages_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations
     set last_message_at = new.created_at, last_message_preview = left(new.body, 120)
   where id = new.conversation_id;
  update public.conversation_participants set last_read_at = new.created_at
   where conversation_id = new.conversation_id and user_id = new.sender_id;
  return new;
end $$;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.messages_after_insert();

create or replace function public.mark_conversation_read(p_conversation uuid)
returns void language sql security definer set search_path = '' as $$
  update public.conversation_participants set last_read_at = now()
   where conversation_id = p_conversation and user_id = auth.uid();
$$;

-- Lista de conversas do usuário com contagem de não lidas.
create or replace function public.my_conversations()
returns table (
  conversation_id uuid, animal_id uuid, animal_name text, animal_slug text,
  other_user_id uuid, other_user_name text, other_user_avatar text,
  last_message_at timestamptz, last_message_preview text, unread_count bigint, is_blocked boolean
) language sql stable security definer set search_path = '' as $$
  select c.id, a.id, a.name, a.slug,
         op.user_id, coalesce(pr.full_name, 'Usuário removido'), pr.avatar_url,
         c.last_message_at, c.last_message_preview,
         (select count(*) from public.messages m
           where m.conversation_id = c.id and m.created_at > me.last_read_at
             and m.sender_id is distinct from auth.uid()),
         public.is_blocked_between(auth.uid(), op.user_id)
    from public.conversation_participants me
    join public.conversations c on c.id = me.conversation_id
    left join public.animals a on a.id = c.animal_id
    left join public.conversation_participants op on op.conversation_id = c.id and op.user_id <> auth.uid()
    left join public.profiles pr on pr.id = op.user_id
   where me.user_id = auth.uid()
   order by c.last_message_at desc
$$;

create or replace function public.unread_messages_count()
returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from public.messages m
    join public.conversation_participants me on me.conversation_id = m.conversation_id and me.user_id = auth.uid()
   where m.created_at > me.last_read_at and m.sender_id is distinct from auth.uid()
$$;

-- -----------------------------------------------------------------------------
-- Denúncias
-- -----------------------------------------------------------------------------
create or replace function public.reports_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_client_request() then
    if new.reporter_id is distinct from auth.uid() then
      raise exception 'Operação não permitida.' using errcode = '42501';
    end if;
    perform public.enforce_rate_limit('report_create');
    new.status := 'pendente';
    new.resolved_by := null; new.resolved_at := null; new.resolution_note := null;
  end if;
  if new.target_type = 'animal' then
    if new.animal_id is null then raise exception 'Anúncio obrigatório.' using errcode = '22023'; end if;
    select owner_id into new.reported_user_id from public.animals where id = new.animal_id;
  elsif new.target_type = 'conversa' then
    if new.conversation_id is null or not public.is_conversation_participant(new.conversation_id, new.reporter_id) then
      raise exception 'Conversa inválida.' using errcode = '42501';
    end if;
    select user_id into new.reported_user_id from public.conversation_participants
     where conversation_id = new.conversation_id and user_id <> new.reporter_id limit 1;
  elsif new.reported_user_id is null then
    raise exception 'Usuário obrigatório.' using errcode = '22023';
  end if;
  if new.reported_user_id = new.reporter_id then
    raise exception 'Você não pode denunciar a si mesmo.' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger reports_before_insert before insert on public.reports
  for each row execute function public.reports_before_insert();

-- -----------------------------------------------------------------------------
-- Ações administrativas (todas auditadas)
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_animal_status(p_animal uuid, p_status public.animal_status, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old public.animal_status;
  v_owner uuid;
  v_name text;
begin
  if not public.has_permission('animals.moderate') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  if char_length(coalesce(btrim(p_reason), '')) < 3 then
    raise exception 'Informe o motivo da ação.' using errcode = '22023';
  end if;
  select status, owner_id, name into v_old, v_owner, v_name from public.animals where id = p_animal for update;
  if v_old is null then raise exception 'Anúncio não encontrado.' using errcode = 'P0002'; end if;
  perform public.set_privileged(true);
  update public.animals set status = p_status, status_reason = p_reason,
         moderation_locked = p_status in ('suspenso', 'removido')
   where id = p_animal;
  perform public.log_moderation('animal.status', 'animal', p_animal, p_reason,
    jsonb_build_object('from', v_old, 'to', p_status));
  if p_status in ('suspenso', 'removido') then
    perform public.notify(v_owner, 'moderacao', 'Seu anúncio "' || v_name || '" foi ' || p_status::text,
      'Motivo: ' || p_reason, '/painel/anuncios');
  elsif v_old in ('suspenso', 'removido') then
    perform public.notify(v_owner, 'moderacao', 'Seu anúncio "' || v_name || '" foi restaurado',
      p_reason, '/painel/anuncios');
  end if;
end $$;

create or replace function public.admin_clear_animal_flags(p_animal uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('animals.moderate') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  perform public.set_privileged(true);
  update public.animals set risk_flags = '{}' where id = p_animal;
  perform public.log_moderation('animal.clear_flags', 'animal', p_animal, p_reason, '{}');
end $$;

create or replace function public.admin_set_health_verified(p_animal uuid, p_verified boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('animals.moderate') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  perform public.set_privileged(true);
  update public.animals set health_verified = p_verified where id = p_animal;
  perform public.log_moderation('animal.health_verified', 'animal', p_animal, p_reason,
    jsonb_build_object('verified', p_verified));
end $$;

create or replace function public.admin_set_user_status(p_user uuid, p_status public.account_status, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old public.account_status;
begin
  if p_status = 'bloqueado' and not public.has_permission('users.block') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  if not public.has_permission('users.suspend') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'Você não pode alterar o status da sua própria conta.' using errcode = '22023';
  end if;
  if exists (select 1 from public.admin_roles where user_id = p_user and role = 'admin') then
    raise exception 'Não é possível alterar o status de um administrador.' using errcode = '42501';
  end if;
  if char_length(coalesce(btrim(p_reason), '')) < 3 then
    raise exception 'Informe o motivo da ação.' using errcode = '22023';
  end if;
  select account_status into v_old from public.profiles where id = p_user for update;
  if v_old is null then raise exception 'Usuário não encontrado.' using errcode = 'P0002'; end if;
  perform public.set_privileged(true);
  update public.profiles set account_status = p_status, status_reason = p_reason where id = p_user;
  perform public.log_moderation('user.status', 'usuario', p_user, p_reason,
    jsonb_build_object('from', v_old, 'to', p_status));
  perform public.notify(p_user, 'moderacao',
    case p_status when 'ativo' then 'Sua conta foi reativada' else 'Sua conta foi ' || p_status::text end,
    'Motivo: ' || p_reason, '/painel');
end $$;

create or replace function public.admin_set_profile_verified(p_user uuid, p_verified boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('organizations.verify') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  perform public.set_privileged(true);
  update public.profiles set is_verified = p_verified where id = p_user;
  update public.organizations set verified_at = case when p_verified then now() else null end where owner_id = p_user;
  update public.organization_verifications v set status = case when p_verified then 'aprovada'::public.verification_status else 'rejeitada' end,
         reviewer_id = auth.uid(), reviewer_note = p_reason, reviewed_at = now()
    from public.organizations o
   where o.id = v.organization_id and o.owner_id = p_user and v.status = 'pendente';
  perform public.log_moderation(case when p_verified then 'user.verify' else 'user.unverify' end,
    'usuario', p_user, p_reason, '{}');
  if p_verified then
    perform public.notify(p_user, 'verificacao', 'Seu perfil foi verificado',
      'A equipe do AdoteAmigo verificou o seu perfil institucional.', '/painel/perfil');
  end if;
end $$;

create or replace function public.admin_update_report(p_report uuid, p_status public.report_status, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old public.report_status;
begin
  if not public.has_permission('reports.manage') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  select status into v_old from public.reports where id = p_report for update;
  if v_old is null then raise exception 'Denúncia não encontrada.' using errcode = 'P0002'; end if;
  update public.reports set status = p_status, resolution_note = p_note,
         resolved_by = case when p_status in ('procedente', 'improcedente') then auth.uid() else resolved_by end,
         resolved_at = case when p_status in ('procedente', 'improcedente') then now() else resolved_at end
   where id = p_report;
  perform public.log_moderation('report.status', 'denuncia', p_report, p_note,
    jsonb_build_object('from', v_old, 'to', p_status));
end $$;

create or replace function public.admin_update_setting(p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('settings.manage') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  update public.platform_settings set value = p_value, updated_by = auth.uid() where key = p_key;
  perform public.log_moderation('settings.update', 'configuracao', null, p_key, jsonb_build_object('value', p_value));
end $$;

-- Painel: indicadores em uma única chamada.
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_permission('dashboard.view') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'users_total', (select count(*) from public.profiles),
    'users_new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'users_suspended', (select count(*) from public.profiles where account_status <> 'ativo'),
    'animals_total', (select count(*) from public.animals),
    'animals_available', (select count(*) from public.animals where status = 'disponivel'),
    'animals_adopted', (select count(*) from public.animals where status = 'adotado'),
    'animals_published', (select count(*) from public.animals where status in ('disponivel', 'adotado', 'pausado')),
    'animals_flagged', (select count(*) from public.animals where cardinality(risk_flags) > 0 and status not in ('removido')),
    'reports_open', (select count(*) from public.reports where status in ('pendente', 'em_analise')),
    'reported_animals', (select count(distinct animal_id) from public.reports where animal_id is not null and status in ('pendente', 'em_analise')),
    'verifications_pending', (select count(*) from public.organization_verifications where status = 'pendente')
  );
end $$;

-- -----------------------------------------------------------------------------
-- Estatísticas públicas (página inicial)
-- -----------------------------------------------------------------------------
create or replace function public.public_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'available', (select count(*) from public.animals a where status = 'disponivel' and public.is_active_user(a.owner_id)),
    'adopted', (select count(*) from public.animals where status = 'adotado'),
    'advertisers', (select count(distinct owner_id) from public.animals where status in ('disponivel', 'adotado')),
    'cities', (select count(distinct city_id) from public.animals where status in ('disponivel', 'adotado'))
  )
$$;

-- -----------------------------------------------------------------------------
-- LGPD: exportação dos dados do titular
-- -----------------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'gerado_em', now(),
    'perfil', (select to_jsonb(p) from public.profiles p where id = auth.uid()),
    'dados_privados', (select to_jsonb(pp) from public.profiles_private pp where id = auth.uid()),
    'aceites', (select coalesce(jsonb_agg(t), '[]') from public.terms_acceptances t where user_id = auth.uid()),
    'anuncios', (select coalesce(jsonb_agg(to_jsonb(a) - 'search_vector'), '[]') from public.animals a where owner_id = auth.uid()),
    'favoritos', (select coalesce(jsonb_agg(f), '[]') from public.favorites f where user_id = auth.uid()),
    'interesses_enviados', (select coalesce(jsonb_agg(i), '[]') from public.adoption_interests i where interested_id = auth.uid()),
    'mensagens_enviadas', (select coalesce(jsonb_agg(jsonb_build_object('conversa', m.conversation_id, 'texto', m.body, 'data', m.created_at)), '[]')
                            from public.messages m where sender_id = auth.uid()),
    'denuncias_feitas', (select coalesce(jsonb_agg(jsonb_build_object('motivo', r.reason, 'descricao', r.description, 'status', r.status, 'data', r.created_at)), '[]')
                          from public.reports r where reporter_id = auth.uid()),
    'notificacoes', (select coalesce(jsonb_agg(n), '[]') from public.notifications n where user_id = auth.uid())
  )
$$;

-- Limpeza periódica (pode ser agendada via pg_cron no Supabase).
create or replace function public.purge_expired_data()
returns void language sql security definer set search_path = '' as $$
  delete from public.rate_limit_events where created_at < now() - interval '7 days';
  delete from public.notifications where read_at is not null and created_at < now() - interval '180 days';
$$;
