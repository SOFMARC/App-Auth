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

  const isRestoringSession = useRef(true);
  const isHandlingUnauthorized = useRef(false);

  // Log de diagnóstico: AuthProvider montou
  useEffect(() => {
    logger.info('init', 'AuthProvider montado — iniciando restauração de sessão', {
      platform: require('react-native').Platform.OS,
      version: require('expo-constants').default.expoConfig?.version,
    });
  }, []);

  // Registrar callback de 401
  useEffect(() => {
    setUnauthorizedCallback(() => {
      if (isRestoringSession.current) {
        logger.info('auth', '401 ignorado durante restauração de sessão');
        return;
      }
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
      setTimeout(() => {
        isHandlingUnauthorized.current = false;
      }, 500);
    });
  }, []);

  // Restaurar sessão ao iniciar o app
  useEffect(() => {
    async function restoreSession() {
      isRestoringSession.current = true;
      logger.info('init', 'PASSO 1: Iniciando restoreSession');

      try {
        logger.info('init', 'PASSO 2: Lendo token do SecureStore...');
        const token = await storage.getSecure(STORAGE_KEYS.AUTH_TOKEN);
        logger.info('init', `PASSO 3: Token encontrado: ${token ? 'SIM' : 'NÃO'}`);

        const expiresAt = await storage.getItem(STORAGE_KEYS.AUTH_EXPIRES);
        logger.info('init', `PASSO 4: ExpiresAt: ${expiresAt ?? 'null'}`);

        if (!token || !expiresAt) {
          logger.info('init', 'PASSO 5: Sem sessão salva → redirecionando para login');
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

        // Verificar expiração
        const expiry = new Date(expiresAt);
        const now = new Date();
        logger.info('init', `PASSO 5: Verificando expiração: expiry=${expiry.toISOString()} now=${now.toISOString()} expirado=${expiry <= now}`);

        if (expiry <= now) {
          logger.info('init', 'PASSO 6: Token expirado → limpando e redirecionando para login');
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

        logger.info('init', 'PASSO 6: Token válido → restaurando dados do usuário...');
        const userStr = await storage.getItem(STORAGE_KEYS.AUTH_USER);
        const companiesStr = await storage.getItem(STORAGE_KEYS.AUTH_COMPANIES);
        const accessStr = await storage.getItem(STORAGE_KEYS.AUTH_ACCESS);

        logger.info('init', `PASSO 7: Dados lidos: user=${userStr ? 'OK' : 'null'} companies=${companiesStr ? 'OK' : 'null'} access=${accessStr ? 'OK' : 'null'}`);

        const user = userStr ? (JSON.parse(userStr) as UserSnapshot) : null;
        const companies = companiesStr ? (JSON.parse(companiesStr) as CompanySnapshot[]) : [];
        const access = accessStr ? (JSON.parse(accessStr) as AccessSnapshot[]) : [];

        if (user) {
          setLoggerUser({
            userId: String(user.id ?? ''),
            userEmail: user.email,
          });
        }

        logger.info('init', `PASSO 8: Sessão restaurada com sucesso — user=${user?.email ?? 'null'} companies=${companies.length} access=${access.length}`);

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
        logger.captureError('init', err, { context: 'restoreSession — ERRO CRÍTICO' });
        logger.fatal('init', `ERRO FATAL em restoreSession: ${err instanceof Error ? err.message : String(err)}`, {
          stack: err instanceof Error ? err.stack : undefined,
        });
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
        logger.info('init', 'PASSO 9: restoreSession finalizado — liberando guard de 401');
        setTimeout(() => {
          isRestoringSession.current = false;
        }, 300);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    logger.info('auth', `Tentativa de login: ${dto.email}`);
    try {
      const data = await authApi.login(dto);
      logger.info('auth', `Login bem-sucedido: ${data.user?.email ?? 'unknown'}`);

      await storage.setSecure(STORAGE_KEYS.AUTH_TOKEN, data.token);
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
    } catch (err) {
      logger.captureError('auth', err, { context: 'login', email: dto.email });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    logger.info('auth', 'Logout iniciado');
    clearLoggerUser();
    isRestoringSession.current = true;
    try {
      await authApi.logout();
    } catch {
      // Ignorar erros de logout
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
