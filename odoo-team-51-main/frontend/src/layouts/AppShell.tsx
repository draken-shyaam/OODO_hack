import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { logout as logoutApi } from '../api/authApi';
import { listProducts } from '../api/productApi';
import { getIntelHubNotifications } from '../api/intelHubApi';
import { useSocketEvent } from '../hooks/useSocket';
import type { MarketSignal, Product } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  Boxes,
  Users,
  Store,
  Activity,
  BarChart3,
  Stethoscope,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  User,
  Moon,
  Sun,
  Bell,
  Radar
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Logo } from '../components/ui/Logo';
import { GlobalSearch } from '../components/GlobalSearch';
import { cn } from '../lib/utils';
// import { useAuth } from '../hooks/useAuth'; // To be implemented

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sales', label: 'Sale Orders', icon: ShoppingCart },
  { path: '/purchase', label: 'Purchase Orders', icon: Store },
  { path: '/manufacturing', label: 'Manufacturing Orders', icon: Factory },
  { path: '/bom', label: 'Bills of Materials', icon: Boxes },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/vendors', label: 'Vendors', icon: Users },
  { path: '/signals', label: 'Market Signals', icon: Activity },
  { path: '/intel-hub', label: 'IntelHub', icon: Radar },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/production-health', label: 'Production Health', icon: Stethoscope },
  { path: '/users', label: 'User Management', icon: Users, adminOnly: true },
  { path: '/audit', label: 'Audit Logs', icon: ShieldAlert, adminOnly: true },
];

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications, add: addNotification, markRead, markAllRead } = useNotificationStore();
  const productMapRef = useRef<Map<number, Product>>(new Map());
  const [hasIntelHubNotification, setHasIntelHubNotification] = useState(false);

  useEffect(() => {
    listProducts().then((products) => {
      productMapRef.current = new Map(products.map((p) => [p.id, p]));
    }).catch(console.error);
  }, []);

  const refreshIntelHubNotification = () =>
    getIntelHubNotifications().then((state) => setHasIntelHubNotification(state.hasNotification)).catch(console.error);

  useEffect(() => {
    refreshIntelHubNotification();
  }, []);

  // The red dot reacts the moment someone posts a lead or an admin verifies
  // one — same live-update pattern as everything else, not a poll timer.
  useSocketEvent('intel:post_created', refreshIntelHubNotification);
  useSocketEvent('intel:post_verified', refreshIntelHubNotification);

  // Field-reported risk signals — the same data PIN's checkpoint reads,
  // surfaced the moment it's reported instead of only at order-confirm time.
  useSocketEvent<{ signal: MarketSignal }>('signal:created', ({ signal }) => {
    const subject = signal.product?.name ?? signal.category ?? 'a product';
    addNotification({
      type: 'signal',
      message: `${signal.sourceType.replace('_', ' ')} reported a ${signal.signalType.replace('_', ' ')} on ${subject}`,
      href: '/signals',
    });
  });

  // Crosses below its configured reorder threshold, right as it happens —
  // same number the Products page and lowStockAlert cron job both check.
  useSocketEvent<{ productId: number; onHandQty: number }>('stock:updated', ({ productId, onHandQty }) => {
    const product = productMapRef.current.get(productId);
    if (!product || product.lowStockThreshold == null) return;
    if (onHandQty <= Number(product.lowStockThreshold)) {
      addNotification({
        type: 'low_stock',
        message: `${product.name} is low on stock — ${onHandQty} on hand (threshold ${product.lowStockThreshold})`,
        href: `/products/${productId}`,
      });
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const navigate = useNavigate();
  const { user, setUnauthenticated } = useAuthStore();

  const handleLogout = async () => {
    await logoutApi();
    setUnauthenticated();
    navigate('/login');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Listen to OS theme changes if user hasn't explicitly set it
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ProtectedRoute (the parent route element) already verified the session
  // with the backend before this ever mounts — this is just a defensive
  // guard against rendering with a null user, not the auth check itself.
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 blur-nav border-b border-border transition-colors duration-300">
        <div className="flex h-[72px] items-stretch">

          {/* Brand strip — sized to match the sidebar's own width exactly
              (260px / 80px collapsed) so it lines up as one continuous
              column instead of floating independently. Lives in the header,
              not inside <aside>, so it can never be clipped by the sidebar
              row's overflow-hidden the way the old -top-[72px] hack was. */}
          <div
            className={cn(
              "hidden lg:flex items-center border-r border-border shrink-0 transition-all duration-300",
              isCollapsed ? "w-20 justify-center" : "w-65 gap-3 px-6"
            )}
          >
            {!isCollapsed && (
              <>
                <Logo size={32} />
                <span className="flex-1 text-xl font-semibold tracking-tight text-foreground">PINERP</span>
              </>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 items-center px-4 md:px-6 lg:px-8">
            {/* Always visible regardless of sidebar state/breakpoint — the
                sidebar's own logo is hidden on mobile until the drawer opens. */}
            <Logo size={28} className="mr-3 lg:hidden" />

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 p-2 text-muted-foreground hover:bg-secondary rounded-lg lg:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <GlobalSearch />

          {/* Header Actions */}
          <div className="ml-auto flex items-center gap-4">
            
            <div className="flex items-center border border-border rounded-lg bg-card p-1">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <div className="w-px h-4 bg-border mx-1"></div>
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen((o) => !o)}
                  className="relative p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-card"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-card border border-border shadow-floating z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                      <span className="text-sm font-medium text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications yet — field signals and low-stock alerts will show up here live.</p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markRead(n.id);
                              setIsNotificationsOpen(false);
                              navigate(n.href);
                            }}
                            className={cn(
                              'w-full text-left px-4 py-2.5 text-sm border-b border-border/50 last:border-b-0 hover:bg-secondary transition-colors flex gap-2 items-start',
                              n.read ? 'text-foreground/60' : 'text-foreground'
                            )}
                          >
                            <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', n.read ? 'bg-transparent' : n.type === 'low_stock' ? 'bg-orange-500' : 'bg-primary')} />
                            <span>
                              {n.message}
                              <span className="block text-xs text-muted-foreground mt-0.5">
                                {new Date(n.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Dropdown Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 border border-border rounded-full hover:bg-secondary transition-all focus:outline-none"
              >
                <Avatar name={user.name} className="w-7 h-7 text-xs" />
                <span className="text-sm font-medium text-foreground hidden sm:block">{user.name}</span>
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-floating py-1 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.isAdmin ? 'Administrator' : 'User'}</p>
                  </div>
                  <button 
                    onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Floating Sidebar (Desktop) / Slide-out (Mobile) */}
        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 bg-card border-r border-border lg:border-r lg:relative lg:block transform transition-all duration-300 ease-in-out lg:translate-x-0 h-screen lg:h-[calc(100vh-72px)] flex flex-col shadow-floating lg:shadow-none",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            isCollapsed ? "w-[80px]" : "w-[260px]"
          )}
        >
          {/* Logo Section - mobile drawer only; desktop's brand strip lives
              in the header itself (see below), not here — a previous
              -top-[72px] absolute hack tried to poke this up into the
              header's row, but the row container's overflow-hidden clipped
              it, which is why the logo/collapse-toggle silently vanished. */}
          <div className="flex h-[72px] items-center px-6 border-b border-transparent lg:hidden">
             <div className="flex items-center gap-3">
              <Logo size={32} />
              <span className="text-xl font-semibold tracking-tight text-foreground">PINERP</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="ml-auto p-2 text-muted-foreground hover:bg-secondary rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item) => {
              if (item.adminOnly && !user.isAdmin) return null;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                      isCollapsed ? "justify-center px-0 mx-2" : "px-3",
                      isActive 
                        ? "bg-[#F3E8FF] text-[#7C3AED] dark:bg-primary/20" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="relative">
                    <item.icon className={cn("h-[18px] w-[18px] min-w-[18px] transition-colors", "group-hover:text-foreground")} />
                    {item.path === '/intel-hub' && hasIntelHubNotification && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-card" />
                    )}
                  </span>
                  {!isCollapsed && <span className="flex-1">{item.label}</span>}
                  {!isCollapsed && item.path === '/intel-hub' && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground tracking-wide">
                      New
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 mt-auto">
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Log Out" : undefined}
              className={cn(
                "mt-6 mb-2 flex items-center gap-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors w-full rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10",
                isCollapsed ? "justify-center px-0 mx-2" : "px-3"
              )}
            >
              <LogOut className="h-[18px] w-[18px] min-w-[18px]" />
              {!isCollapsed && <span>Log Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full bg-background transition-colors duration-300">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
