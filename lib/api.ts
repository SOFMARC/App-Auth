import axios, { AxiosError, AxiosInstance } from 'axios';
import { logger } from './logger';
import { storage, STORAGE_KEYS, DEFAULT_API_URL } from './storage';
import type {
  ApiResponse,
  LoginDto,
  LoginResponse,
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  User,
  UsersFilter,
  UpsertCompanyDto,
  Company,
  UpsertAppDto,
  App,
  UpsertAppRoleDto,
  AppRole,
  GrantAccessDto,
  RevokeAccessDto,
  UserAccess,
  ListFilter,
  ChangePasswordDto,
} from './types/api';

// Callback para forçar logout quando receber 401
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedCallback(cb: () => void) {
  onUnauthorized = cb;
}

// Criar instância do axios com baseURL dinâmica
let apiInstance: AxiosInstance | null = null;

async function getApiInstance(): Promise<AxiosInstance> {
  if (apiInstance) return apiInstance;

  const baseURL = (await storage.getItem(STORAGE_KEYS.API_BASE_URL)) || DEFAULT_API_URL;

  apiInstance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor de request: adiciona o token JWT
  apiInstance.interceptors.request.use(async (config) => {
    const token = await storage.getSecure(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Interceptor de response: trata 401/403 e loga erros remotamente
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
      const url = error.config?.url ?? 'unknown';

      if (status === 401) {
        // Limpar token e redirecionar para login
        await clearAuthData();
        onUnauthorized?.();
        logger.warn('auth', `401 Unauthorized: ${method} ${url}`);
      } else if (status === 403) {
        logger.warn('permission', `403 Forbidden: ${method} ${url}`);
      } else if (status && status >= 500) {
        logger.error('api', `${status} Server Error: ${method} ${url}`, {
          status,
          data: error.response?.data,
        });
      } else if (status && status >= 400) {
        logger.warn('api', `${status} Client Error: ${method} ${url}`, {
          status,
          data: error.response?.data,
        });
      } else if (!status) {
        // Erro de rede (sem resposta)
        logger.error('api', `Network error: ${method} ${url}`, {
          message: error.message,
        });
      }

      return Promise.reject(error);
    }
  );

  return apiInstance;
}

// Resetar instância quando a URL mudar
export function resetApiInstance() {
  apiInstance = null;
}

// Limpar dados de autenticação
export async function clearAuthData() {
  await storage.removeSecure(STORAGE_KEYS.AUTH_TOKEN);
  await storage.removeItem(STORAGE_KEYS.AUTH_EXPIRES);
  await storage.removeItem(STORAGE_KEYS.AUTH_USER);
  await storage.removeItem(STORAGE_KEYS.AUTH_COMPANIES);
  await storage.removeItem(STORAGE_KEYS.AUTH_ACCESS);
}

// Extrair mensagem de erro da resposta da API
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 403) return 'Sem permissão para realizar esta ação.';
    if (status === 404) return 'Recurso não encontrado.';
    if (status === 500) return 'Erro interno do servidor. Tente novamente.';

    if (data?.message) return data.message;
    if (data?.errors && Array.isArray(data.errors)) return data.errors.join(', ');
    if (typeof data === 'string') return data;

    if (status === 400) return 'Dados inválidos. Verifique os campos e tente novamente.';
  }

  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado.';
}

// ============================================================
// Auth API
// ============================================================
export const authApi = {
  async login(dto: LoginDto): Promise<LoginResponse> {
    const api = await getApiInstance();
    const res = await api.post<ApiResponse<LoginResponse>>('/api/Auth/login', dto);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Falha no login');
    }
    return res.data.data;
  },

  async me(): Promise<unknown> {
    const api = await getApiInstance();
    const res = await api.get('/api/Auth/me');
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      const api = await getApiInstance();
      await api.post('/api/Auth/logout');
    } catch {
      // Ignorar erros no logout
    }
    await clearAuthData();
  },

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    const api = await getApiInstance();
    await api.post('/api/Auth/change-password', dto);
  },
};

