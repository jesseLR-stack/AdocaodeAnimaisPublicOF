-- =============================================================================
-- AdoteAmigo — Migration 001: extensões, tipos e tabelas
-- =============================================================================
-- Convenções:
--   * Todas as tabelas no schema "public" têm RLS habilitado (migration 004).
--   * Timestamps em timestamptz; updated_at mantido por trigger.
--   * Referências a usuários usam profiles(id), que espelha auth.users(id).
--   * Registros de auditoria (moderation_logs) NÃO usam FK para sobreviver à
--     exclusão de contas (retenção para fins de segurança/LGPD art. 16, II).
-- =============================================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
create type public.profile_type as enum (
  'pessoa_fisica', 'protetor_independente', 'ong_abrigo', 'organizacao_parceira'
);
create type public.account_status as enum ('ativo', 'suspenso', 'bloqueado');
create type public.animal_species as enum ('cachorro', 'gato', 'outro');
create type public.animal_sex as enum ('macho', 'femea');
create type public.animal_size as enum ('pequeno', 'medio', 'grande');
create type public.animal_age_group as enum ('filhote', 'jovem', 'adulto', 'idoso');
create type public.animal_status as enum ('disponivel', 'adotado', 'pausado', 'suspenso', 'removido');
create type public.health_info as enum ('sim', 'nao', 'parcial', 'nao_informado');
create type public.contact_preference as enum ('chat', 'whatsapp', 'ambos');
create type public.interest_status as enum ('enviado', 'visualizado', 'em_conversa', 'aceito', 'recusado', 'cancelado');
create type public.report_target as enum ('animal', 'usuario', 'conversa');
create type public.report_reason as enum (
  'golpe', 'venda_de_animal', 'maus_tratos', 'informacao_falsa',
  'spam', 'conteudo_inadequado', 'assedio', 'outro'
);
create type public.report_status as enum ('pendente', 'em_analise', 'procedente', 'improcedente');
create type public.staff_role as enum ('admin', 'moderador');
create type public.verification_status as enum ('pendente', 'aprovada', 'rejeitada');
create type public.legal_document as enum (
  'termos_uso', 'politica_privacidade', 'diretrizes_comunidade', 'politica_adocao'
);

-- -----------------------------------------------------------------------------
-- Função utilitária: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Remove acentos e normaliza para buscas (imutável para uso em índices).
create or replace function public.normalize_text(value text)
returns text language sql immutable parallel safe as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')))
$$;

-- -----------------------------------------------------------------------------
-- Localidades (dados de referência IBGE)
-- -----------------------------------------------------------------------------
create table public.states (
  uf      char(2) primary key,
  name    text not null,
  region  text not null
);

