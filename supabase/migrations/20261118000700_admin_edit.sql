-- =============================================================================
-- AdoteAmigo — Migration 007: edição de anúncios pela moderação
-- =============================================================================
create or replace function public.admin_update_animal(
  p_animal uuid, p_name text, p_description text, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_old record;
begin
  if not public.has_permission('animals.moderate') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  if char_length(coalesce(btrim(p_reason), '')) < 3 then
    raise exception 'Informe o motivo da ação.' using errcode = '22023';
  end if;
  select name, description, owner_id into v_old from public.animals where id = p_animal for update;
  if v_old is null then raise exception 'Anúncio não encontrado.' using errcode = 'P0002'; end if;
  perform public.set_privileged(true);
  update public.animals set name = btrim(p_name), description = btrim(p_description) where id = p_animal;
  perform public.log_moderation('animal.edit', 'animal', p_animal, p_reason,
    jsonb_build_object('before', jsonb_build_object('name', v_old.name, 'description', v_old.description)));
  perform public.notify(v_old.owner_id, 'moderacao', 'Seu anúncio foi ajustado pela moderação', 'Motivo: ' || p_reason, '/painel/anuncios');
end $$;

-- Marca um anúncio como inadequado: suspende e registra a sinalização.
create or replace function public.admin_flag_inappropriate(p_animal uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('animals.moderate') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  perform public.set_privileged(true);
  update public.animals set risk_flags = (select array_agg(distinct f) from unnest(risk_flags || array['inadequado']) f)
   where id = p_animal;
  perform public.admin_set_animal_status(p_animal, 'suspenso', p_reason);
end $$;

-- Marca contato como atendido (auditoria).
create or replace function public.admin_mark_contact_handled(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('reports.manage') then
    raise exception 'Permissão negada.' using errcode = '42501';
  end if;
  update public.contact_messages set handled_at = now(), handled_by = auth.uid() where id = p_id;
  perform public.log_moderation('contact.handled', 'contato', p_id, null, '{}');
end $$;

revoke execute on function public.admin_update_animal(uuid, text, text, text) from public, anon;
revoke execute on function public.admin_flag_inappropriate(uuid, text) from public, anon;
revoke execute on function public.admin_mark_contact_handled(uuid) from public, anon;
grant execute on function public.admin_update_animal(uuid, text, text, text) to authenticated;
grant execute on function public.admin_flag_inappropriate(uuid, text) to authenticated;
grant execute on function public.admin_mark_contact_handled(uuid) to authenticated;