// ============================================================
// Admin — Usuários
// ============================================================
export const usersApi = {
  async list(filter?: UsersFilter): Promise<User[]> {
    const api = await getApiInstance();
    const params: Record<string, unknown> = {};
    if (filter?.q) params.q = filter.q;
    if (filter?.skip !== undefined) params.skip = filter.skip;
    if (filter?.take !== undefined) params.take = filter.take;
    const res = await api.get<ApiResponse<User[]>>('/api/admin/users', { params });
    return res.data.data ?? (res.data as unknown as User[]) ?? [];
  },

  async get(id: number): Promise<User> {
    const api = await getApiInstance();
    const res = await api.get<ApiResponse<User>>(`/api/admin/users/${id}`);
    return res.data.data ?? (res.data as unknown as User);
  },

  async create(dto: CreateUserDto): Promise<User> {
    const api = await getApiInstance();
    const res = await api.post<ApiResponse<User>>('/api/admin/users', dto);
    return res.data.data ?? (res.data as unknown as User);
  },

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const api = await getApiInstance();
    const res = await api.put<ApiResponse<User>>(`/api/admin/users/${id}`, dto);
    return res.data.data ?? (res.data as unknown as User);
  },

  async setStatus(id: number, active: boolean): Promise<void> {
    const api = await getApiInstance();
    await api.patch(`/api/admin/users/${id}/status`, null, { params: { active } });
  },

  async resetPassword(id: number, dto: ResetPasswordDto): Promise<void> {
    const api = await getApiInstance();
    await api.post(`/api/admin/users/${id}/reset-password`, dto);
  },
};

// ============================================================
// Admin IAM — Empresas
// ============================================================
export const companiesApi = {
  async list(filter?: ListFilter): Promise<Company[]> {
    const api = await getApiInstance();
    const params: Record<string, unknown> = {};
    if (filter?.q) params.q = filter.q;
    const res = await api.get<ApiResponse<Company[]>>('/api/admin/iam/companies', { params });
    return res.data.data ?? (res.data as unknown as Company[]) ?? [];
  },

  async get(id: number): Promise<Company> {
    const api = await getApiInstance();
    const res = await api.get<ApiResponse<Company>>(`/api/admin/iam/companies/${id}`);
    return res.data.data ?? (res.data as unknown as Company);
  },

  async create(dto: UpsertCompanyDto): Promise<Company> {
    const api = await getApiInstance();
    const res = await api.post<ApiResponse<Company>>('/api/admin/iam/companies', dto);
    return res.data.data ?? (res.data as unknown as Company);
  },

  async update(id: number, dto: UpsertCompanyDto): Promise<Company> {
    const api = await getApiInstance();
    const res = await api.put<ApiResponse<Company>>(`/api/admin/iam/companies/${id}`, dto);
    return res.data.data ?? (res.data as unknown as Company);
  },

  async setStatus(id: number, active: boolean): Promise<void> {
    const api = await getApiInstance();
    await api.patch(`/api/admin/iam/companies/${id}/status`, null, { params: { active } });
  },

  async addUser(companyId: number, userId: number): Promise<void> {
    const api = await getApiInstance();
    await api.post(`/api/admin/iam/companies/${companyId}/users/${userId}`);
  },

  async removeUser(companyId: number, userId: number): Promise<void> {
    const api = await getApiInstance();
    await api.delete(`/api/admin/iam/companies/${companyId}/users/${userId}`);
  },
};

