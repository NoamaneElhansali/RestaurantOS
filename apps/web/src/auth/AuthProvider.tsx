import { createContext, useContext, type PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { ApiError, identity, type AuthUser } from '../lib/api';

type AuthContextState = {
  user: AuthUser | null;
  pending: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: identity.me,
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
    staleTime: 15_000,
  });
  const value: AuthContextState = {
    user: query.data?.user ?? null,
    pending: query.isPending,
    refresh: async () => { await client.invalidateQueries({ queryKey: ['auth'] }); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, pending } = useAuth();
  const location = useLocation();
  if (pending) return <p role="status" className="p-8">Checking your session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!user.email_verified) return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
}
