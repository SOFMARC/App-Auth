// ============================================================
// Auth API — Tipos TypeScript baseados no swagger.json
// ============================================================

// --- Resposta genérica da API ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// --- Auth ---
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserSnapshot {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  roles: string;
}

export interface CompanySnapshot {
  companyId: number;
  name: string;
}

export interface AccessSnapshot {
  companyId: number;
  companyName: string;
  appId: number;
  appKey: string;
  appRoleId: number;
  roleKey: string;
  roleName: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserSnapshot;
  companies: CompanySnapshot[];
  access: AccessSnapshot[];
}

// --- Usuários ---
export interface CreateUserDto {
  nome: string;
  email: string;
  password: string;
  ativo?: boolean;
  globalRoles?: string | null;
}

export interface UpdateUserDto {
  nome: string;
  email: string;
  ativo?: boolean;
  globalRoles?: string | null;
}

export interface ResetPasswordDto {
  newPassword: string;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  globalRoles?: string | null;
}

// --- Empresas ---
export interface UpsertCompanyDto {
  name: string;
  ativo?: boolean;
}

export interface Company {
  id: number;
  name: string;
  ativo: boolean;
}

// --- Apps ---
export interface UpsertAppDto {
  key: string;
  name: string;
  ativo?: boolean;
}

export interface App {
  id: number;
  key: string;
  name: string;
  ativo: boolean;
}

// --- Roles ---
export interface UpsertAppRoleDto {
  key: string;
  name: string;
  ativo?: boolean;
}

export interface AppRole {
  id: number;
  key: string;
  name: string;
  ativo: boolean;
  appId: number;
}

// --- IAM Permissões ---
export interface GrantAccessDto {
  userId: number;
  companyId: number;
  appKey: string;
  roleKey: string;
}

export interface RevokeAccessDto {
  userId: number;
  companyId: number;
  appKey: string;
}

export interface UserAccess {
  companyId: number;
  companyName: string;
  appId: number;
  appKey: string;
  appRoleId: number;
  roleKey: string;
  roleName: string;
}

// --- Filtros de listagem ---
export interface UsersFilter {
  q?: string;
  skip?: number;
  take?: number;
}

export interface ListFilter {
  q?: string;
}
