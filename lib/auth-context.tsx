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
import { logger, setLoggerUser, clearLoggerUser } from './logger';
import type { UserSnapshot, CompanySnapshot, AccessSnapshot, LoginDto } from './types/api';

interface AuthState {
  /** true enquanto está verificando o token salvo no storage */
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

  // Flag para evitar que o callback 401 dispare durante a restauração da sessão
  const isRestoringSession = useRef(true);
  const isHandlingUnauthorized = useRef(false);

  // Registrar callback de 401 — só age depois que a sessão foi restaurada
  useEffect(() => {
    setUnauthorizedCallback(() => {
      // Ignorar 401s que chegam durante a inicialização (ex: CompanyContext carregando)
      if (isRestoringSession.current) return;
      if (isHandlingUnauthorized.current) return;

      isHandlingUnauthorized.current = true;
      clearLoggerUser();
      logger.warn('auth', 'Sessão expirada — token inválido (401)');
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
      // Resetar após um tick para evitar loops
      setTimeout(() => {
        isHandlingUnauthorized.current = false;
      }, 500);
    });
  }, []);

  // Restaurar sessão ao iniciar o app
  useEffect(() => {
    async function restoreSession() {
      isRestoringSession.current = true;
      try {
        const token = await storage.getSecure(STORAGE_KEYS.AUTH_TOKEN);
        const expiresAt = await storage.getItem(STORAGE_KEYS.AUTH_EXPIRES);

        if (!token || !expiresAt) {
          // Sem sessão salva → ir para login
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
          return;
        }

        // Verificar se o token está expirado localmente
        const expiry = new Date(expiresAt);
        if (expiry <= new Date()) {
          await clearAuthData();
          setState({
            isLoading: false,
            isAuthenticated: false,
            token: null,
            expiresAt: null,
            user: null,
            companies: [],
            access: [],
            sessionExpiredMessage: 'Sessão expirada, faça login novamente.',
          });
          return;
        }

        // Token válido — restaurar dados do usuário
        const userStr = await storage.getItem(STORAGE_KEYS.AUTH_USER);
        const companiesStr = await storage.getItem(STORAGE_KEYS.AUTH_COMPANIES);
        const accessStr = await storage.getItem(STORAGE_KEYS.AUTH_ACCESS);

        const user = userStr ? (JSON.parse(userStr) as UserSnapshot) : null;
        const companies = companiesStr ? (JSON.parse(companiesStr) as CompanySnapshot[]) : [];
        const access = accessStr ? (JSON.parse(accessStr) as AccessSnapshot[]) : [];

        if (user) {
          setLoggerUser({
            userId: String(user.id ?? ''),
            userEmail: user.email,
          });
        }

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
      } catch (err) {
        // Erro ao ler storage — limpar e ir para login
        logger.captureError('auth', err, { context: 'restoreSession' });
        await clearAuthData();
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
      } finally {
        // Liberar o guard após a restauração completa
        setTimeout(() => {
          isRestoringSession.current = false;
        }, 300);
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

    setLoggerUser({
      userId: String(data.user?.id ?? ''),
      userEmail: data.user?.email,
    });

    isRestoringSession.current = false;

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
    clearLoggerUser();
    isRestoringSession.current = true;
    try {
      await authApi.logout();
    } catch {
      // Ignorar erros de logout (token pode já estar inválido)
    } finally {
      await clearAuthData();
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
      setTimeout(() => {
        isRestoringSession.current = false;
      }, 300);
    }
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
