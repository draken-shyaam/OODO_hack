import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, MessageSquare, Star, LogOut } from 'lucide-react';
import { usePortalAuthStore } from '../store/portalAuthStore';
import { portalLogout as portalLogoutApi } from '../api/authApi';

export function PortalShell() {
  const navigate = useNavigate();
  const { customer, setUnauthenticated } = usePortalAuthStore();

  const NAV_ITEMS = [
    { path: '/portal', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/portal/orders', label: 'My Orders', icon: ShoppingBag },
    { path: '/portal/reviews', label: 'Reviews', icon: Star },
    { path: '/portal/messages', label: 'Messages', icon: MessageSquare },
  ];

  // PortalProtectedRoute (the parent route element) already verified the
  // session with the backend before this ever mounts.
  if (!customer) return null;

  const handleLogout = async () => {
    await portalLogoutApi();
    setUnauthenticated();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-4 md:px-6 w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/portal')}>
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-lg font-semibold tracking-tight">Customer Portal</span>
          </div>

          <nav className="hidden md:flex ml-10 space-x-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/portal'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-secondary/80 hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm font-medium hidden sm:inline-block">{customer.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 text-foreground/60 hover:bg-secondary/80 rounded-md flex items-center gap-2 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline-block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden border-b border-border bg-card px-4 py-2 flex overflow-x-auto space-x-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/portal'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-secondary/80'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
