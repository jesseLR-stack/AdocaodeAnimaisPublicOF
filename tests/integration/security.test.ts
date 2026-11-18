/**
 * Testes de integração das regras de banco (RLS, gatilhos e funções).
 * Requer o Supabase local rodando: `npx supabase start` e `npx supabase db reset`.
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  adminClient, anonClient, animalPayload, CITY, createUser, LEGAL, type TestUser,
} from "./helpers";

let owner: TestUser;
let adopter: TestUser;
let stranger: TestUser;
let animalId: string;

beforeAll(async () => {
  owner = await createUser({ full_name: "Ana Protetora", profile_type: "protetor_independente" });
  adopter = await createUser({ full_name: "Bruno Adotante", city_id: CITY.campinas });
  stranger = await createUser({ full_name: "Carla Terceira" });
  const { data, error } = await owner.client.from("animals").insert(animalPayload(owner.id)).select().single();
  if (error) throw error;
  animalId = data.id;
  await owner.client.from("animal_contacts").insert({ animal_id: animalId, whatsapp: "5511999998888" });
  await owner.client.from("animals").update({ contact_preference: "ambos" }).eq("id", animalId);
});

describe("cadastro", () => {
  it("cria perfil, dados privados e registra o aceite dos termos", async () => {
    const { data: profile } = await owner.client.from("profiles").select("*").eq("id", owner.id).single();
    expect(profile.full_name).toBe("Ana Protetora");
    expect(profile.uf).toBe("SP");
    expect(profile.slug).toMatch(/^ana-protetora-/);
    const { data: terms } = await owner.client.from("terms_acceptances").select("document, version");
    expect(terms).toHaveLength(4);
  });

  it("recusa menores de 18 anos", async () => {
    const year = new Date().getFullYear() - 16;
    await expect(createUser({ birth_date: `${year}-01-01` })).rejects.toThrow();
  });

  it("recusa cadastro sem aceite dos termos vigentes", async () => {
    await expect(createUser({ accepted_terms: { ...LEGAL, termos_uso: "0.9" } })).rejects.toThrow();
    await expect(createUser({ accepted_terms: {} })).rejects.toThrow();
  });
});

describe("perfis e papéis", () => {
  it("usuário não consegue se tornar administrador", async () => {
    const { error } = await owner.client.from("admin_roles").insert({ user_id: owner.id, role: "admin" });
    expect(error).not.toBeNull();
    const { data } = await adminClient().from("admin_roles").select("*").eq("user_id", owner.id);
    expect(data).toHaveLength(0);
  });

  it("usuário não altera o próprio status nem a verificação", async () => {
    const a = await owner.client.from("profiles").update({ is_verified: true }).eq("id", owner.id);
    expect(a.error).not.toBeNull();
    const b = await owner.client.from("profiles").update({ account_status: "ativo" }).eq("id", owner.id);
    expect(b.error).not.toBeNull();
    const c = await owner.client.from("profiles").update({ bio: "Protetora há 10 anos." }).eq("id", owner.id);
    expect(c.error).toBeNull();
  });

  it("dados privados (telefone e nascimento) não vazam para terceiros", async () => {
    const { data } = await stranger.client.from("profiles_private").select("*").eq("id", owner.id);
    expect(data).toHaveLength(0);
    const anon = await anonClient().from("profiles_private").select("*");
    expect(anon.error).not.toBeNull();
  });

  it("funções internas não podem ser chamadas pelo cliente", async () => {
    const r1 = await owner.client.rpc("set_privileged", { enabled: true });
    expect(r1.error).not.toBeNull();
    const r2 = await owner.client.rpc("notify", { p_user: adopter.id, p_type: "x", p_title: "spam", p_body: "", p_link: "" });
    expect(r2.error).not.toBeNull();
    const r3 = await owner.client.rpc("admin_dashboard_stats");
    expect(r3.error).not.toBeNull();
  });
});

describe("anúncios", () => {
  it("publica automaticamente com slug amigável e status disponível", async () => {
    const { data } = await anonClient().from("animals").select("slug, status, uf").eq("id", animalId).single();
    expect(data!.status).toBe("disponivel");
    expect(data!.slug).toMatch(/^bolinha-[0-9a-f]{6}$/);
    expect(data!.uf).toBe("SP");
  });

  it("ignora tentativa de publicar já com status de moderação", async () => {
    const { data } = await owner.client.from("animals")
      .insert(animalPayload(owner.id, { name: "Mimi", species: "gato" })).select("status, health_verified").single();
    expect(data!.status).toBe("disponivel");
    expect(data!.health_verified).toBe(false);
  });

  it("não permite publicar em nome de outra pessoa", async () => {
    const { error } = await stranger.client.from("animals").insert(animalPayload(owner.id));
    expect(error).not.toBeNull();
  });

  it("sinaliza possível venda, links e publicações repetidas", async () => {
    const { data } = await stranger.client.from("animals").insert(animalPayload(stranger.id, {
      name: "Rex", description: "Vendo filhote por R$ 300, pagamento via pix. Veja www.golpe.xyz",
    })).select("id, risk_flags").single();
    expect(data!.risk_flags).toEqual(expect.arrayContaining(["possivel_venda_ou_golpe", "link_externo"]));
    const { data: dup } = await stranger.client.from("animals").insert(animalPayload(stranger.id, { name: "Rex" }))
      .select("risk_flags").single();
    expect(dup!.risk_flags).toContain("publicacao_repetida");
  });

  it("dono não pode suspender, mas pode pausar; pausado some do público", async () => {
    const s = await owner.client.from("animals").update({ status: "suspenso" }).eq("id", animalId);
    expect(s.error).not.toBeNull();
    await owner.client.from("animals").update({ status: "pausado" }).eq("id", animalId);
    const { data } = await anonClient().from("animals").select("id").eq("id", animalId);
    expect(data).toHaveLength(0);
    await owner.client.from("animals").update({ status: "disponivel" }).eq("id", animalId);
  });

  it("terceiros não editam anúncios alheios", async () => {
    const { data } = await stranger.client.from("animals").update({ name: "Hackeado" }).eq("id", animalId).select();
    expect(data).toHaveLength(0);
  });

  it("aplica limite anti-spam de publicações", async () => {
    const spammer = await createUser();
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push(await spammer.client.from("animals").insert(animalPayload(spammer.id, { name: `Animal ${i}` })));
    }
    expect(results.slice(0, 5).every((r) => r.error === null)).toBe(true);
    expect(results[5].error?.message).toMatch(/Limite/);
  });
});

describe("contato por WhatsApp", () => {
  it("número não é legível diretamente por terceiros", async () => {
    const { data } = await adopter.client.from("animal_contacts").select("*").eq("animal_id", animalId);
    expect(data).toHaveLength(0);
  });

  it("exige login para revelar o número", async () => {
    const anon = await anonClient().rpc("get_animal_whatsapp", { p_animal: animalId });
    expect(anon.error).not.toBeNull();
    const ok = await adopter.client.rpc("get_animal_whatsapp", { p_animal: animalId });
    expect(ok.data).toBe("5511999998888");
  });
});

describe("favoritos", () => {
  it("impede duplicados e isola a lista de cada usuário", async () => {
    const first = await adopter.client.from("favorites").insert({ user_id: adopter.id, animal_id: animalId });
    expect(first.error).toBeNull();
    const dup = await adopter.client.from("favorites").insert({ user_id: adopter.id, animal_id: animalId });
    expect(dup.error).not.toBeNull();
    const { data } = await stranger.client.from("favorites").select("*");
    expect(data).toHaveLength(0);
  });
});

describe("interesse em adoção", () => {
  let interestId: string;

  it("não permite interesse no próprio anúncio", async () => {
    const { error } = await owner.client.from("adoption_interests")
      .insert({ animal_id: animalId, interested_id: owner.id, message: "Quero adotar meu próprio cão" });
    expect(error).not.toBeNull();
  });

  it("registra interesse e notifica o anunciante", async () => {
    const { data, error } = await adopter.client.from("adoption_interests").insert({
      animal_id: animalId, interested_id: adopter.id, message: "Olá! Tenho quintal e muito carinho para dar.",
    }).select().single();
    expect(error).toBeNull();
    expect(data.owner_id).toBe(owner.id);
    interestId = data.id;
    const { data: notes } = await owner.client.from("notifications").select("type").eq("type", "interesse_recebido");
    expect(notes!.length).toBeGreaterThan(0);
  });

  it("interessado só pode cancelar; anunciante analisa", async () => {
    const bad = await adopter.client.from("adoption_interests").update({ status: "aceito" }).eq("id", interestId);
    expect(bad.error).not.toBeNull();
    const good = await owner.client.from("adoption_interests").update({ status: "visualizado" }).eq("id", interestId);
    expect(good.error).toBeNull();
    const { data } = await stranger.client.from("adoption_interests").select("*").eq("id", interestId);
    expect(data).toHaveLength(0);
  });
});

describe("chat interno", () => {
  let conversationId: string;

  it("cria conversa apenas entre as partes", async () => {
    const { data, error } = await adopter.client.rpc("start_conversation", {
      p_animal: animalId, p_message: "Oi, podemos conversar sobre o Bolinha?",
    });
    expect(error).toBeNull();
    conversationId = data;
    const again = await adopter.client.rpc("start_conversation", { p_animal: animalId, p_message: null });
    expect(again.data).toBe(conversationId);
  });

  it("terceiros não leem nem escrevem na conversa", async () => {
    const read = await stranger.client.from("messages").select("*").eq("conversation_id", conversationId);
    expect(read.data).toHaveLength(0);
    const write = await stranger.client.from("messages")
      .insert({ conversation_id: conversationId, sender_id: stranger.id, body: "intruso" });
    expect(write.error).not.toBeNull();
  });

  it("indica mensagens não lidas e marca como lidas", async () => {
    const { data } = await owner.client.rpc("unread_messages_count");
    expect(Number(data)).toBeGreaterThan(0);
    await owner.client.rpc("mark_conversation_read", { p_conversation: conversationId });
    const after = await owner.client.rpc("unread_messages_count");
    expect(Number(after.data)).toBe(0);
  });

  it("bloqueio impede novas mensagens", async () => {
    await owner.client.from("user_blocks").insert({ blocker_id: owner.id, blocked_id: adopter.id });
    const { error } = await adopter.client.from("messages")
      .insert({ conversation_id: conversationId, sender_id: adopter.id, body: "Ainda está aí?" });
    expect(error).not.toBeNull();
    await owner.client.from("user_blocks").delete().eq("blocked_id", adopter.id);
  });

  it("equipe só acessa conversas denunciadas", async () => {
    const mod = await createUser({ full_name: "Moderadora" });
    await adminClient().from("admin_roles").insert({ user_id: mod.id, role: "moderador" });
    const before = await mod.client.from("messages").select("id").eq("conversation_id", conversationId);
    expect(before.data).toHaveLength(0);
    await owner.client.from("reports").insert({
      reporter_id: owner.id, target_type: "conversa", conversation_id: conversationId, reason: "assedio",
    });
    const after = await mod.client.from("messages").select("id").eq("conversation_id", conversationId);
    expect(after.data!.length).toBeGreaterThan(0);
  });
});

describe("moderação", () => {
  let admin: TestUser;
  let moderator: TestUser;

  beforeAll(async () => {
    admin = await createUser({ full_name: "Admin Geral" });
    moderator = await createUser({ full_name: "Moderador" });
    await adminClient().from("admin_roles").insert([
      { user_id: admin.id, role: "admin" },
      { user_id: moderator.id, role: "moderador" },
    ]);
  });

  it("usuário comum não executa ações administrativas", async () => {
    const { error } = await owner.client.rpc("admin_set_animal_status", {
      p_animal: animalId, p_status: "suspenso", p_reason: "teste",
    });
    expect(error).not.toBeNull();
  });

  it("suspende anúncio, bloqueia edição do dono e registra auditoria", async () => {
    const { error } = await moderator.client.rpc("admin_set_animal_status", {
      p_animal: animalId, p_status: "suspenso", p_reason: "Denúncia de informação falsa",
    });
    expect(error).toBeNull();
    const edit = await owner.client.from("animals").update({ status: "disponivel" }).eq("id", animalId);
    expect(edit.error).not.toBeNull();
    const { data: logs } = await admin.client.from("moderation_logs").select("*").eq("target_id", animalId);
    expect(logs!.length).toBeGreaterThan(0);
    await moderator.client.rpc("admin_set_animal_status", {
      p_animal: animalId, p_status: "disponivel", p_reason: "Restaurado após análise",
    });
    const { data } = await anonClient().from("animals").select("status").eq("id", animalId).single();
    expect(data!.status).toBe("disponivel");
  });

  it("moderador suspende, mas apenas admin bloqueia contas", async () => {
    const block = await moderator.client.rpc("admin_set_user_status", {
      p_user: stranger.id, p_status: "bloqueado", p_reason: "Golpe",
    });
    expect(block.error).not.toBeNull();
    const suspend = await moderator.client.rpc("admin_set_user_status", {
      p_user: stranger.id, p_status: "suspenso", p_reason: "Anúncios suspeitos",
    });
    expect(suspend.error).toBeNull();
    // Conta suspensa: anúncios saem do ar e não pode publicar.
    const { data } = await anonClient().from("animals").select("id").eq("owner_id", stranger.id);
    expect(data).toHaveLength(0);
    const pub = await stranger.client.from("animals").insert(animalPayload(stranger.id, { name: "Novo" }));
    expect(pub.error).not.toBeNull();
    await admin.client.rpc("admin_set_user_status", { p_user: stranger.id, p_status: "ativo", p_reason: "Reativado" });
  });

  it("admin vê o painel com indicadores", async () => {
    const { data, error } = await admin.client.rpc("admin_dashboard_stats");
    expect(error).toBeNull();
    expect(data.users_total).toBeGreaterThan(0);
  });
});

describe("busca do catálogo", () => {
  it("filtra por espécie, texto e distância", async () => {
    const anon = anonClient();
    const cats = await anon.rpc("search_animals", { p_species: ["gato"] });
    expect(cats.error).toBeNull();
    expect(cats.data!.every((a: { species: string }) => a.species === "gato")).toBe(true);

    const text = await anon.rpc("search_animals", { p_query: "bolinha" });
    expect(text.data!.some((a: { id: string }) => a.id === animalId)).toBe(true);

    // Campinas fica a ~85 km de São Paulo; Manaus a ~2.700 km.
    const near = await anon.rpc("search_animals", { p_ref_city: CITY.campinas, p_radius_km: 100 });
    expect(near.data!.some((a: { id: string }) => a.id === animalId)).toBe(true);
    const far = await anon.rpc("search_animals", { p_ref_city: CITY.manaus, p_radius_km: 100 });
    expect(far.data!.some((a: { id: string }) => a.id === animalId)).toBe(false);
  });
});
