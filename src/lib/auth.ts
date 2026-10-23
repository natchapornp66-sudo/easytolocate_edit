export type AppRole = 'guest' | 'user' | 'admin';

export interface AuthSession {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
}

export const AUTH_STORAGE_KEY = 'easy_to_locate_auth';

export const DEMO_ACCOUNTS = [
  {
    email: 'somchai@example.com',
    password: '123456',
    role: 'user' as const,
    fullName: 'สมชาย ใจดี',
  },
  {
    email: 'admin@easytolocate.com',
    password: 'admin123',
    role: 'admin' as const,
    fullName: 'Administrator',
  },
];

export const getAuthSession = (): AuthSession => {
  if (typeof window === 'undefined') {
    return {
      userId: '',
      email: '',
      fullName: '',
      role: 'guest',
    };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return {
        userId: '',
        email: '',
        fullName: '',
        role: 'guest',
      };
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    const role: AppRole =
      parsed.role === 'user' || parsed.role === 'admin'
        ? parsed.role
        : 'guest';

    return {
      userId: parsed.userId ?? '',
      email: parsed.email ?? '',
      fullName: parsed.fullName ?? '',
      role,
    };
  } catch {
    return {
      userId: '',
      email: '',
      fullName: '',
      role: 'guest',
    };
  }
};

export const setAuthSession = (session: AuthSession) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(session)
    );
  }
};

export const clearAuthSession = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem('token');
  }
};

export const loginWithCredentials = (
  email: string,
  password: string
): AuthSession | null => {
  const normalizedEmail = email.trim().toLowerCase();

  const match = DEMO_ACCOUNTS.find(
    (account) =>
      account.email.toLowerCase() === normalizedEmail &&
      account.password === password
  );

  if (!match) {
    return null;
  }

  const session: AuthSession = {
    userId: '',
    email: match.email,
    fullName: match.fullName,
    role: match.role,
  };

  setAuthSession(session);

  return session;
};

export const isGuest = () => {
  return getAuthSession().role === 'guest';
};