-- =============================================================================
-- AdoteAmigo — Migration 005: mensagens do formulário de contato
-- Inserção feita somente pelo servidor (service role) após validação e
-- limitação por IP (hash). A equipe lê pelo painel administrativo.
-- =============================================================================
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  email       text not null check (char_length(email) <= 160),
  subject     text not null check (char_length(subject) between 2 and 120),
  message     text not null check (char_length(message) between 10 and 4000),
  user_id     uuid references public.profiles(id) on delete set null,
  ip_hash     text,
  handled_at  timestamptz,
  handled_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages(created_at desc);
create index contact_messages_ip_idx on public.contact_messages(ip_hash, created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant select, update (handled_at, handled_by) on public.contact_messages to authenticated;

create policy "equipe lê contatos" on public.contact_messages for select to authenticated
  using (public.has_permission('reports.manage'));
create policy "equipe marca contato como atendido" on public.contact_messages for update to authenticated
  using (public.has_permission('reports.manage')) with check (public.has_permission('reports.manage'));

-- Retenção: mensagens de contato atendidas são apagadas após 1 ano.
create or replace function public.purge_expired_data()
returns void language sql security definer set search_path = '' as $$
  delete from public.rate_limit_events where created_at < now() - interval '7 days';
  delete from public.notifications where read_at is not null and created_at < now() - interval '180 days';
  delete from public.contact_messages where handled_at is not null and created_at < now() - interval '1 year';
$$;
revoke execute on function public.purge_expired_data() from public, anon, authenticated;
