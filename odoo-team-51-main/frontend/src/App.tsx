import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { PortalShell } from './layouts/PortalShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PortalProtectedRoute } from './components/auth/PortalProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { PortalGuestRoute } from './components/auth/PortalGuestRoute';

import { Login } from './features/auth/Login';
import { AdminLogin } from './features/auth/AdminLogin';
import { Signup } from './features/auth/Signup';
import { ForgotPassword } from './features/auth/ForgotPassword';
import { ResetPassword } from './features/auth/ResetPassword';
import { Dashboard } from './features/dashboard/Dashboard';
import { SalesOrderList } from './features/sales/SalesOrderList';
import { SalesOrderForm } from './features/sales/SalesOrderForm';
import { PurchaseOrderList } from './features/purchase/PurchaseOrderList';
import { PurchaseOrderForm } from './features/purchase/PurchaseOrderForm';
import { ManufacturingOrderList } from './features/manufacturing/ManufacturingOrderList';
import { ManufacturingOrderForm } from './features/manufacturing/ManufacturingOrderForm';
import { BomList } from './features/bom/BomList';
import { BomForm } from './features/bom/BomForm';
import { ProductList } from './features/products/ProductList';
import { ProductForm } from './features/products/ProductForm';
import { UserList } from './features/userManagement/UserList';
import { UserForm } from './features/userManagement/UserForm';
import { AuditLogs } from './features/audit/AuditLogs';
import { VendorList } from './features/vendors/VendorList';
import { VendorForm } from './features/vendors/VendorForm';
import { SignalList } from './features/signals/SignalList';
import { SignalForm } from './features/signals/SignalForm';
import { Insights } from './features/insights/Insights';
import { ProductionHealth } from './features/productionHealth/ProductionHealth';
import { IntelHubFeed } from './features/intelHub/IntelHubFeed';
import { IntelHubForm } from './features/intelHub/IntelHubForm';
import { PortalDashboard } from './features/portal/PortalDashboard';
import { CustomerOrderList } from './features/portal/CustomerOrderList';
import { CustomerOrderDetail } from './features/portal/CustomerOrderDetail';
import { PortalLogin } from './features/portal/PortalLogin';
import { PortalSignup } from './features/portal/PortalSignup';
import { PortalReviews } from './features/portal/PortalReviews';
import { PortalMessages } from './features/portal/PortalMessages';
import { MyProfile } from './features/profile/MyProfile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Core Application — every route under here requires a valid
            session, verified against the backend by ProtectedRoute before
            anything renders; typing the URL directly is no different from
            navigating to it. */}
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="sales" element={<SalesOrderList />} />
          <Route path="sales/:id" element={<SalesOrderForm />} />
          <Route path="purchase" element={<PurchaseOrderList />} />
          <Route path="purchase/:id" element={<PurchaseOrderForm />} />
          <Route path="manufacturing" element={<ManufacturingOrderList />} />
          <Route path="manufacturing/:id" element={<ManufacturingOrderForm />} />
          <Route path="bom" element={<BomList />} />
          <Route path="bom/:id" element={<BomForm />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/:id" element={<ProductForm />} />

          {/* Intelligence Layer / Bolt-ons */}
          <Route path="vendors" element={<VendorList />} />
          <Route path="vendors/:id" element={<VendorForm />} />
          <Route path="signals" element={<SignalList />} />
          <Route path="signals/new" element={<SignalForm />} />
          <Route path="insights" element={<Insights />} />
          <Route path="production-health" element={<ProductionHealth />} />
          <Route path="intel-hub" element={<IntelHubFeed />} />
          <Route path="intel-hub/new" element={<IntelHubForm />} />

          {/* Admin / General — same session check plus an isAdmin gate;
              a non-admin who deep-links here sees a 403 page, not the data. */}
          <Route path="users" element={<ProtectedRoute requireAdmin><UserList /></ProtectedRoute>} />
          <Route path="users/:id" element={<ProtectedRoute requireAdmin><UserForm /></ProtectedRoute>} />
          <Route path="audit" element={<ProtectedRoute requireAdmin><AuditLogs /></ProtectedRoute>} />
          <Route path="profile" element={<MyProfile />} />
        </Route>

        {/* Auth (Internal) — guarded so an already-logged-in session bounces
            straight back to "/" instead of rendering the login form over a
            still-valid cookie (that look-alike-logout is the bug we're fixing). */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Customer Portal */}
        <Route element={<PortalGuestRoute />}>
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal/signup" element={<PortalSignup />} />
        </Route>
        <Route path="/portal" element={<PortalProtectedRoute><PortalShell /></PortalProtectedRoute>}>
          <Route index element={<PortalDashboard />} />
          <Route path="orders" element={<CustomerOrderList />} />
          <Route path="orders/:id" element={<CustomerOrderDetail />} />
          <Route path="reviews" element={<PortalReviews />} />
          <Route path="messages" element={<PortalMessages />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
