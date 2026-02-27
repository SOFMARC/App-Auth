# IAM Admin — TODO

## Setup e Configuração
- [x] Gerar logo do app e configurar branding
- [x] Configurar tema de cores (azul-marinho profissional)
- [x] Configurar app.config.ts com nome e slug corretos

## Infraestrutura
- [x] Criar serviço de API com axios e interceptors de 401/403
- [x] Implementar AuthContext com SecureStore para token JWT
- [x] Criar hook useApi para requisições autenticadas
- [x] Implementar tratamento global de erros (400, 401, 403, 500)
- [x] Criar componente Toast para feedback de sucesso/erro

## Navegação
- [x] Configurar Stack Navigator raiz (auth vs app)
- [x] Configurar Bottom Tab Navigator com 4 abas
- [x] Mapear ícones no icon-symbol.tsx
- [x] Implementar redirecionamento automático por estado de autenticação

## Tela de Login
- [x] Criar LoginScreen com campos email/senha
- [x] Implementar validação de formulário
- [x] Integrar com POST /api/Auth/login
- [x] Salvar token e snapshot no SecureStore
- [x] Tratar erros de login (credenciais inválidas)
- [x] Link para tela de configurações de URL

## Dashboard
- [x] Criar DashboardScreen com dados do snapshot
- [x] Exibir card de perfil do usuário (nome, roles)
- [x] Exibir lista de empresas do snapshot
- [x] Exibir lista de acessos (app + role por empresa)
- [x] Implementar botão de logout
- [x] Navegação para módulos (usuários, empresas, apps)

## Usuários
- [x] Criar UsersListScreen com FlatList e busca
- [x] Implementar paginação (skip/take)
- [x] Criar UserDetailScreen com dados e acessos
- [x] Criar UserFormScreen para criação de usuário
- [x] Criar UserFormScreen para edição de usuário
- [x] Implementar ativar/inativar usuário (PATCH /status)
- [x] Implementar reset de senha com confirmação
- [x] Criar UserPermissionsScreen (grant/revoke)

## Empresas
- [x] Criar CompaniesListScreen com FlatList e busca
- [x] Criar CompanyFormScreen para criação
- [x] Criar CompanyFormScreen para edição
- [x] Implementar ativar/inativar empresa (PATCH /status)

## Apps
- [x] Criar AppsListScreen com FlatList e busca
- [x] Criar AppDetailScreen com lista de roles
- [x] Criar AppFormScreen para criação
- [x] Criar AppFormScreen para edição
- [x] Implementar ativar/inativar app (PATCH /status)
- [x] Criar RoleFormScreen para criação de role
- [x] Criar RoleFormScreen para edição de role
- [x] Implementar ativar/inativar role (PATCH /status)

## Permissões (IAM)
- [x] Implementar dropdown de empresa no formulário de grant
- [x] Implementar dropdown de app no formulário de grant
- [x] Implementar dropdown de role no formulário de grant
- [x] Integrar POST /api/admin/iam/access/grant
- [x] Integrar POST /api/admin/iam/access/revoke
- [x] Exibir lista de permissões atuais do usuário

## Configurações
- [x] Criar SettingsScreen com campo de URL base da API
- [x] Implementar "Testar conexão" com GET /api/Auth/me
- [x] Salvar URL em AsyncStorage
- [x] Exibir informações do usuário logado
- [x] Botão de logout

## Componentes Reutilizáveis
- [x] StatusBadge (ativo/inativo)
- [x] SearchBar com debounce
- [x] ListItem com avatar, título, subtítulo
- [x] FormField com label e validação
- [x] ConfirmDialog para ações destrutivas
- [x] EmptyState para listas vazias
- [x] FAB (Floating Action Button)
- [x] LoadingSpinner

## Controle de Acesso
- [x] Validar role MASTER no snapshot após login
- [x] Bloquear acesso se usuário não for MASTER/ADMIN
- [x] Exibir mensagem "Sem permissão" para 403

## Testes
- [x] Testes unitários para extractErrorMessage
- [x] Testes unitários para validação de token
- [x] Testes unitários para detecção de role MASTER
- [x] Testes unitários para validação de DTOs

