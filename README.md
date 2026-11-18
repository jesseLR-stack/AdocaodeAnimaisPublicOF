# AdoteAmigo 🐾

> **Uma nova história começa com uma adoção.**

Plataforma web nacional de adoção responsável de animais. Conecta pessoas que querem adotar a pessoas físicas,
protetores independentes, ONGs e abrigos que buscam um novo lar para cães, gatos e outros animais.

Projeto acadêmico construído como produto real: banco de dados com regras de segurança, autenticação, chat em
tempo real, moderação e testes automatizados.

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS 4 + componentes no padrão shadcn/ui (Radix UI) |
| Backend | Server Actions do Next.js + funções PostgreSQL |
| Banco de dados | PostgreSQL (Supabase) com Row Level Security |
| Autenticação | Supabase Auth (e-mail e senha, confirmação, recuperação) |
| Imagens | Supabase Storage (compressão WebP no navegador) |
| Chat | Supabase Realtime |
| Localização | Base de municípios do IBGE + distância por Haversine (sem API paga) |
| Hospedagem | Vercel |
| Testes | Vitest (regras do banco) + Playwright (fluxos no navegador) |

---

## Funcionalidades

**Público (sem login):** página inicial, catálogo com filtros combináveis (espécie, idade, sexo, porte, raça,
estado, cidade, distância, castração, vacinação, necessidades especiais) e ordenação (recentes, atualizados, mais
vistos e mais próximos), página de cada animal com URL própria, finais felizes, ONGs e protetores, sobre, contato,
perguntas frequentes e documentos legais.

**Usuário logado:** favoritos, “Tenho interesse em adotar”, chat em tempo real, contato por WhatsApp (só se o
anunciante autorizar), compartilhamento, denúncias, anúncio em 6 etapas com até 10 fotos, painel com interesses
enviados e recebidos, notificações em tempo real, perfil com foto e pedido de verificação, e área de privacidade
para baixar os dados e excluir a conta.

**Equipe (admin e moderador):** dashboard, central de denúncias com histórico de decisões, gestão de anúncios
(suspender, remover, restaurar, editar, marcar como inadequado, verificar saúde), gestão de usuários (suspender,
reativar, bloquear, verificar), verificação de organizações, mensagens de contato e auditoria completa.

**Segurança:** RLS em todas as tabelas, papéis atribuídos apenas no backend, publicação automática com sinais de
risco (termos de venda ou PIX, links, telefone no texto, publicação repetida), limites anti-spam no banco, bloqueio
entre usuários, idade mínima de 18 anos e registro do aceite dos termos (documento, versão e data).

Detalhes técnicos em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

---

## Rodando localmente

**Requisitos:** Node.js 20 ou superior e Docker (o Supabase local roda em containers).

```bash
npm install
```

```bash
npm run db:start
```

O `db:start` sobe o Supabase local e aplica as migrations. Copie as chaves exibidas para o `.env.local`:

```bash
cp .env.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` (`http://127.0.0.1:54321`), `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY` com os valores mostrados pelo comando anterior. Depois, popule os dados de demonstração:

```bash
npm run seed
```

```bash
npm run dev
```

Acesse http://localhost:3000. Os e-mails locais (confirmação de cadastro, recuperação de senha) chegam no
Mailpit: http://127.0.0.1:54324.

### Contas de demonstração (senha `Adote@2026`)

| E-mail | Perfil |
|---|---|
| `admin@adoteamigo.demo` | Administrador |
| `moderador@adoteamigo.demo` | Moderador (sem bloqueio de contas nem configurações) |
| `ong@adoteamigo.demo` | ONG verificada, com conversa e interesse recebidos |
| `abrigo@adoteamigo.demo` | Abrigo verificado |
| `protetora@adoteamigo.demo` | Protetora independente |
| `adotante@adoteamigo.demo` | Pessoa física interessada em adotar |

### Fotos dos dados de demonstração

O seed não baixa fotos da internet. Para ter fotos reais na apresentação, coloque imagens suas ou com licença livre
(ex.: Unsplash, Pexels) em `scripts/seed-images/` com o nome do animal: `pacoca.jpg`, `mel-1.jpg`, `mel-2.jpg`,
`thor.webp`… Depois rode `npm run db:reset` e `npm run seed`. Animais sem foto mostram uma ilustração própria.

---

## Testes