create table public.cities (
  id          integer primary key,          -- código IBGE
  name        text not null,
  slug        text not null unique,
  uf          char(2) not null references public.states(uf),
  latitude    double precision not null,
  longitude   double precision not null,
  is_capital  boolean not null default false
);
create index cities_uf_idx on public.cities(uf);
create index cities_name_trgm_idx on public.cities using gin (public.normalize_text(name) extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Perfis
-- -----------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null check (char_length(full_name) between 2 and 80),
  slug            text not null unique,
  avatar_url      text,
  bio             text check (char_length(bio) <= 600),
  profile_type    public.profile_type not null default 'pessoa_fisica',
  city_id         integer references public.cities(id),
  uf              char(2) references public.states(uf),
  is_verified     boolean not null default false,  -- só alterado pela moderação
  account_status  public.account_status not null default 'ativo',
  status_reason   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index profiles_type_idx on public.profiles(profile_type);
create index profiles_status_idx on public.profiles(account_status);
create index profiles_name_trgm_idx on public.profiles using gin (public.normalize_text(full_name) extensions.gin_trgm_ops);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Dados pessoais que nunca são públicos (somente o titular e a equipe).
create table public.profiles_private (
  id          uuid primary key references public.profiles(id) on delete cascade,
  phone       text check (phone ~ '^[0-9]{10,13}$'),
  birth_date  date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_private_updated_at before update on public.profiles_private
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Organizações (ONGs, abrigos, parceiros) e verificações
-- -----------------------------------------------------------------------------
create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null unique references public.profiles(id) on delete cascade,
  name         text not null check (char_length(name) between 2 and 120),
  slug         text not null unique,
  description  text check (char_length(description) <= 2000),
  cnpj         text check (cnpj ~ '^[0-9]{14}$'),
  website      text,
  instagram    text,
  city_id      integer references public.cities(id),
  uf           char(2) references public.states(uf),
  verified_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger organizations_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_verifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  requested_by     uuid references public.profiles(id) on delete set null,
  status           public.verification_status not null default 'pendente',
  message          text check (char_length(message) <= 2000),
  reviewer_id      uuid references public.profiles(id) on delete set null,
  reviewer_note    text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index org_verifications_status_idx on public.organization_verifications(status, created_at desc);
create unique index org_verifications_one_pending on public.organization_verifications(organization_id)
  where status = 'pendente';

-- -----------------------------------------------------------------------------
-- Animais
-- -----------------------------------------------------------------------------
create table public.animals (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  owner_id              uuid not null references public.profiles(id) on delete cascade,
  name                  text not null check (char_length(name) between 1 and 60),
  species               public.animal_species not null,
  species_other         text check (char_length(species_other) <= 40),
  breed                 text check (char_length(breed) <= 60),
  age_group             public.animal_age_group not null,
  age_months            integer check (age_months between 0 and 360),
  sex                   public.animal_sex not null,
  size                  public.animal_size not null,
  description           text not null check (char_length(description) between 20 and 3000),
  story                 text check (char_length(story) <= 3000),
  personality           text check (char_length(personality) <= 1500),
  temperament           text[] not null default '{}' check (cardinality(temperament) <= 10),
  good_with             text[] not null default '{}' check (cardinality(good_with) <= 5),
  vaccinated            public.health_info not null default 'nao_informado',
  neutered              public.health_info not null default 'nao_informado',
  dewormed              public.health_info not null default 'nao_informado',
  vet_info              text check (char_length(vet_info) <= 1500),
  health_verified       boolean not null default false, -- informação declarada vs. verificada
  special_needs         boolean not null default false,
  special_needs_details text check (char_length(special_needs_details) <= 1500),
  city_id               integer not null references public.cities(id),
  uf                    char(2) not null references public.states(uf),
  region                text check (char_length(region) <= 80), -- bairro/região aproximada
  contact_preference    public.contact_preference not null default 'chat',
  accepts_messages      boolean not null default true,
  status                public.animal_status not null default 'disponivel',
  status_reason         text,
  moderation_locked     boolean not null default false, -- suspenso/removido pela equipe
  risk_flags            text[] not null default '{}',   -- sinais automáticos de risco
  view_count            integer not null default 0,
  search_vector         tsvector,
  published_at          timestamptz not null default now(),
  adopted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint special_needs_details_required
    check (not special_needs or char_length(coalesce(special_needs_details, '')) >= 5),
  constraint species_other_required
    check (species <> 'outro' or char_length(coalesce(species_other, '')) >= 2)
);
create index animals_public_idx on public.animals(status, published_at desc);
create index animals_owner_idx on public.animals(owner_id, created_at desc);
create index animals_filters_idx on public.animals(species, size, sex, age_group) where status = 'disponivel';
create index animals_location_idx on public.animals(uf, city_id);
create index animals_updated_idx on public.animals(updated_at desc);
create index animals_views_idx on public.animals(view_count desc);
create index animals_search_idx on public.animals using gin(search_vector);
create index animals_breed_trgm_idx on public.animals using gin (public.normalize_text(breed) extensions.gin_trgm_ops);
create index animals_flagged_idx on public.animals(created_at desc) where cardinality(risk_flags) > 0;
create trigger animals_updated_at before update on public.animals
  for each row execute function public.set_updated_at();

-- Contatos do anúncio: nunca expostos diretamente (acesso por função controlada).
create table public.animal_contacts (
  animal_id   uuid primary key references public.animals(id) on delete cascade,
  whatsapp    text check (whatsapp ~ '^[0-9]{12,13}$'),  -- formato 55DDXXXXXXXXX
  phone       text check (phone ~ '^[0-9]{10,13}$'),
  updated_at  timestamptz not null default now()
);
create trigger animal_contacts_updated_at before update on public.animal_contacts
  for each row execute function public.set_updated_at();

create table public.animal_images (
  id            uuid primary key default gen_random_uuid(),
  animal_id     uuid not null references public.animals(id) on delete cascade,
  storage_path  text not null unique,
  position      smallint not null default 0 check (position between 0 and 9),
  is_primary    boolean not null default false,
  width         integer,
  height        integer,
  alt_text      text check (char_length(alt_text) <= 200),
  created_at    timestamptz not null default now()
);
create index animal_images_animal_idx on public.animal_images(animal_id, position);
create unique index animal_images_one_primary on public.animal_images(animal_id) where is_primary;

-- -----------------------------------------------------------------------------
-- Favoritos e interesses
-- -----------------------------------------------------------------------------
create table public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  animal_id   uuid not null references public.animals(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, animal_id)          -- impede favoritos duplicados
);
create index favorites_animal_idx on public.favorites(animal_id);

create table public.adoption_interests (
  id             uuid primary key default gen_random_uuid(),
  animal_id      uuid not null references public.animals(id) on delete cascade,
  interested_id  uuid not null references public.profiles(id) on delete cascade,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  message        text not null check (char_length(message) between 10 and 1500),
  housing_info   text check (char_length(housing_info) <= 500),
  status         public.interest_status not null default 'enviado',
  owner_note     text check (char_length(owner_note) <= 500),
  conversation_id uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (interested_id <> owner_id)
);
create unique index adoption_interests_one_active
  on public.adoption_interests(animal_id, interested_id) where status <> 'cancelado';
create index adoption_interests_owner_idx on public.adoption_interests(owner_id, created_at desc);
create index adoption_interests_interested_idx on public.adoption_interests(interested_id, created_at desc);
create trigger adoption_interests_updated_at before update on public.adoption_interests
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Chat interno
-- -----------------------------------------------------------------------------
create table public.conversations (
  id               uuid primary key default gen_random_uuid(),
  animal_id        uuid references public.animals(id) on delete set null,
  created_by       uuid references public.profiles(id) on delete set null,
  last_message_at  timestamptz not null default now(),
  last_message_preview text,
  created_at       timestamptz not null default now()
);
create index conversations_last_msg_idx on public.conversations(last_message_at desc);

alter table public.adoption_interests
  add constraint adoption_interests_conversation_fk
  foreign key (conversation_id) references public.conversations(id) on delete set null;

create table public.conversation_participants (
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  last_read_at     timestamptz not null default now(),
  joined_at        timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index conversation_participants_user_idx on public.conversation_participants(user_id);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid references public.profiles(id) on delete set null,
  body             text not null check (char_length(btrim(body)) between 1 and 2000),
  flagged          boolean not null default false,
  created_at       timestamptz not null default now()
);
create index messages_conversation_idx on public.messages(conversation_id, created_at desc);

create table public.user_blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index user_blocks_blocked_idx on public.user_blocks(blocked_id);

-- -----------------------------------------------------------------------------
-- Denúncias, notificações, termos e moderação
-- -----------------------------------------------------------------------------
create table public.reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid references public.profiles(id) on delete set null,
  target_type       public.report_target not null,
  animal_id         uuid references public.animals(id) on delete set null,
  reported_user_id  uuid references public.profiles(id) on delete set null,
  conversation_id   uuid references public.conversations(id) on delete set null,
  reason            public.report_reason not null,
  description       text check (char_length(description) <= 2000),
  status            public.report_status not null default 'pendente',
  resolved_by       uuid references public.profiles(id) on delete set null,
  resolution_note   text check (char_length(resolution_note) <= 2000),
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index reports_status_idx on public.reports(status, created_at desc);
create index reports_animal_idx on public.reports(animal_id);
create index reports_user_idx on public.reports(reported_user_id);
create index reports_conversation_idx on public.reports(conversation_id);
create unique index reports_one_open_per_reporter on public.reports
  (reporter_id, target_type, coalesce(animal_id, reported_user_id, conversation_id))
  where status in ('pendente', 'em_analise');
create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;

create table public.terms_acceptances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  document     public.legal_document not null,
  version      text not null,
  accepted_at  timestamptz not null default now(),
  unique (user_id, document, version)
);

