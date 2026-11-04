import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from '../auth/AuthProvider';

afterEach(() => vi.unstubAllGlobals());

function renderProtected() {
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={query}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<h1>Login screen</h1>} />
            <Route path="/verify-email" element={<h1>Verification screen</h1>} />
            <Route path="/dashboard" element={<RequireAuth><h1>Private dashboard</h1></RequireAuth>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function identityResponse(verified: boolean) {
  return { user: { id: 1, name: 'Test', email: 'test@example.test', email_verified: verified, is_super_admin: false } };
}

describe('authenticated route boundaries', () => {
  it('redirects anonymous visitors to login', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Unauthenticated.' }), { status: 401 })));
    renderProtected();
    expect(await screen.findByRole('heading', { name: 'Login screen' })).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
  });

  it('blocks signed-in users who have not verified email', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(identityResponse(false)), { status: 200 })));
    renderProtected();
    expect(await screen.findByRole('heading', { name: 'Verification screen' })).toBeInTheDocument();
  });

  it('allows verified users through', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(identityResponse(true)), { status: 200 })));
    renderProtected();
    expect(await screen.findByRole('heading', { name: 'Private dashboard' })).toBeInTheDocument();
  });
});