## Seletor de Empresa Global
- [x] Criar CompanyContext com empresa selecionada e lista de empresas
- [x] Criar componente CompanySelector (bottom sheet / modal picker)
- [x] Integrar CompanySelector no header do Dashboard
- [x] Filtrar lista de Usuários por empresa selecionada
- [x] Filtrar lista de Empresas para destacar empresa selecionada
- [x] Filtrar Permissões por empresa selecionada
- [x] Persistir empresa selecionada no AsyncStorage
- [x] Exibir empresa ativa em todas as telas como badge no header

## Bug: Crash na Inicialização
- [ ] Investigar crash ao abrir o app (fecha imediatamente sem mostrar login)
- [ ] Corrigir root layout / providers
- [ ] Corrigir lógica de redirecionamento auth
- [ ] Validar estabilidade em Android e iOS

## Bug: Crash Android (expo-symbols)
- [x] Remover import direto de expo-symbols (iOS-only) do icon-symbol.tsx
- [x] Usar apenas tipos locais para SymbolViewProps e SymbolWeight
- [x] Validar que o app abre corretamente no Android

## Cloudflare D1 — Sistema de Logs
- [x] Criar banco D1 no Cloudflare via MCP
- [x] Criar tabela app_logs com campos: id, level, category, message, metadata, user_id, company_id, app_version, platform, created_at
- [x] Criar Worker Cloudflare com endpoint REST para inserir e consultar logs
- [x] Implementar serviço de logging no app (captura erros, navegação, ações críticas)
- [x] Capturar crash/erros globais com ErrorBoundary
- [x] Criar tela de Logs no app com filtros por nível, categoria e data

## Bug: Crash de Abertura (ainda presente)
- [x] Identificar causa raiz do crash na inicialização (pode ser import problemático em _layout, auth-context ou storage)
- [x] Corrigir crash garantindo que o app abre na tela de login no Android

## Melhoria: Logging apenas de Erros
- [x] Filtrar logger para enviar ao Cloudflare apenas warn/error/fatal (remover debug/info)
- [x] Remover logs de "App iniciado", "Login realizado", "Logout", "Navegou para" do envio remoto
- [x] Garantir que erros de API (4xx/5xx) e crashes sejam enviados imediatamente
- [x] Limpar chamadas de logger.info/debug desnecessárias no código

## Bug: Fluxo de Inicialização / Login
- [x] Corrigir AuthGuard para não redirecionar enquanto isLoading=true
- [x] Garantir que callback 401 não dispara durante restoreSession
- [x] Garantir que app abre na tela de login quando não autenticado
- [x] Mostrar splash/loading enquanto verifica sessão salva

## Bug: Crash Nativo (app fecha antes de renderizar)
- [x] Testar login via API REST para confirmar credenciais
- [x] Identificar import nativo que causa crash no bundle Android (react-native-worklets/plugin no babel.config.js + expo-video/expo-audio plugins desnecessários + trpc provider)
- [x] Remover/substituir todos os imports problemáticos (removidos: worklets plugin, expo-video, expo-audio, trpc.Provider)
- [x] Garantir que logs de erro chegam ao Cloudflare D1 (worker funcionando, CORS ok, logs enviados imediatamente)

## Bug: Mapeamento de Campos da API
- [x] Corrigir App: API retorna appId, app usa .id — mapear no api.ts
- [x] Corrigir Company: API retorna companyId, app usa .id — mapear no api.ts
- [x] Corrigir User: API retorna roles, app usa globalRoles — mapear no api.ts

## Bug: CompanyContext chamando API sem token
- [x] Corrigir CompanyContext para só carregar empresas após isAuthenticated=true
- [x] Integrar endpoint /api/access/me para restaurar estado de acesso pós-login
- [x] Integrar endpoint /api/access/me/for para verificar acesso por empresa+app
- [x] Garantir que nenhum provider faz chamada à API antes do token estar disponível (CompanyProvider movido para dentro do AuthGuard)

## Bug: Campos Reais da API (Teste com Credenciais Reais)

