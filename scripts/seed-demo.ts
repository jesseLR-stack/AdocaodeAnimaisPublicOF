/**
 * Popula o banco com dados de DEMONSTRAÇÃO (usuários, animais, histórias, interesses e conversas).
 *
 * Uso:   npm run seed
 * Requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.
 *
 * Fotos: coloque arquivos em scripts/seed-images/ com o nome do animal em minúsculas
 * (ex.: paçoca.jpg ou pacoca.jpg, mel.webp). Animais sem foto usam a ilustração padrão.
 * Use apenas fotos suas ou com licença livre (ex.: Unsplash/Pexels).
 *
 * O script é idempotente para os usuários: se o e-mail já existir, ele é reaproveitado.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const PASSWORD = process.env.SEED_PASSWORD ?? "Adote@2026";
const LEGAL = { termos_uso: "1.0", politica_privacidade: "1.0", diretrizes_comunidade: "1.0", politica_adocao: "1.0" };
const C = {
  saoPaulo: 3550308, campinas: 3509502, rio: 3304557, bh: 3106200, curitiba: 4106902,
  portoAlegre: 4314902, salvador: 2927408, recife: 2611606, florianopolis: 4205407, goiania: 5208707,
};

type SeedUser = {
  key: string; email: string; name: string; type: string; city: number; bio?: string;
  verified?: boolean; role?: "admin" | "moderador";
};

const USERS: SeedUser[] = [
  { key: "admin", email: "admin@adoteamigo.demo", name: "Equipe AdoteAmigo", type: "organizacao_parceira", city: C.saoPaulo, role: "admin", verified: true,
    bio: "Conta da equipe de moderação do AdoteAmigo." },
  { key: "moderador", email: "moderador@adoteamigo.demo", name: "Rafael Moderador", type: "pessoa_fisica", city: C.campinas, role: "moderador" },
  { key: "ong", email: "ong@adoteamigo.demo", name: "Instituto Patas Unidas", type: "ong_abrigo", city: C.saoPaulo, verified: true,
    bio: "ONG que resgata, castra e encaminha para adoção cães e gatos da zona sul de São Paulo desde 2014." },
  { key: "abrigo", email: "abrigo@adoteamigo.demo", name: "Abrigo Lar Feliz", type: "ong_abrigo", city: C.curitiba, verified: true,
    bio: "Abrigo comunitário com mais de 80 animais. Visitas aos sábados mediante agendamento." },
  { key: "protetora", email: "protetora@adoteamigo.demo", name: "Juliana Almeida", type: "protetor_independente", city: C.bh,
    bio: "Protetora independente. Resgato gatinhos de rua e cuido até encontrarem um lar." },
  { key: "protetor2", email: "protetor@adoteamigo.demo", name: "Marcos Vieira", type: "protetor_independente", city: C.rio,
    bio: "Ajudo cães abandonados na Baixada. Todos saem castrados e vacinados." },
  { key: "tutora", email: "tutora@adoteamigo.demo", name: "Fernanda Costa", type: "pessoa_fisica", city: C.portoAlegre },
  { key: "adotante", email: "adotante@adoteamigo.demo", name: "Lucas Pereira", type: "pessoa_fisica", city: C.campinas },
];

type SeedAnimal = {
  owner: string; name: string; species: "cachorro" | "gato" | "outro"; species_other?: string; breed?: string;
  age_group: "filhote" | "jovem" | "adulto" | "idoso"; age_months: number; sex: "macho" | "femea";
  size: "pequeno" | "medio" | "grande"; city: number; region?: string; description: string; story?: string;
  personality?: string; temperament: string[]; good_with: string[];
  vaccinated: string; neutered: string; dewormed: string; vet_info?: string;
  special_needs?: string; status?: "adotado"; views: number; contact?: "chat" | "whatsapp" | "ambos"; whatsapp?: string;
};

const ANIMALS: SeedAnimal[] = [
  { owner: "ong", name: "Paçoca", species: "cachorro", breed: "Sem raça definida", age_group: "adulto", age_months: 48, sex: "macho", size: "medio",
    city: C.saoPaulo, region: "Zona Sul", views: 312, contact: "ambos", whatsapp: "5511987654321",
    description: "Paçoca é um cão super companheiro, adora passear de coleira e se dá bem com crianças. Está pronto para ganhar uma família!",
    story: "Foi resgatado de uma obra abandonada em 2023, magrinho e assustado. Hoje é o xodó dos voluntários.",
    personality: "Carinhoso, brincalhão e muito obediente. Aprende comandos rapidinho.",
    temperament: ["Carinhoso", "Brincalhão", "Companheiro"], good_with: ["Crianças", "Cães"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim", vet_info: "V10 e antirrábica em dia. Castrado em 2024." },
  { owner: "ong", name: "Mel", species: "gato", breed: "Sem raça definida", age_group: "jovem", age_months: 18, sex: "femea", size: "pequeno",
    city: C.saoPaulo, region: "Santo Amaro", views: 270,
    description: "Mel é uma gatinha tricolor muito dócil, que ama colo e janelas com sol. Ideal para apartamento com telas.",
    personality: "Calma, carinhosa e um pouquinho tímida no primeiro dia.",
    temperament: ["Calmo", "Carinhoso", "Dorminhoco"], good_with: ["Apartamento", "Gatos", "Idosos"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim", vet_info: "Testada negativa para FIV/FeLV." },
  { owner: "protetora", name: "Biscoito", species: "gato", breed: "Sem raça definida", age_group: "filhote", age_months: 3, sex: "macho", size: "pequeno",
    city: C.bh, region: "Pampulha", views: 198, contact: "ambos", whatsapp: "5531991234567",
    description: "Filhote laranjinha cheio de energia! Já usa a caixinha de areia e come ração seca.",
    story: "Encontrado com os irmãos dentro de uma caixa na porta de um mercado.",
    temperament: ["Brincalhão", "Curioso", "Agitado"], good_with: ["Crianças", "Gatos"],
    vaccinated: "parcial", neutered: "nao", dewormed: "sim", vet_info: "Primeira dose da V4 aplicada. Castração gratuita garantida aos 6 meses." },
  { owner: "protetor2", name: "Thor", species: "cachorro", breed: "Pastor-alemão (mestiço)", age_group: "adulto", age_months: 60, sex: "macho", size: "grande",
    city: C.rio, region: "Nova Iguaçu", views: 156,
    description: "Thor é grande no tamanho e no coração. Precisa de casa com quintal e tutores com experiência em cães de porte grande.",
    personality: "Protetor e leal. Leva um tempinho para confiar em pessoas novas.",
    temperament: ["Protetor", "Companheiro", "Calmo"], good_with: ["Idosos"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim" },
  { owner: "abrigo", name: "Dona Benta", species: "cachorro", breed: "Sem raça definida", age_group: "idoso", age_months: 132, sex: "femea", size: "pequeno",
    city: C.curitiba, views: 143,
    description: "Uma senhorinha doce que só quer um sofá e companhia. Perfeita para quem procura um cão tranquilo.",
    story: "Viveu 10 anos com uma família que se mudou e a deixou no abrigo.",
    temperament: ["Calmo", "Carinhoso", "Dorminhoco"], good_with: ["Apartamento", "Idosos", "Crianças"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim", special_needs: "Toma medicação diária para o coração (comprimido barato, fornecido pelo abrigo nos 3 primeiros meses)." },
  { owner: "abrigo", name: "Nino", species: "cachorro", breed: "Vira-lata caramelo", age_group: "jovem", age_months: 20, sex: "macho", size: "medio",
    city: C.curitiba, views: 121,
    description: "O legítimo caramelo brasileiro: animado, simpático e louco por bolinhas.",
    temperament: ["Brincalhão", "Sociável", "Agitado"], good_with: ["Crianças", "Cães"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim" },
  { owner: "protetora", name: "Luna", species: "gato", breed: "Siamês (mestiça)", age_group: "adulto", age_months: 36, sex: "femea", size: "pequeno",
    city: C.bh, views: 98,
    description: "Luna é conversadeira e muito apegada. Ela escolhe uma pessoa da casa e vira sua sombra.",
    temperament: ["Carinhoso", "Curioso"], good_with: ["Apartamento"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim" },
  { owner: "tutora", name: "Pipoca", species: "outro", species_other: "Coelho", breed: "Mini Lop", age_group: "jovem", age_months: 14, sex: "femea", size: "pequeno",
    city: C.portoAlegre, views: 87,
    description: "Coelhinha mansa que vive solta em casa. Estou mudando para outro país e procuro alguém que conheça os cuidados com coelhos.",
    temperament: ["Calmo", "Curioso"], good_with: ["Apartamento", "Crianças"],
    vaccinated: "nao_informado", neutered: "sim", dewormed: "sim", vet_info: "Acompanhada por veterinário de exóticos. Alimentação: feno à vontade e verduras." },
  { owner: "protetor2", name: "Amora", species: "cachorro", breed: "Sem raça definida", age_group: "filhote", age_months: 4, sex: "femea", size: "medio",
    city: C.rio, region: "Duque de Caxias", views: 76,
    description: "Amora é uma filhotinha pretinha de olhos expressivos. Vai ficar de porte médio.",
    temperament: ["Brincalhão", "Sociável", "Comilão"], good_with: ["Crianças", "Cães", "Gatos"],
    vaccinated: "parcial", neutered: "nao", dewormed: "sim" },
  { owner: "ong", name: "Tigrão", species: "gato", breed: "Sem raça definida", age_group: "adulto", age_months: 72, sex: "macho", size: "medio",
    city: C.saoPaulo, views: 64,
    description: "Gato rajado tranquilo, convive bem com outros gatos. Tem apenas um olho, mas isso não o atrapalha em nada.",
    temperament: ["Independente", "Calmo"], good_with: ["Gatos", "Apartamento"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim", special_needs: "Perdeu um olho por infecção antes do resgate. Não precisa de cuidados contínuos." },
  { owner: "tutora", name: "Fred", species: "outro", species_other: "Calopsita", age_group: "adulto", age_months: 40, sex: "macho", size: "pequeno",
    city: C.portoAlegre, views: 41,
    description: "Calopsita que assobia o tema do Jornal Nacional. Doação acompanha a gaiola.",
    temperament: ["Sociável", "Curioso"], good_with: ["Apartamento"],
    vaccinated: "nao_informado", neutered: "nao_informado", dewormed: "nao_informado" },
  { owner: "abrigo", name: "Bolinha", species: "cachorro", breed: "Poodle (mestiço)", age_group: "idoso", age_months: 108, sex: "macho", size: "pequeno",
    city: C.curitiba, views: 35,
    description: "Bolinha é calmo e adora um cafuné. Enxerga pouco, mas conhece a casa de olhos fechados.",
    temperament: ["Calmo", "Carinhoso"], good_with: ["Idosos", "Apartamento"],
    vaccinated: "sim", neutered: "sim", dewormed: "sim", special_needs: "Catarata nos dois olhos. Evitar mudar os móveis de lugar com frequência." },
  // Já adotados (finais felizes)
  { owner: "ong", name: "Chico", species: "cachorro", breed: "Sem raça definida", age_group: "adulto", age_months: 50, sex: "macho", size: "medio",
    city: C.saoPaulo, views: 410, status: "adotado",
    description: "Chico esperou dois anos no abrigo e hoje vive com uma família em Campinas.",
    temperament: ["Companheiro"], good_with: ["Crianças"], vaccinated: "sim", neutered: "sim", dewormed: "sim" },
  { owner: "protetora", name: "Nina", species: "gato", age_group: "jovem", age_months: 12, sex: "femea", size: "pequeno",
    city: C.bh, views: 230, status: "adotado",
    description: "Nina foi adotada por um casal de estudantes e agora tem um arranhador de três andares.",
    temperament: ["Brincalhão"], good_with: ["Apartamento"], vaccinated: "sim", neutered: "sim", dewormed: "sim" },
  { owner: "abrigo", name: "Sansão", species: "cachorro", breed: "Labrador (mestiço)", age_group: "idoso", age_months: 120, sex: "macho", size: "grande",
    city: C.curitiba, views: 190, status: "adotado",
    description: "Sansão provou que nunca é tarde para recomeçar: foi adotado aos 10 anos.",
    temperament: ["Calmo"], good_with: ["Idosos"], vaccinated: "sim", neutered: "sim", dewormed: "sim" },
];

const STORIES = [
  { author: "adotante", animal: "Chico", title: "O Chico mudou a nossa casa",
    body: "Vimos o Chico no AdoteAmigo numa sexta à noite. Conversamos com a ONG pelo chat, fizemos a visita no sábado e no domingo ele já estava em casa. Hoje ele dorme no pé da cama das crianças." },
  { author: "protetora", animal: "Nina", title: "Da caixa de papelão para um arranhador gigante",
    body: "Resgatei a Nina com 20 dias de vida. Foi lindo ver os adotantes chegando com caixa de transporte, ração e muitas perguntas. Adoção responsável é isso!" },
  { author: "abrigo", animal: "Sansão", title: "Nunca é tarde para ter um lar",
    body: "O Sansão passou anos no abrigo. Uma senhora aposentada viu o anúncio e disse que queria um companheiro calmo para as caminhadas da manhã. Estão inseparáveis." },
];

const IMAGES_DIR = path.join(process.cwd(), "scripts", "seed-images");

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function findImages(name: string): string[] {
  if (!existsSync(IMAGES_DIR)) return [];
  const base = normalize(name);
  return readdirSync(IMAGES_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .filter((f) => {
      const n = normalize(path.parse(f).name);
      return n === base || n.startsWith(`${base}-`);
    })
    .sort()
    .slice(0, 5)
    .map((f) => path.join(IMAGES_DIR, f));
}

async function ensureUser(u: SeedUser) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((x) => x.email === u.email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: u.name, birth_date: "1990-03-15", city_id: u.city, profile_type: u.type, accepted_terms: LEGAL,
    },
  });
  if (error) throw new Error(`Usuário ${u.email}: ${error.message}`);
  return data.user.id;
}

async function main() {
  console.log("→ Criando usuários de demonstração…");
  const ids: Record<string, string> = {};
  for (const u of USERS) {
    ids[u.key] = await ensureUser(u);
    await admin.from("profiles").update({ bio: u.bio ?? null, is_verified: Boolean(u.verified) }).eq("id", ids[u.key]);
    if (u.role) await admin.from("admin_roles").upsert({ user_id: ids[u.key], role: u.role });
  }

  const { count } = await admin.from("animals").select("id", { count: "exact", head: true }).in("owner_id", Object.values(ids));
  if ((count ?? 0) > 0) {
    console.log("✓ Animais de demonstração já existem. Nada a fazer.");
    return;
  }

  console.log("→ Publicando animais…");
  const animalIds: Record<string, string> = {};
  for (const [i, a] of ANIMALS.entries()) {
    const { data, error } = await admin.from("animals").insert({
      owner_id: ids[a.owner], name: a.name, species: a.species, species_other: a.species_other ?? null,
      breed: a.breed ?? null, age_group: a.age_group, age_months: a.age_months, sex: a.sex, size: a.size,
      city_id: a.city, region: a.region ?? null, description: a.description, story: a.story ?? null,
      personality: a.personality ?? null, temperament: a.temperament, good_with: a.good_with,
      vaccinated: a.vaccinated, neutered: a.neutered, dewormed: a.dewormed, vet_info: a.vet_info ?? null,
      special_needs: Boolean(a.special_needs), special_needs_details: a.special_needs ?? null,
      contact_preference: a.contact ?? "chat",
      published_at: new Date(Date.now() - (ANIMALS.length - i) * 36e5 * 20).toISOString(),
    }).select("id").single();
    if (error) throw new Error(`Animal ${a.name}: ${error.message}`);
    animalIds[a.name] = data.id;
    await admin.from("animals").update({ view_count: a.views, ...(a.status ? { status: a.status } : {}) }).eq("id", data.id);
    if (a.whatsapp) await admin.from("animal_contacts").insert({ animal_id: data.id, whatsapp: a.whatsapp });

    const files = findImages(a.name);
    for (const [pos, file] of files.entries()) {
      const input = readFileSync(file);
      const storagePath = `${ids[a.owner]}/${data.id}/${pos}-${Date.now()}.webp`;
      const full = await sharp(input).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      const thumb = await sharp(input).rotate().resize(640, 640, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      await admin.storage.from("animal-images").upload(storagePath, full.data, { contentType: "image/webp" });
      await admin.storage.from("animal-images").upload(storagePath.replace(/\.webp$/, "-thumb.webp"), thumb, { contentType: "image/webp" });
      await admin.from("animal_images").insert({
        animal_id: data.id, storage_path: storagePath, position: pos, is_primary: pos === 0,
        width: full.info.width, height: full.info.height, alt_text: `Foto de ${a.name}`,
      });
    }
    console.log(`  • ${a.name}${files.length ? ` (${files.length} foto(s))` : ""}`);
  }

  console.log("→ Histórias de adoção…");
  for (const s of STORIES) {
    await admin.from("adoption_stories").insert({ author_id: ids[s.author], animal_id: animalIds[s.animal], title: s.title, body: s.body });
  }

  console.log("→ Interesses, conversa e denúncia de exemplo…");
  await admin.from("adoption_interests").insert({
    animal_id: animalIds["Paçoca"], interested_id: ids.adotante, owner_id: ids.ong,
    message: "Olá! Moro em casa com quintal em Campinas, tenho dois filhos e trabalho em home office. Adoraria conhecer o Paçoca.",
    housing_info: "Casa com quintal murado",
  });
  const { data: conv } = await admin.from("conversations").insert({ animal_id: animalIds["Mel"], created_by: ids.adotante }).select("id").single();
  if (conv) {
    await admin.from("conversation_participants").insert([
      { conversation_id: conv.id, user_id: ids.adotante }, { conversation_id: conv.id, user_id: ids.ong },
    ]);
    const msgs: [string, string][] = [
      ["adotante", "Oi! A Mel ainda está disponível? Moro em apartamento com telas."],
      ["ong", "Oi, Lucas! Está sim. Ela é uma fofa, super tranquila. Você já teve gatos?"],
      ["adotante", "Já tive uma gata por 12 anos. Posso visitar no sábado?"],
    ];
    for (const [who, body] of msgs) {
      await admin.from("messages").insert({ conversation_id: conv.id, sender_id: ids[who], body });
    }
  }
  await admin.from("reports").insert({
    reporter_id: ids.adotante, target_type: "animal", animal_id: animalIds["Fred"], reason: "informacao_falsa",
    description: "Exemplo de denúncia para demonstração do painel de moderação.",
  });

  console.log("\n✓ Pronto! Contas de demonstração (senha: " + PASSWORD + "):");
  for (const u of USERS) console.log(`  ${u.email.padEnd(30)} ${u.role ? `[${u.role}]` : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
