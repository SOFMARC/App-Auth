import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { storage, STORAGE_KEYS } from './storage';
import { authApi, clearAuthData, setUnauthorizedCallback } from './api';
import type { UserSnapshot, CompanySnapshot, AccessSnapshot, LoginDto } from './types/api';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: string | null;
  user: UserSnapshot | null;
  companies: CompanySnapshot[];
  access: AccessSnapshot[];
  sessionExpiredMessage: string | null;
}

interface AuthContextValue extends AuthState {
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  clearSessionMessage: () => void;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    token: null,
    expiresAt: null,
    user: null,
    companies: [],
    access: [],
    sessionExpiredMessage: null,
  });

  const isHandlingUnauthorized = useRef(false);

  // Registrar callback de 401 para forçar logout
  useEffect(() => {
    setUnauthorizedCallback(() => {
      if (isHandlingUnauthorized.current) return;
      isHandlingUnauthorized.current = true;
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        token: null,
        expiresAt: null,
        user: null,
        companies: [],
        access: [],
        sessionExpiredMessage: 'Sessão expirada, faça login novamente.',
      }));
      isHandlingUnauthorized.current = false;
    });
  }, []);

  // Restaurar sessão ao iniciar o app
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await storage.getSecure(STORAGE_KEYS.AUTH_TOKEN);
        const expiresAt = await storage.getItem(STORAGE_KEYS.AUTH_EXPIRES);
        const userStr = await storage.getItem(STORAGE_KEYS.AUTH_USER);
        const companiesStr = await storage.getItem(STORAGE_KEYS.AUTH_COMPANIES);
        const accessStr = await storage.getItem(STORAGE_KEYS.AUTH_ACCESS);

        if (!token || !expiresAt) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        // Verificar se o token está expirado
        const expiry = new Date(expiresAt);
        if (expiry <= new Date()) {
          await clearAuthData();
          setState((prev) => ({
            ...prev,
            isLoading: false,
            sessionExpiredMessage: 'Sessão expirada, faça login novamente.',
          }));
          return;
        }

        const user = userStr ? (JSON.parse(userStr) as UserSnapshot) : null;
        const companies = companiesStr ? (JSON.parse(companiesStr) as CompanySnapshot[]) : [];
        const access = accessStr ? (JSON.parse(accessStr) as AccessSnapshot[]) : [];

        setState({
          isLoading: false,
          isAuthenticated: true,
          token,
          expiresAt,
          user,
          companies,
          access,
          sessionExpiredMessage: null,
        });
      } catch {
        await clearAuthData();
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const data = await authApi.login(dto);

    // Salvar token de forma segura
    await storage.setSecure(STORAGE_KEYS.AUTH_TOKEN, data.token);

    // Salvar demais dados em AsyncStorage
    await storage.setItem(STORAGE_KEYS.AUTH_EXPIRES, data.expiresAt);
    await storage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
    await storage.setItem(STORAGE_KEYS.AUTH_COMPANIES, JSON.stringify(data.companies));
    await storage.setItem(STORAGE_KEYS.AUTH_ACCESS, JSON.stringify(data.access));

    setState({
      isLoading: false,
      isAuthenticated: true,
      token: data.token,
      expiresAt: data.expiresAt,
      user: data.user,
      companies: data.companies,
      access: data.access,
      sessionExpiredMessage: null,
    });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      isLoading: false,
      isAuthenticated: false,
      token: null,
      expiresAt: null,
      user: null,
      companies: [],
      access: [],
      sessionExpiredMessage: null,
    });
  }, []);

  const clearSessionMessage = useCallback(() => {
    setState((prev) => ({ ...prev, sessionExpiredMessage: null }));
  }, []);

  // Verificar se o usuário tem role Master
  const isMaster =
    state.user?.roles?.toLowerCase().includes('master') ||
    state.access.some((a) => a.roleKey?.toLowerCase() === 'master') ||
    false;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        clearSessionMessage,
        isMaster,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