- [ ] Corrigir User: API retorna `nome` mas tipos usam `name` — mapear `nome→name` no api.ts
- [ ] Corrigir User: API retorna `dataCriacao` mas tipos usam `createdAt` — mapear no api.ts
- [ ] Corrigir User: API retorna `ultimoLogin` mas tipos usam `lastLogin` — mapear no api.ts
- [ ] Corrigir CreateUser: DTO usa `name` mas API espera `nome` — mapear no api.ts
- [ ] Corrigir UpdateUser: DTO usa `name` mas API espera `nome` — mapear no api.ts
- [ ] Corrigir Permissões: não existe GET /api/admin/iam/users/{id}/access — remover listagem ou usar /api/access/me
- [ ] Corrigir Permissões: GrantAccessDto usa `roleKey` (string), não `appRoleId` (int) — corrigir payload
- [ ] Corrigir Permissões: RevokeAccessDto usa `appKey` (string), não `appId` (int) — corrigir payload
- [ ] Corrigir tela de usuários: campos `nome`, `dataCriacao`, `ultimoLogin` devem ser exibidos corretamente

## Resultado do Teste Completo com Credenciais Reais

- [x] Login JWT — ✅ funcionando
- [x] GET /api/Auth/me — ✅ funcionando
- [x] GET /api/access/me — ✅ funcionando
- [x] GET /api/access/me/for — ✅ funcionando
- [x] GET /api/admin/users — ✅ funcionando (campos: id, nome, email, ativo, dataCriacao, ultimoLogin, roles)
- [x] POST /api/admin/users — ✅ funcionando
- [ ] PUT /api/admin/users/{id} — ❌ HTTP 405 (Method Not Allowed) — PROBLEMA NA API
- [x] PATCH /api/admin/users/{id}/status — ✅ funcionando
- [x] POST /api/admin/users/{id}/reset-password — ✅ funcionando
- [x] GET /api/admin/iam/companies — ✅ funcionando (campos: companyId, name, ativo)
- [x] GET /api/admin/iam/companies/{id} — ✅ funcionando
- [x] POST /api/admin/iam/companies — ✅ funcionando
- [ ] PUT /api/admin/iam/companies/{id} — ❌ HTTP 405 (Method Not Allowed) — PROBLEMA NA API
- [x] PATCH /api/admin/iam/companies/{id}/status — ✅ funcionando
- [x] GET /api/admin/iam/apps — ✅ funcionando (campos: appId, key, name, ativo)
- [x] GET /api/admin/iam/apps/{id} — ✅ funcionando
- [x] POST /api/admin/iam/apps — ✅ funcionando
- [x] GET /api/admin/iam/apps/{id}/roles — ✅ funcionando (campos: appRoleId, appId, key, name, ativo)
- [x] POST /api/admin/iam/apps/{id}/roles — ✅ funcionando
- [x] POST /api/admin/iam/access/grant — ✅ funcionando
- [x] POST /api/admin/iam/access/revoke — ✅ funcionando

## Diagnóstico: Logs de Inicialização

- [x] Logger envia imediatamente (sem batch) para Cloudflare D1
- [x] Log no primeiro render do app (app/index.tsx)
- [x] Log em cada etapa do AuthContext (início restore, token encontrado/não encontrado, fim restore)
- [x] Log em cada etapa do CompanyContext (início load, sucesso, erro)
- [x] Log em cada etapa do AuthGuard (isLoading, isAuthenticated, redirect)
- [x] Log de TODOS os erros de API (qualquer status != 2xx)
- [x] Log de erros de rede (timeout, connection refused)
- [x] Log de erros não tratados (unhandledRejection, uncaughtException)
- [x] Tela de Logs mostra logs de inicialização (categoria INIT)

## Diagnóstico: Crash Nativo Android
- [x] Implementar GlobalErrorHandler do Expo para capturar erros JS não tratados antes do React montar
- [x] Adicionar verificação de módulos nativos no startup (Platform.OS, versões)
- [x] Enviar log de diagnóstico imediatamente ao montar o primeiro componente nativo
- [x] Criar tela de diagnóstico nativo acessível sem autenticação (/diagnostic)
- [x] Adicionar try/catch em torno de todos os imports de módulos nativos críticos

## Fix: Suporte a 16KB Page Size (Android 15+/16)
- [x] Identificar causa raiz do crash nativo: Samsung Galaxy S25 Ultra (Android API 36) exige alinhamento de 16KB nas bibliotecas nativas (.so)
- [x] Atualizar app.config.ts: compileSdkVersion=36, targetSdkVersion=35, buildToolsVersion=35.0.0, ndkVersion=29.0.13113456
- [x] Bump version para 1.0.7
