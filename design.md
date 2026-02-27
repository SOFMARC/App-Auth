# IAM Admin — Design do App Mobile

## Identidade Visual

O app é um painel administrativo de identidade e acesso (IAM). A paleta de cores deve transmitir profissionalismo, segurança e confiança. Optamos por um azul-marinho profundo como cor primária, com acentos em azul elétrico para ações interativas, e superfícies em cinza escuro para o modo escuro.

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `primary` | `#1E40AF` | `#3B82F6` | Botões, ícones ativos, badges |
| `background` | `#F8FAFC` | `#0F172A` | Fundo das telas |
| `surface` | `#FFFFFF` | `#1E293B` | Cards, modais, inputs |
| `foreground` | `#0F172A` | `#F1F5F9` | Texto principal |
| `muted` | `#64748B` | `#94A3B8` | Texto secundário, placeholders |
| `border` | `#E2E8F0` | `#334155` | Divisores, bordas |
| `success` | `#16A34A` | `#4ADE80` | Status ativo, confirmações |
| `warning` | `#D97706` | `#FBBF24` | Alertas, expiração |
| `error` | `#DC2626` | `#F87171` | Erros, revogar, inativar |

---

## Telas do App

### 1. LoginScreen (`/login`)
**Conteúdo:** Logo do app centralizado, campos de e-mail e senha, botão "Entrar", link para configurações de URL da API.
**Funcionalidade:** POST /api/Auth/login, salvar token no SecureStore, redirecionar para Dashboard.
**Layout:** Tela cheia com fundo gradiente, card central com formulário.

### 2. DashboardScreen (`/(tabs)/index`)
**Conteúdo:** Cabeçalho com nome do usuário e botão de logout, card de perfil com roles, lista de empresas do snapshot, lista de acessos (app + role por empresa), estatísticas rápidas (total de usuários, empresas, apps).
**Funcionalidade:** Exibir dados do snapshot de login, botão de logout, navegação para módulos.
**Layout:** ScrollView com seções em cards, ícones coloridos por módulo.

### 3. UsersListScreen (`/(tabs)/users`)
**Conteúdo:** Barra de busca, FlatList de usuários com nome, e-mail e badge de status (ativo/inativo), FAB para criar usuário.
**Funcionalidade:** GET /api/admin/users com filtro q, paginação (skip/take), pull-to-refresh.
**Layout:** Lista com avatar inicial do nome, badge colorido de status.

### 4. UserDetailScreen (`/users/[id]`)
**Conteúdo:** Dados do usuário (nome, e-mail, status, roles globais), seção de acessos (lista de empresa/app/role), botões de ação (editar, reset senha, ativar/inativar).
**Funcionalidade:** GET /api/admin/users/{id}, GET /api/admin/iam/access/user/{userId} (via snapshot).
**Layout:** Header com avatar grande, seções em cards expansíveis.

### 5. UserFormScreen (`/users/new` e `/users/[id]/edit`)
**Conteúdo:** Formulário com nome, e-mail, senha (apenas criação), status ativo, roles globais.
**Funcionalidade:** POST /api/admin/users (criação) ou PUT /api/admin/users/{id} (edição).
**Layout:** ScrollView com campos agrupados em seções.

### 6. UserPermissionsScreen (`/users/[id]/permissions`)
**Conteúdo:** Lista de permissões atuais (empresa + app + role) com botão Revogar, formulário de concessão (dropdown empresa, dropdown app, dropdown role), botão Conceder.
**Funcionalidade:** GET /api/admin/iam/companies (empresas), GET /api/admin/iam/apps (apps), GET /api/admin/iam/apps/{id}/roles (roles), POST /api/admin/iam/access/grant, POST /api/admin/iam/access/revoke.
**Layout:** Seção superior com lista de permissões, seção inferior com formulário de grant.

### 7. CompaniesListScreen (`/(tabs)/companies`)
**Conteúdo:** Barra de busca, FlatList de empresas com nome e badge de status, FAB para criar empresa.
**Funcionalidade:** GET /api/admin/iam/companies com filtro q.
**Layout:** Lista com ícone de empresa, badge de status.

