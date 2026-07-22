import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getMe } from '../../api/userManagementApi';

/**
 * Wraps the internal login/signup pages. Without this, visiting /login while
 * a valid session cookie still exists just renders the login form over the
 * live session — indistinguishable from being logged out, even though the
 * backend session is untouched. This checks the session the same way
 * ProtectedRoute does and bounces already-authenticated users to "/" instead.
 */
export function GuestRoute({ children }: { children?: React.ReactNode }) {
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

  if (status === 'authenticated' && user) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