create table public.moderation_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid,                -- sem FK: o registro sobrevive à exclusão da conta
  actor_role   text,
  action       text not null,
  target_type  text not null,
  target_id    uuid,
  reason       text,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
create index moderation_logs_target_idx on public.moderation_logs(target_type, target_id, created_at desc);
create index moderation_logs_created_idx on public.moderation_logs(created_at desc);

-- Papéis da equipe. Escrita SOMENTE pelo backend (service role / SQL).
create table public.admin_roles (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  role        public.staff_role not null,
  granted_by  uuid,
  granted_at  timestamptz not null default now()
);

-- Permissões por papel (permite criar moderadores sem acesso total).
create table public.staff_permissions (
  role        public.staff_role not null,
  permission  text not null,
  primary key (role, permission)
);

create table public.platform_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid,
  updated_at  timestamptz not null default now()
);
create trigger platform_settings_updated_at before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- Controle de taxa (anti-spam) feito no próprio banco.
create table public.rate_limit_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  action      text not null,
  created_at  timestamptz not null default now()
);
create index rate_limit_events_lookup_idx on public.rate_limit_events(user_id, action, created_at desc);

-- Histórias de adoção (depoimentos opcionais após "adotado").
create table public.adoption_stories (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid references public.animals(id) on delete set null,
  author_id   uuid references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 3 and 100),
  body        text not null check (char_length(body) between 20 and 2000),
  is_published boolean not null default true,
  created_at  timestamptz not null default now()
);
create index adoption_stories_created_idx on public.adoption_stories(created_at desc) where is_published;
