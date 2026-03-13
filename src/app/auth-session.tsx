import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from './lib/firebase';
import { setApiAccessToken } from './lib/api-client';
import { getAuthMe, syncFirebaseUser } from './lib/pethub-api';
import { toFriendlyAuthError } from './lib/auth-errors';
import type { AuthRole, AuthUser, SessionState } from './types';

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
};

type UpdateProfileInput = {
  name: string;
  phone?: string;
};

type AuthContextValue = {
  session: SessionState;
  login: (input: LoginInput) => Promise<AuthUser>;
  loginWithGoogle: () => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  sendResetPasswordEmail: (email: string) => Promise<void>;
  updateSessionProfile: (input: UpdateProfileInput) => Promise<AuthUser>;
};

const unauthenticatedSession: SessionState = {
  status: 'unauthenticated',
  isAuthenticated: false,
  role: null,
  userName: '',
  user: null,
  error: null,
};

const loadingSession: SessionState = {
  ...unauthenticatedSession,
  status: 'loading',
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getDefaultRoute(role: AuthRole | null) {
  return role === 'manager' ? '/manager' : '/customer/dashboard';
}

function toSession(user: AuthUser): SessionState {
  return {
    status: 'authenticated',
    isAuthenticated: true,
    role: user.role,
    userName: user.name,
    user,
    error: null,
  };
}

function resolveClinicSlug(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const fromQuery = new URLSearchParams(window.location.search).get('clinic')?.trim();
  if (fromQuery) {
    window.sessionStorage.setItem('clinicSlug', fromQuery);
    return fromQuery;
  }

  return window.sessionStorage.getItem('clinicSlug')?.trim() || undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>(loadingSession);

  const hydrateUser = useCallback(
    async (firebaseUser: FirebaseUser, profileOverride?: { name?: string; phone?: string }) => {
      const idToken = await firebaseUser.getIdToken(true);
      setApiAccessToken(idToken);
      try {
        const clinicSlug = resolveClinicSlug();
        await syncFirebaseUser({
          idToken,
          name: profileOverride?.name ?? firebaseUser.displayName ?? undefined,
          phone: profileOverride?.phone ?? firebaseUser.phoneNumber ?? undefined,
          clinicSlug,
        });
        return getAuthMe();
      } catch (error) {
        throw new Error(toFriendlyAuthError(error, 'sync'));
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!mounted) {
        return;
      }

      if (!firebaseUser) {
        setApiAccessToken(null);
        setSession(unauthenticatedSession);
        return;
      }

      setSession((previous) => ({ ...previous, status: 'loading', error: null }));

      try {
        const authUser = await hydrateUser(firebaseUser);
        if (mounted) {
          setSession(toSession(authUser));
        }
      } catch (error) {
        if (!mounted) {
          return;
        }
        const message = toFriendlyAuthError(error, 'sync');
        setApiAccessToken(null);
        setSession({ ...unauthenticatedSession, error: message });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [hydrateUser]);

  const login = useCallback(
    async ({ email, password }: LoginInput) => {
      setSession((previous) => ({ ...previous, status: 'loading', error: null }));
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        const authUser = await hydrateUser(credential.user);
        const nextSession = toSession(authUser);
        setSession(nextSession);
        return authUser;
      } catch (error) {
        const message = toFriendlyAuthError(error, 'login');
        setSession({ ...unauthenticatedSession, error: message });
        throw new Error(message);
      }
    },
    [hydrateUser],
  );

  const loginWithGoogle = useCallback(async () => {
    setSession((previous) => ({ ...previous, status: 'loading', error: null }));
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      const authUser = await hydrateUser(credential.user);
      const nextSession = toSession(authUser);
      setSession(nextSession);
      return authUser;
    } catch (error) {
      const message = toFriendlyAuthError(error, 'google-login');
      setSession({ ...unauthenticatedSession, error: message });
      throw new Error(message);
    }
  }, [hydrateUser]);

  const register = useCallback(
    async ({ email, password, name, phone }: RegisterInput) => {
      setSession((previous) => ({ ...previous, status: 'loading', error: null }));
      try {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        if (name.trim().length > 0) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
        const authUser = await hydrateUser(credential.user, { name, phone });
        const nextSession = toSession(authUser);
        setSession(nextSession);
        return authUser;
      } catch (error) {
        const message = toFriendlyAuthError(error, 'register');
        setSession({ ...unauthenticatedSession, error: message });
        throw new Error(message);
      }
    },
    [hydrateUser],
  );

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    setApiAccessToken(null);
    setSession(unauthenticatedSession);
  }, []);

  const sendResetPasswordEmail = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
    } catch (error) {
      throw new Error(toFriendlyAuthError(error, 'reset-password'));
    }
  }, []);

  const updateSessionProfile = useCallback(
    async ({ name, phone }: UpdateProfileInput) => {
      const firebaseUser = firebaseAuth.currentUser;
      if (!firebaseUser) {
        throw new Error('Bạn chưa đăng nhập.');
      }

      if (name.trim().length > 0 && firebaseUser.displayName !== name.trim()) {
        await updateProfile(firebaseUser, { displayName: name.trim() });
      }

      const idToken = await firebaseUser.getIdToken(true);
      setApiAccessToken(idToken);
      try {
        await syncFirebaseUser({
          idToken,
          name: name.trim(),
          phone: phone?.trim() || undefined,
        });
        const authUser = await getAuthMe();
        setSession(toSession(authUser));
        return authUser;
      } catch (error) {
        throw new Error(toFriendlyAuthError(error, 'profile-update'));
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login,
      loginWithGoogle,
      register,
      logout,
      sendResetPasswordEmail,
      updateSessionProfile,
    }),
    [login, loginWithGoogle, logout, register, sendResetPasswordEmail, session, updateSessionProfile],
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

function FullScreenLoading() {
  return (
    <div className='min-h-screen bg-[#faf9f6] flex items-center justify-center'>
      <div className='rounded-xl border border-[#2d2a26] bg-white px-5 py-3 text-sm text-[#2d2a26]'>
        Đang xác thực phiên đăng nhập...
      </div>
    </div>
  );
}

export function PublicOnlyGuard() {
  const { session } = useAuthSession();
  if (session.status === 'loading') {
    return <FullScreenLoading />;
  }
  if (session.isAuthenticated) {
    return <Navigate to={getDefaultRoute(session.role)} replace />;
  }
  return <Outlet />;
}

export function RequireCustomerGuard() {
  const { session } = useAuthSession();
  const location = useLocation();

  if (session.status === 'loading') {
    return <FullScreenLoading />;
  }

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

  if (session.status === 'loading') {
    return <FullScreenLoading />;
  }

  if (!session.isAuthenticated) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  if (session.role !== 'manager') {
    return <Navigate to={getDefaultRoute(session.role)} replace />;
  }

  return <Outlet />;
}
