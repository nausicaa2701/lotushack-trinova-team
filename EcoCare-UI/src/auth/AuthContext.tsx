import React, { createContext, useContext, useMemo, useState } from 'react';

export type UserRole = 'owner' | 'provider' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  defaultRole?: UserRole;
  vehicle?: string;
  vehiclePlate?: string;
  branch?: string;
  title?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  activeRole: UserRole | null;
  availableRoles: UserRole[];
  isAuthenticated: boolean;
  login: (nextUser: AuthUser) => UserRole;
  switchRole: (nextRole: UserRole) => void;
  logout: () => void;
}

const STORAGE_KEY = 'washnet-auth-user';
const STORAGE_ROLE_KEY = 'washnet-role-preferences';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function resolveRoleForUser(nextUser: AuthUser): UserRole {
  const fallback = nextUser.defaultRole ?? nextUser.roles[0];
  try {
    const prefs = JSON.parse(localStorage.getItem(STORAGE_ROLE_KEY) ?? '{}') as Record<string, UserRole>;
    const previous = prefs[nextUser.id];
    if (previous && nextUser.roles.includes(previous)) {
      return previous;
    }
  } catch {
    // ignore preference parsing issues
  }
  return fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [activeRole, setActiveRole] = useState<UserRole | null>(() => (user ? resolveRoleForUser(user) : null));

  const resolveInitialRole = (nextUser: AuthUser): UserRole => {
    return resolveRoleForUser(nextUser);
  };

  const persistRolePreference = (userId: string, role: UserRole) => {
    try {
      const prefs = JSON.parse(localStorage.getItem(STORAGE_ROLE_KEY) ?? '{}') as Record<string, UserRole>;
      prefs[userId] = role;
      localStorage.setItem(STORAGE_ROLE_KEY, JSON.stringify(prefs));
    } catch {
      // no-op
    }
  };

  const login = (nextUser: AuthUser): UserRole => {
    const nextRole = resolveInitialRole(nextUser);
    setUser(nextUser);
    setActiveRole(nextRole);
    persistRolePreference(nextUser.id, nextRole);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    return nextRole;
  };

  const switchRole = (nextRole: UserRole) => {
    if (!user || !user.roles.includes(nextRole)) return;
    setActiveRole(nextRole);
    persistRolePreference(user.id, nextRole);
  };

  const logout = () => {
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  React.useEffect(() => {
    if (!user) return;
    if (!activeRole || !user.roles.includes(activeRole)) {
      const nextRole = resolveInitialRole(user);
      setActiveRole(nextRole);
      persistRolePreference(user.id, nextRole);
    }
  }, [user, activeRole]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeRole,
      availableRoles: user?.roles ?? [],
      isAuthenticated: Boolean(user),
      login,
      switchRole,
      logout,
    }),
    [user, activeRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
