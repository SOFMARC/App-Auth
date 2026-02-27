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
import { logger } from "./logger";
import type { Company } from "./types/api";

const SELECTED_COMPANY_KEY = "iam_selected_company_id";

interface CompanyContextValue {
  selectedCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  selectCompany: (company: Company | null) => void;
  refresh: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isMaster } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCompanies = useCallback(async () => {
    if (!isAuthenticated) {
      logger.info('init', '[COMPANY] Não autenticado — ignorando loadCompanies');
      setCompanies([]);
      setSelectedCompany(null);
      return;
    }

    logger.info('init', `[COMPANY] Carregando empresas — isMaster=${isMaster}`);
    setIsLoading(true);
    try {
      let list: Company[] = [];

      if (isMaster) {
        logger.info('init', '[COMPANY] Chamando companiesApi.list() (MASTER)...');
        const adminList = await companiesApi.list();
        list = adminList;
        logger.info('init', `[COMPANY] companiesApi.list() retornou ${list.length} empresas`);
      } else {
        logger.info('init', '[COMPANY] Chamando accessApi.me() (usuário comum)...');
        const accessData = await accessApi.me();
        list = accessData.companies.map((c) => ({
          id: c.companyId,
          name: c.name,
          ativo: true,
        }));
        logger.info('init', `[COMPANY] accessApi.me() retornou ${list.length} empresas`);
      }

      setCompanies(list);

      const savedId = await storage.getItem(SELECTED_COMPANY_KEY);
      if (savedId) {
        const found = list.find((c) => String(c.id) === savedId);
        if (found) {
          setSelectedCompany(found);
          logger.info('init', `[COMPANY] Empresa restaurada do storage: ${found.name}`);
        } else if (list.length > 0) {
          setSelectedCompany(list[0]);
          logger.info('init', `[COMPANY] Empresa salva não encontrada — selecionando primeira: ${list[0].name}`);
        }
      } else if (list.length === 1) {
        setSelectedCompany(list[0]);
        logger.info('init', `[COMPANY] Única empresa — selecionada automaticamente: ${list[0].name}`);
      } else {
        logger.info('init', `[COMPANY] ${list.length} empresas disponíveis — nenhuma pré-selecionada`);
      }
    } catch (err) {
      logger.captureError('company', err, { context: 'loadCompanies', isAuthenticated, isMaster });
      logger.error('company', `[COMPANY] ERRO ao carregar empresas: ${err instanceof Error ? err.message : String(err)}`);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isMaster]);

  useEffect(() => {
    if (isAuthenticated) {
      logger.info('init', '[COMPANY] isAuthenticated=true → chamando loadCompanies');
      loadCompanies();
    } else {
      logger.info('init', '[COMPANY] isAuthenticated=false → limpando estado');
      setCompanies([]);
      setSelectedCompany(null);
    }
  }, [isAuthenticated, loadCompanies]);

  const selectCompany = useCallback(async (company: Company | null) => {
    setSelectedCompany(company);
    if (company) {
      await storage.setItem(SELECTED_COMPANY_KEY, String(company.id));
      logger.info('company', `Empresa selecionada: ${company.name} (id=${company.id})`);
    } else {
      await storage.removeItem(SELECTED_COMPANY_KEY);
      logger.info('company', 'Seleção de empresa limpa');
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
