import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getMe } from '../../api/userManagementApi';
import { Forbidden } from '../../features/auth/Forbidden';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  /** Renders Forbidden instead of the page when the (already-authenticated) user isn't an Admin. */
  requireAdmin?: boolean;
}

/**
 * Wraps the internal app's private routes (Dashboard, Sales, Purchase,
 * Manufacturing, Reports, etc). Unlike the old localStorage-token check,
 * this asks the backend whether the HttpOnly session cookie is still valid
 * — typing a private URL directly with no/expired session always redirects
 * to /login, it never trusts client-side state alone.
 *
 * The session check only runs once per app load: `status` lives in the
 * shared authStore, so nested ProtectedRoute instances (e.g. admin-only leaf
 * routes) read the already-resolved result instead of re-checking.
 */
export function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  useEffect(() => {
    if (status !== 'idle') return;
    setLoading();
    getMe()
      .then((u) => login(u))
      .catch(() => setUnauthenticated());
  }, [status, login, setLoading, setUnauthenticated]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-foreground/60">
        Checking session...
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Forbidden />;
  }

  return children ? <>{children}</> : <Outlet />;
}
