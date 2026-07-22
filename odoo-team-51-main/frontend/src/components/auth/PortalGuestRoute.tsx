import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePortalAuthStore } from '../../store/portalAuthStore';
import { getMyPortalProfile } from '../../api/portalApi';

/** Same as GuestRoute, scoped to the customer portal's separate session cookie/store. */
export function PortalGuestRoute({ children }: { children?: React.ReactNode }) {
  const customer = usePortalAuthStore((s) => s.customer);
  const status = usePortalAuthStore((s) => s.status);
  const login = usePortalAuthStore((s) => s.login);
  const setLoading = usePortalAuthStore((s) => s.setLoading);
  const setUnauthenticated = usePortalAuthStore((s) => s.setUnauthenticated);

  useEffect(() => {
    if (status !== 'idle') return;
    setLoading();
    getMyPortalProfile()
      .then((c) => login(c))
      .catch(() => setUnauthenticated());
  }, [status, login, setLoading, setUnauthenticated]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-foreground/60">
        Checking session...
      </div>
    );
  }

  if (status === 'authenticated' && customer) {
    return <Navigate to="/portal" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