// ============================================================
// Admin IAM — Apps
// ============================================================
export const appsApi = {
  async list(filter?: ListFilter): Promise<App[]> {
    const api = await getApiInstance();
    const params: Record<string, unknown> = {};
    if (filter?.q) params.q = filter.q;
    const res = await api.get<ApiResponse<App[]>>('/api/admin/iam/apps', { params });
    return res.data.data ?? (res.data as unknown as App[]) ?? [];
  },

  async get(id: number): Promise<App> {
    const api = await getApiInstance();
    const res = await api.get<ApiResponse<App>>(`/api/admin/iam/apps/${id}`);
    return res.data.data ?? (res.data as unknown as App);
  },

  async create(dto: UpsertAppDto): Promise<App> {
    const api = await getApiInstance();
    const res = await api.post<ApiResponse<App>>('/api/admin/iam/apps', dto);
    return res.data.data ?? (res.data as unknown as App);
  },

  async update(id: number, dto: UpsertAppDto): Promise<App> {
    const api = await getApiInstance();
    const res = await api.put<ApiResponse<App>>(`/api/admin/iam/apps/${id}`, dto);
    return res.data.data ?? (res.data as unknown as App);
  },

  async setStatus(id: number, active: boolean): Promise<void> {
    const api = await getApiInstance();
    await api.patch(`/api/admin/iam/apps/${id}/status`, null, { params: { active } });
  },
};

// ============================================================
// Admin IAM — Roles por App
// ============================================================
export const rolesApi = {
  async list(appId: number): Promise<AppRole[]> {
    const api = await getApiInstance();
    const res = await api.get<ApiResponse<AppRole[]>>(`/api/admin/iam/apps/${appId}/roles`);
    return res.data.data ?? (res.data as unknown as AppRole[]) ?? [];
  },

  async create(appId: number, dto: UpsertAppRoleDto): Promise<AppRole> {
    const api = await getApiInstance();
    const res = await api.post<ApiResponse<AppRole>>(`/api/admin/iam/apps/${appId}/roles`, dto);
    return res.data.data ?? (res.data as unknown as AppRole);
  },

  async update(appId: number, roleId: number, dto: UpsertAppRoleDto): Promise<AppRole> {
    const api = await getApiInstance();
    const res = await api.put<ApiResponse<AppRole>>(
      `/api/admin/iam/apps/${appId}/roles/${roleId}`,
      dto
    );
    return res.data.data ?? (res.data as unknown as AppRole);
  },

  async setStatus(appId: number, roleId: number, active: boolean): Promise<void> {
    const api = await getApiInstance();
    await api.patch(`/api/admin/iam/apps/${appId}/roles/${roleId}/status`, null, {
      params: { active },
    });
  },

  async delete(appId: number, roleId: number): Promise<void> {
    const api = await getApiInstance();
    await api.delete(`/api/admin/iam/apps/${appId}/roles/${roleId}`);
  },
};

// ============================================================
// Admin IAM — Permissões (Grant/Revoke)
// ============================================================
export const iamApi = {
  async grant(dto: GrantAccessDto): Promise<void> {
    const api = await getApiInstance();
    await api.post('/api/admin/iam/access/grant', dto);
  },

  async revoke(dto: RevokeAccessDto): Promise<void> {
    const api = await getApiInstance();
    await api.post('/api/admin/iam/access/revoke', dto);
  },

  async getUserAccess(userId: number): Promise<UserAccess[]> {
    // Usa o endpoint de access/me/for ou busca via snapshot
    // Como não há endpoint direto GET /api/admin/iam/user/{userId},
    // usamos o endpoint de acesso do usuário via admin
    const api = await getApiInstance();
    try {
      const res = await api.get<ApiResponse<UserAccess[]>>(
        `/api/admin/iam/users/${userId}/access`
      );
      return res.data.data ?? (res.data as unknown as UserAccess[]) ?? [];
    } catch {
      return [];
    }
  },
};

// ============================================================
// Configuração da URL base
// ============================================================
export const configApi = {
  async testConnection(): Promise<boolean> {
    try {
      const api = await getApiInstance();
      await api.get('/api/Auth/me');
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // 401 significa que a API está respondendo (apenas sem token)
        return true;
      }
      return false;
    }
  },

  async setBaseUrl(url: string): Promise<void> {
    await storage.setItem(STORAGE_KEYS.API_BASE_URL, url);
    resetApiInstance();
  },

  async getBaseUrl(): Promise<string> {
    return (await storage.getItem(STORAGE_KEYS.API_BASE_URL)) || DEFAULT_API_URL;
  },
};
