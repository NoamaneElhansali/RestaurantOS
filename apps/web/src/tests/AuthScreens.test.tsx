import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from '../auth/AuthProvider';
import { AuthPage } from '../pages/AuthPages';
import { Dashboard } from '../pages/Dashboard';

beforeEach(async () => { await i18n.changeLanguage('en'); });
afterEach(() => { vi.unstubAllGlobals(); void i18n.changeLanguage('fr'); });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function renderWithAuth(initial: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initial]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/verify-email" element={<h1>Verification required</h1>} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const user = { id: 1, name: 'Amine', email: 'amine@example.test', email_verified: true, is_super_admin: false };

describe('auth and restaurant screens', () => {
  it('shows backend login validation without exposing the private dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/api/v1/auth/me') return json({ message: 'Unauthenticated.' }, 401);
      if (url === '/sanctum/csrf-cookie') return new Response(null, { status: 204 });
      if (url === '/api/v1/auth/login') return json({ message: 'Invalid credentials.', errors: { email: ['Invalid credentials.'] } }, 422);
      throw new Error('Unexpected route ' + url);
    }));

    renderWithAuth('/login');
    const email = await screen.findByLabelText('Email address');
    fireEvent.change(email, { target: { value: 'amine@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'incorrect' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials.');
    expect(screen.queryByText('Restaurant dashboard')).not.toBeInTheDocument();
  });

  it('creates a real restaurant, switches to it, and renders role-authorized controls', async () => {
    let created = false;
    let switched = false;
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
      calls.push(`${options.method} ${url}`);
      if (url === '/api/v1/auth/me') return json({ user });
      if (url === '/api/v1/restaurants' && options.method === 'GET') {
        return json({ restaurants: created ? [{ id: 42, name: 'Café Atlas', slug: 'cafe-atlas', role: 'owner' }] : [] });
      }
      if (url === '/api/v1/restaurants/active') return json({ restaurant: switched ? { id: 42, name: 'Café Atlas', slug: 'cafe-atlas' } : null });
      if (url === '/api/v1/restaurants/42/' && options.method === 'GET') return json({ restaurant: { id: 42, name: 'Café Atlas', slug: 'cafe-atlas' }, role: 'owner' });
      if (url === '/api/v1/restaurants/42/members') return json({ members: [{ id: 1, user: { id: 1, name: 'Amine', email: user.email }, role: 'owner' }] });
      if (url === '/sanctum/csrf-cookie') return new Response(null, { status: 204 });
      if (url === '/api/v1/restaurants' && options.method === 'POST') {
        created = true;
        return json({ restaurant: { id: 42, name: 'Café Atlas', slug: 'cafe-atlas' } }, 201);
      }
      if (url === '/api/v1/restaurants/42/switch' && options.method === 'POST') {
        switched = true;
        return json({ restaurant: { id: 42, name: 'Café Atlas', slug: 'cafe-atlas' }, role: 'owner' });
      }
      throw new Error(`Unexpected route: ${options.method} ${url}`);
    }));

    renderWithAuth('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Create restaurant' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Restaurant name'), { target: { value: 'Café Atlas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('heading', { name: 'Café Atlas' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Staff memberships' })).toBeInTheDocument();
    expect(calls).toContain('POST /api/v1/restaurants');
    expect(calls).toContain('POST /api/v1/restaurants/42/switch');
  });
});
