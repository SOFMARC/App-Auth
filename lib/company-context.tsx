import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { storage } from "./storage";
import { accessApi, companiesApi } from "./api";
import { useAuth } from "./auth-context";
import type { Company } from "./types/api";

const SELECTED_COMPANY_KEY = "iam_selected_company_id";

interface CompanyContextValue {
  /** Empresa atualmente selecionada (null = todas) */
  selectedCompany: Company | null;
  /** Lista completa de empresas do usuário autenticado */
  companies: Company[];
  /** Está carregando a lista de empresas */
  isLoading: boolean;
  /** Selecionar uma empresa específica */
  selectCompany: (company: Company | null) => void;
  /** Recarregar lista de empresas */
  refresh: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

/**
 * CompanyProvider — gerencia a empresa selecionada globalmente.
 *
 * IMPORTANTE: Só carrega dados da API quando o usuário está autenticado.
 * Usa /api/access/me para obter as empresas do usuário (não requer admin).
 * Fallback para /api/admin/iam/companies se o usuário for MASTER.
 */
export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isMaster } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCompanies = useCallback(async () => {
    // Nunca chamar a API sem autenticação
    if (!isAuthenticated) {
      setCompanies([]);
      setSelectedCompany(null);
      return;
    }

    setIsLoading(true);
    try {
      let list: Company[] = [];

      if (isMaster) {
        // MASTER pode ver todas as empresas via endpoint admin
        const adminList = await companiesApi.list();
        list = adminList;
      } else {
        // Usuário comum: buscar apenas as empresas às quais tem acesso
        const accessData = await accessApi.me();
        list = accessData.companies.map((c) => ({
          id: c.companyId,
          name: c.name,
          ativo: true,
        }));
      }

      setCompanies(list);

      // Restaurar empresa selecionada do storage
      const savedId = await storage.getItem(SELECTED_COMPANY_KEY);
      if (savedId) {
        const found = list.find((c) => String(c.id) === savedId);
        if (found) {
          setSelectedCompany(found);
        } else if (list.length > 0) {
          // ID salvo não existe mais — selecionar a primeira
          setSelectedCompany(list[0]);
        }
      } else if (list.length === 1) {
        // Só uma empresa disponível — selecionar automaticamente
        setSelectedCompany(list[0]);
      }
    } catch {
      // Silencioso — não travar o app se falhar
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isMaster]);

  // Carregar empresas apenas quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadCompanies();
    } else {
      // Limpar estado ao deslogar
      setCompanies([]);
      setSelectedCompany(null);
    }
  }, [isAuthenticated, loadCompanies]);

  const selectCompany = useCallback(async (company: Company | null) => {
    setSelectedCompany(company);
    if (company) {
      await storage.setItem(SELECTED_COMPANY_KEY, String(company.id));
    } else {
      await storage.removeItem(SELECTED_COMPANY_KEY);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadCompanies();
  }, [loadCompanies]);

  return (
    <CompanyContext.Provider
      value={{ selectedCompany, companies, isLoading, selectCompany, refresh }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextValue {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
