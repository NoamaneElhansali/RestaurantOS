export type AuthUser = {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  is_super_admin: boolean;
};

export type Restaurant = {
  id: number;
  name: string;
  slug: string;
};

export type Role = 'owner' | 'manager' | 'waiter' | 'kitchen_staff' | 'menu_editor';
export type RestaurantMembership = Restaurant & { role: Role };
export type Member = { id: number; user: Pick<AuthUser, 'id' | 'name' | 'email'>; role: Role };

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
  }
}

export function csrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const token = document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='));
  return token ? decodeURIComponent(token.slice('XSRF-TOKEN='.length)) : undefined;
}

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const modifying = !['GET', 'HEAD'].includes(method);
  if (modifying) {
    const csrf = await fetch('/sanctum/csrf-cookie', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
    if (!csrf.ok) throw new ApiError(csrf.status, 'Unable to establish a secure session.');
  }

  const token = csrfToken();
  const response = await fetch('/api/v1' + path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(modifying && token ? { 'X-XSRF-TOKEN': token } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  let result: unknown;
  try { result = await response.json(); } catch { result = {}; }
  if (!response.ok) {
    const data = (typeof result === 'object' && result !== null) ? result as Record<string, unknown> : {};
    const errors = typeof data.errors === 'object' && data.errors !== null ? data.errors as Record<string, string[]> : {};
    const message = typeof data.message === 'string' ? data.message : `Request failed (HTTP ${response.status})`;
    throw new ApiError(response.status, message, errors);
  }
  return result as T;
}

export const identity = {
  me: () => api<{ user: AuthUser }>('/auth/me'),
  login: (email: string, password: string) => api<{ user: AuthUser }>('/auth/login', 'POST', { email, password }),
  register: (name: string, email: string, password: string, password_confirmation: string) =>
    api<{ user: AuthUser }>('/auth/register', 'POST', { name, email, password, password_confirmation }),
  logout: () => api<{ message: string }>('/auth/logout', 'POST'),
  forgot: (email: string) => api<{ message: string }>('/auth/forgot-password', 'POST', { email }),
  reset: (email: string, token: string, password: string, password_confirmation: string) =>
    api<{ message: string }>('/auth/reset-password', 'POST', { email, token, password, password_confirmation }),
  verify: () => api<{ message: string }>('/auth/email/verification-notification', 'POST'),
  restaurants: () => api<{ restaurants: RestaurantMembership[] }>('/restaurants'),
  createRestaurant: (name: string) => api<{ restaurant: Restaurant }>('/restaurants', 'POST', { name }),
  active: () => api<{ restaurant: Restaurant | null; role?: Role }>('/restaurants/active'),
  switchRestaurant: (id: number) => api<{ restaurant: Restaurant; role: Role }>(`/restaurants/${id}/switch`, 'POST'),
  restaurant: (id: number) => api<{ restaurant: Restaurant; role: Role }>(`/restaurants/${id}/`),
  renameRestaurant: (id: number, name: string) => api<{ restaurant: Restaurant }>(`/restaurants/${id}/`, 'PATCH', { name }),
  members: (id: number) => api<{ members: Member[] }>(`/restaurants/${id}/members`),
  addMember: (id: number, email: string, role: Role) => api<{ member: Member }>(`/restaurants/${id}/members`, 'POST', { email, role }),
  removeMember: (id: number, membershipId: number) => api<{ message: string }>(`/restaurants/${id}/members/${membershipId}`, 'DELETE'),
};