| Comando | O que testa |
|---|---|
| `npm test` | 30 testes de integração das regras do banco: RLS, gatilhos, limites anti-spam, papéis e busca |
| `npx playwright test` | 13 testes de ponta a ponta no navegador: catálogo, favoritos, interesse, chat em tempo real, WhatsApp, anúncio com foto, celular, LGPD e moderação |
| `npm run typecheck` / `npm run lint` | Tipos e regras de código |

Os testes de ponta a ponta precisam do Supabase local, do seed e do `npm run dev` rodando. Os testes de integração
criam usuários de teste; para voltar ao estado de demonstração, rode `npm run db:reset` e `npm run seed`.

---

## Publicando na internet (Supabase + Vercel)

Tudo cabe nos planos gratuitos. Passo a passo:

### 1. Supabase (banco, login, fotos e chat)

1. Crie uma conta em https://supabase.com e um novo projeto (região **South America (São Paulo)**). Guarde a senha do banco.
2. Em **Project Settings → API**, copie a **Project URL**, a chave **anon/public** e a chave **service_role**.
3. Envie as migrations para o projeto:

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref SEU_PROJECT_REF
   ```

   ```bash
   npx supabase db push
   ```

4. Em **Authentication → URL Configuration**:
   - **Site URL:** `https://SEU-PROJETO.vercel.app`
   - **Redirect URLs:** `https://SEU-PROJETO.vercel.app/**`
5. Em **Authentication → Providers → Email**, mantenha **Confirm email** ligado e, em **Password**, defina o mínimo
   de 8 caracteres com letras e números.
6. *(Recomendado)* O e-mail padrão do Supabase envia poucas mensagens por hora. Para não falhar na apresentação,
   configure um SMTP próprio em **Authentication → Emails → SMTP Settings** (o Resend tem plano gratuito).
7. *(Opcional)* Para limpeza automática de registros antigos, ative a extensão **pg_cron** e agende
   `select public.purge_expired_data();` diariamente.

### 2. Vercel (site)

1. Crie uma conta em https://vercel.com com o seu GitHub e importe este repositório.
2. Em **Environment Variables**, cadastre:

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon/public |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave service_role (**nunca** exponha no navegador) |
   | `NEXT_PUBLIC_SITE_URL` | `https://SEU-PROJETO.vercel.app` |
   | `IP_HASH_SALT` | um texto aleatório qualquer |

3. Clique em **Deploy**.

### 3. Primeiro administrador

O papel de administrador só pode ser atribuído pelo backend. Depois de criar sua conta pelo site, rode no
**SQL Editor** do Supabase:

```sql
insert into public.admin_roles (user_id, role)
select id, 'admin' from auth.users where email = 'seu-email@exemplo.com';
```

Para um moderador, use `'moderador'`. *(Opcional)* Para ter os dados de demonstração em produção, rode
`npm run seed` com o `.env.local` apontando para o projeto na nuvem.

> **Atenção:** o plano gratuito do Supabase pausa projetos sem acesso por cerca de 7 dias. Acesse o site e o painel
> do Supabase nos dias anteriores à apresentação.

---

## Estrutura

```
src/
  app/
    (site)/        páginas públicas (início, catálogo, animal, institucionais, legais)
    (auth)/        entrar, cadastrar, recuperar e redefinir senha
    painel/        painel do usuário
    admin/         painel administrativo (separado)
    actions/       Server Actions (validação com Zod no servidor)
    auth/callback  retorno dos links de e-mail
  components/      componentes reutilizáveis (ui/ segue o padrão shadcn)
  lib/             clientes Supabase, validações, formatação, constantes
  proxy.ts         renovação de sessão e proteção de rotas (antigo middleware)
supabase/migrations/   migrations versionadas (schema, dados IBGE, funções, RLS, storage)
scripts/               seed de demonstração e gerador da base de cidades
tests/                 integração (Vitest) e ponta a ponta (Playwright)
```

## Pendências conhecidas

- Os documentos legais foram escritos para fins acadêmicos e devem ser revisados por um advogado antes de uso comercial.
- Não há captcha no cadastro. Para a apresentação não é necessário, mas para uso público recomenda-se o Cloudflare Turnstile.
- As notificações são exibidas no site (em tempo real). Notificações por e-mail ou push ficam para uma próxima versão.
- A distância é calculada entre os centros das cidades, não por endereço exato, o que também protege a privacidade.
