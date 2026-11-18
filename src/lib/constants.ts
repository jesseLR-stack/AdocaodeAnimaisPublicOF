import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export const SPECIES_LABEL: Record<Enums["animal_species"], string> = {
  cachorro: "Cachorro",
  gato: "Gato",
  outro: "Outro",
};
export const SPECIES_PLURAL: Record<Enums["animal_species"], string> = {
  cachorro: "Cães",
  gato: "Gatos",
  outro: "Outros animais",
};
export const SEX_LABEL: Record<Enums["animal_sex"], string> = { macho: "Macho", femea: "Fêmea" };
export const SIZE_LABEL: Record<Enums["animal_size"], string> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};
export const AGE_LABEL: Record<Enums["animal_age_group"], string> = {
  filhote: "Filhote",
  jovem: "Jovem",
  adulto: "Adulto",
  idoso: "Idoso",
};
export const AGE_HINT: Record<Enums["animal_age_group"], string> = {
  filhote: "até 1 ano",
  jovem: "1 a 3 anos",
  adulto: "3 a 8 anos",
  idoso: "mais de 8 anos",
};
export const HEALTH_LABEL: Record<Enums["health_info"], string> = {
  sim: "Sim",
  nao: "Não",
  parcial: "Parcial",
  nao_informado: "Não informado",
};
export const STATUS_LABEL: Record<Enums["animal_status"], string> = {
  disponivel: "Disponível",
  adotado: "Adotado",
  pausado: "Pausado",
  suspenso: "Suspenso",
  removido: "Removido",
};
export const PROFILE_TYPE_LABEL: Record<Enums["profile_type"], string> = {
  pessoa_fisica: "Pessoa física",
  protetor_independente: "Protetor(a) independente",
  ong_abrigo: "ONG ou abrigo",
  organizacao_parceira: "Organização parceira",
};
export const CONTACT_PREF_LABEL: Record<Enums["contact_preference"], string> = {
  chat: "Somente chat do AdoteAmigo",
  whatsapp: "WhatsApp",
  ambos: "Chat e WhatsApp",
};
export const INTEREST_STATUS_LABEL: Record<Enums["interest_status"], string> = {
  enviado: "Enviado",
  visualizado: "Visualizado",
  em_conversa: "Em conversa",
  aceito: "Aceito para conversa",
  recusado: "Não seguiu adiante",
  cancelado: "Cancelado",
};
export const REPORT_REASON_LABEL: Record<Enums["report_reason"], string> = {
  golpe: "Suspeita de golpe",
  venda_de_animal: "Venda de animal",
  maus_tratos: "Maus-tratos",
  informacao_falsa: "Informação falsa",
  spam: "Spam ou anúncio repetido",
  conteudo_inadequado: "Conteúdo inadequado",
  assedio: "Assédio ou comportamento abusivo",
  outro: "Outro motivo",
};
export const REPORT_STATUS_LABEL: Record<Enums["report_status"], string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  procedente: "Procedente",
  improcedente: "Improcedente",
};
export const ACCOUNT_STATUS_LABEL: Record<Enums["account_status"], string> = {
  ativo: "Ativa",
  suspenso: "Suspensa",
  bloqueado: "Bloqueada",
};
export const RISK_FLAG_LABEL: Record<string, string> = {
  link_externo: "Contém link externo",
  possivel_venda_ou_golpe: "Termos de venda/pagamento",
  telefone_no_texto: "Telefone no texto",
  publicacao_repetida: "Publicação repetida",
};
export const TEMPERAMENT_OPTIONS = [
  "Carinhoso", "Brincalhão", "Calmo", "Tímido", "Curioso", "Independente",
  "Protetor", "Sociável", "Agitado", "Companheiro", "Dorminhoco", "Comilão",
];
export const GOOD_WITH_OPTIONS = ["Crianças", "Cães", "Gatos", "Idosos", "Apartamento"];

export const SORT_OPTIONS = [
  { value: "recentes", label: "Mais recentes" },
  { value: "atualizados", label: "Atualizados recentemente" },
  { value: "visualizados", label: "Mais visualizados" },
  { value: "proximos", label: "Mais próximos" },
] as const;

export const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

export const LEGAL_VERSIONS = {
  termos_uso: "1.0",
  politica_privacidade: "1.0",
  diretrizes_comunidade: "1.0",
  politica_adocao: "1.0",
} as const;

export const PAGE_SIZE = 12;
export const MAX_IMAGES = 10;
