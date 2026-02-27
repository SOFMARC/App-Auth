import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { storage } from "./storage";
import { companiesApi } from "./api";
import type { Company } from "./types/api";

const SELECTED_COMPANY_KEY = "iam_selected_company_id";

interface CompanyContextValue {
  /** Empresa atualmente selecionada (null = todas) */
  selectedCompany: Company | null;
  /** Lista completa de empresas carregadas da API */
  companies: Company[];
  /** Está carregando a lista de empresas */
  isLoading: boolean;
  /** Selecionar uma empresa específica */
  selectCompany: (company: Company | null) => void;
  /** Recarregar lista de empresas */
  refresh: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await companiesApi.list();
      setCompanies(list);

      // Restaurar empresa selecionada do storage
      const savedId = await storage.getItem(SELECTED_COMPANY_KEY);
      if (savedId) {
        const found = list.find((c) => String(c.id) === savedId);
        if (found) setSelectedCompany(found);
      }
    } catch {
      // Silencioso — pode falhar se o token ainda não estiver disponível
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

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
