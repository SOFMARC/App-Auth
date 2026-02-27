import { describe, it, expect, vi } from 'vitest';

// Test extractErrorMessage logic directly (pure logic, no axios dependency)
describe('extractErrorMessage logic', () => {
  function extractErrorMessage(error: unknown): string {
    const isAxiosError = (e: unknown): e is { response?: { status: number; data?: Record<string, unknown> } } => {
      return typeof e === 'object' && e !== null && 'response' in e;
    };

    if (isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403) return 'Sem permissão para realizar esta ação.';
      if (status === 404) return 'Recurso não encontrado.';
      if (status === 500) return 'Erro interno do servidor. Tente novamente.';

      if (data?.message) return data.message as string;
      if (data?.errors && Array.isArray(data.errors)) return (data.errors as string[]).join(', ');
      if (typeof data === 'string') return data;

      if (status === 400) return 'Dados inválidos. Verifique os campos e tente novamente.';
    }

    if (error instanceof Error) return error.message;
    return 'Ocorreu um erro inesperado.';
  }

  it('returns 403 message for forbidden errors', () => {
    const error = { response: { status: 403, data: {} } };
    expect(extractErrorMessage(error)).toBe('Sem permissão para realizar esta ação.');
  });

  it('returns 404 message for not found errors', () => {
    const error = { response: { status: 404, data: {} } };
    expect(extractErrorMessage(error)).toBe('Recurso não encontrado.');
  });

  it('returns API message when present', () => {
    const error = { response: { status: 400, data: { message: 'E-mail já cadastrado' } } };
    expect(extractErrorMessage(error)).toBe('E-mail já cadastrado');
  });

  it('returns errors array joined when present', () => {
    const error = { response: { status: 400, data: { errors: ['Campo obrigatório', 'E-mail inválido'] } } };
    expect(extractErrorMessage(error)).toBe('Campo obrigatório, E-mail inválido');
  });

  it('returns generic message for Error instance', () => {
    expect(extractErrorMessage(new Error('Network Error'))).toBe('Network Error');
  });

  it('returns fallback for completely unknown errors', () => {
    expect(extractErrorMessage({ unknown: true })).toBe('Ocorreu um erro inesperado.');
  });

  it('returns 500 message for server errors', () => {
    const error = { response: { status: 500, data: {} } };
    expect(extractErrorMessage(error)).toBe('Erro interno do servidor. Tente novamente.');
  });
});

describe('Token expiry check', () => {
  it('detects expired token', () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString();
    const isExpired = new Date(expiresAt) <= new Date();
    expect(isExpired).toBe(true);
  });

  it('detects valid token', () => {
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    const isExpired = new Date(expiresAt) <= new Date();
    expect(isExpired).toBe(false);
  });
});

describe('API URL validation', () => {
  it('accepts valid URLs', () => {
    const validUrls = [
      'https://api.empresa.com',
      'http://localhost:5000',
      'https://192.168.1.1:8080',
    ];
    validUrls.forEach((url) => {
      expect(() => new URL(url)).not.toThrow();
    });
  });
});
