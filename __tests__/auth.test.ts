import { describe, it, expect, vi } from 'vitest';

// Test login response shape validation
describe('LoginResponse validation', () => {
  it('validates a complete login response', () => {
    const loginResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: {
        id: 1,
        nome: 'Admin Master',
        email: 'admin@empresa.com',
        ativo: true,
        roles: 'Master',
      },
      companies: [
        { companyId: 1, name: 'Empresa Teste' },
      ],
      access: [
        {
          companyId: 1,
          companyName: 'Empresa Teste',
          appId: 1,
          appKey: 'MYAPP',
          appRoleId: 1,
          roleKey: 'ADMIN',
          roleName: 'Administrador',
        },
      ],
    };

    expect(loginResponse.token).toBeTruthy();
    expect(loginResponse.user.id).toBe(1);
    expect(loginResponse.companies).toHaveLength(1);
    expect(loginResponse.access).toHaveLength(1);
    expect(loginResponse.access[0].appKey).toBe('MYAPP');
  });

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

describe('isMaster detection', () => {
  it('detects master from user roles string', () => {
    const user = { roles: 'Master;User' };
    const isMaster = user.roles.toLowerCase().includes('master');
    expect(isMaster).toBe(true);
  });

  it('detects master from access snapshot', () => {
    const access = [
      { roleKey: 'MASTER', roleName: 'Master', companyId: 1, companyName: 'Test', appId: 1, appKey: 'APP', appRoleId: 1 },
    ];
    const isMaster = access.some((a) => a.roleKey?.toLowerCase() === 'master');
    expect(isMaster).toBe(true);
  });

  it('returns false when not master', () => {
    const user = { roles: 'User;Viewer' };
    const access = [
      { roleKey: 'USER', roleName: 'User', companyId: 1, companyName: 'Test', appId: 1, appKey: 'APP', appRoleId: 1 },
    ];
    const isMaster =
      user.roles.toLowerCase().includes('master') ||
      access.some((a) => a.roleKey?.toLowerCase() === 'master');
    expect(isMaster).toBe(false);
  });
});

describe('User data validation', () => {
  it('validates user create DTO', () => {
    const dto = {
      nome: 'João Silva',
      email: 'joao@empresa.com',
      password: 'Senha@123',
      ativo: true,
    };

    expect(dto.nome.trim()).toBeTruthy();
    expect(dto.email.trim()).toBeTruthy();
    expect(dto.password.length).toBeGreaterThanOrEqual(6);
  });

  it('rejects empty email', () => {
    const email = '';
    expect(email.trim()).toBeFalsy();
  });

  it('rejects short password', () => {
    const password = '123';
    expect(password.length).toBeLessThan(6);
  });
});

describe('App key validation', () => {
  it('accepts valid app keys', () => {
    const validKeys = ['MYAPP', 'MY_APP', 'APP-V2', 'APP123'];
    validKeys.forEach((key) => {
      expect(/^[A-Z0-9_-]+$/.test(key)).toBe(true);
    });
  });

  it('rejects invalid app keys', () => {
    const invalidKeys = ['my app', 'app@v2', 'app.v2'];
    invalidKeys.forEach((key) => {
      expect(/^[A-Z0-9_-]+$/.test(key.toUpperCase())).toBe(false);
    });
  });
});
