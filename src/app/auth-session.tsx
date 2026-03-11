import { createContext, useContext, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import type { AuthRole, SessionState } from './types';

const STORAGE_KEY = 'pethub-session';

type AuthContextValue = {
  session: SessionState;
  login: (role: AuthRole, userName?: string) => void;
  logout: () => void;
};

const defaultSession: SessionState = {
  isAuthenticated: false,
  role: null,
  userName: '',
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getDefaultRoute(role: AuthRole | null) {
  return role === 'manager' ? '/manager' : '/customer/dashboard';
}

function readStoredSession(): SessionState {
  if (typeof window === 'undefined') {
    return defaultSession;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSession;
    }

    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed.isAuthenticated || !parsed.role) {
      return defaultSession;
    }

    return parsed;
  } catch {
    return defaultSession;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>(() => readStoredSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login: (role, userName = role === 'manager' ? 'Phạm Hương' : 'Nguyễn Văn An') => {
        const next: SessionState = {
          isAuthenticated: true,
          role,
          userName,
        };
        setSession(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      },
      logout: () => {
        setSession(defaultSession);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }
  return context;
}

export function PublicOnlyGuard() {
  const { session } = useAuthSession();
  if (session.isAuthenticated) {
    return <Navigate to={getDefaultRoute(session.role)} replace />;
  }
  return <Outlet />;
}

export function RequireCustomerGuard() {
  const { session } = useAuthSession();
  const location = useLocation();

  if (!session.isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  if (session.role !== 'customer') {
    return <Navigate to={getDefaultRoute(session.role)} replace />;
  }

  return <Outlet />;
}

export function RequireManagerGuard() {
  const { session } = useAuthSession();
  const location = useLocation();

  if (!session.isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  if (session.role !== 'manager') {
    return <Navigate to={getDefaultRoute(session.role)} replace />;
  }

  return <Outlet />;
}