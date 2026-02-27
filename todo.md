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