### 8. CompanyFormScreen (`/companies/new` e `/companies/[id]/edit`)
**Conteúdo:** Formulário com nome e status ativo.
**Funcionalidade:** POST /api/admin/iam/companies ou PUT /api/admin/iam/companies/{id}.
**Layout:** Card com campos simples.

### 9. AppsListScreen (`/(tabs)/apps`)
**Conteúdo:** Barra de busca, FlatList de apps com nome, key e badge de status, FAB para criar app.
**Funcionalidade:** GET /api/admin/iam/apps com filtro q.
**Layout:** Lista com ícone de app, key em badge secundário.

### 10. AppDetailScreen (`/apps/[id]`)
**Conteúdo:** Dados do app (nome, key, status), lista de roles do app com status, FAB para adicionar role.
**Funcionalidade:** GET /api/admin/iam/apps/{id}, GET /api/admin/iam/apps/{id}/roles.
**Layout:** Header com dados do app, lista de roles em cards.

### 11. AppFormScreen (`/apps/new` e `/apps/[id]/edit`)
**Conteúdo:** Formulário com key, nome e status ativo.
**Funcionalidade:** POST /api/admin/iam/apps ou PUT /api/admin/iam/apps/{id}.
**Layout:** Card com campos simples.

### 12. RoleFormScreen (`/apps/[id]/roles/new` e `/apps/[id]/roles/[roleId]/edit`)
**Conteúdo:** Formulário com key, nome e status ativo.
**Funcionalidade:** POST /api/admin/iam/apps/{appId}/roles ou PUT /api/admin/iam/apps/{appId}/roles/{roleId}.
**Layout:** Modal sheet com campos simples.

### 13. SettingsScreen (`/(tabs)/settings`)
**Conteúdo:** Campo de URL base da API, botão "Testar conexão", informações do usuário logado, botão de logout.
**Funcionalidade:** Salvar URL em AsyncStorage, testar com GET /api/Auth/me.
**Layout:** Seções em cards com configurações agrupadas.

---

## Fluxos Principais

### Fluxo de Login
Login → POST /api/Auth/login → Salvar token no SecureStore → Redirecionar para Dashboard.

### Fluxo de Gerenciamento de Usuário
Users List → Tap no usuário → User Detail → Tap em "Permissões" → User Permissions → Grant/Revoke.

### Fluxo de Criação de App com Roles
Apps List → FAB → App Form → Salvar → App Detail → FAB → Role Form → Salvar.

### Fluxo de Expiração de Sessão
Qualquer requisição → 401 → Limpar SecureStore → Redirecionar para Login com mensagem "Sessão expirada".

---

## Navegação

O app usa **Bottom Tab Navigation** com 4 abas principais:
1. **Dashboard** (ícone: house.fill)
2. **Usuários** (ícone: person.2.fill)
3. **Empresas** (ícone: building.2.fill)
4. **Apps** (ícone: app.fill)

A aba de **Configurações** fica acessível via ícone de engrenagem no header do Dashboard.

Telas de detalhe e formulários são empilhadas sobre as abas usando Stack Navigator.

---

## Componentes Reutilizáveis

| Componente | Descrição |
|---|---|
| `StatusBadge` | Badge colorido para status ativo/inativo |
| `SearchBar` | Barra de busca com debounce |
| `ListItem` | Item de lista com avatar, título, subtítulo e badge |
| `FormField` | Campo de formulário com label e validação |
| `ActionButton` | Botão de ação primária/secundária/destrutiva |
| `ConfirmDialog` | Modal de confirmação para ações destrutivas |
| `LoadingOverlay` | Overlay de carregamento |
| `ErrorMessage` | Componente de exibição de erro |
| `EmptyState` | Estado vazio para listas |
| `FAB` | Floating Action Button |
| `Toast` | Notificação temporária de sucesso/erro |
