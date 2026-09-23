import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthSession } from '@/lib/auth';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
};

export const ProtectedRoute = ({ children, requiredRole = 'user' }: ProtectedRouteProps) => {
  const session = getAuthSession();

  if (requiredRole === 'admin') {
    if (session.role !== 'admin') {
      return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
  }

  if (session.role === 'guest') {
    return <Navigate to="/login" replace />;
  }

  if (session.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const session = getAuthSession();

  if (session.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (session.role === 'user') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
