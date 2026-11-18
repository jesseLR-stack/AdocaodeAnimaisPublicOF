-- =============================================================================
-- AdoteAmigo — Migration 006: contador de favoritos por anúncio
-- A tabela favorites só é visível ao próprio usuário (RLS), então o total de
-- favoritos de um anúncio é mantido por gatilho em uma coluna própria.
-- =============================================================================
alter table public.animals add column favorite_count integer not null default 0;

update public.animals a set favorite_count = (select count(*) from public.favorites f where f.animal_id = a.id);

create or replace function public.favorites_count_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.set_privileged(true);
  if tg_op = 'INSERT' then
    update public.animals set favorite_count = favorite_count + 1 where id = new.animal_id;
  else
    update public.animals set favorite_count = greatest(favorite_count - 1, 0) where id = old.animal_id;
  end if;
  perform public.set_privileged(false);
  return null;
end $$;

create trigger favorites_count_sync after insert or delete on public.favorites
  for each row execute function public.favorites_count_sync();

-- O gatilho de updated_at não deve marcar o anúncio como "atualizado" por causa de um favorito.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'animals'
     and (to_jsonb(new) - 'favorite_count' - 'view_count' - 'updated_at')
       = (to_jsonb(old) - 'favorite_count' - 'view_count' - 'updated_at') then
    return new;
  end if;
  new.updated_at := now();
  return new;
end $$;
