import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShell } from '@components/layout/AppShell';
import { LoginPage } from '@features/auth/LoginPage';
import { DashboardPage } from '@features/reports/DashboardPage';
import { CustomerListPage } from '@features/customers/CustomerListPage';
import { CustomerFormPage } from '@features/customers/CustomerFormPage';
import { CustomerDetailPage } from '@features/customers/CustomerDetailPage';
import { CustomerProfilePage } from '@features/customers/CustomerProfilePage';
import { PolicyListPage } from '@features/policies/PolicyListPage';
import { PolicyFormPage } from '@features/policies/PolicyFormPage';
import { PolicyDetailPage } from '@features/policies/PolicyDetailPage';
import { PolicyRenewPage } from '@features/policies/PolicyRenewPage';
import { PaymentListPage } from '@features/payments/PaymentListPage';
import { PaymentFormPage } from '@features/payments/PaymentFormPage';
import { PaymentDetailPage } from '@features/payments/PaymentDetailPage';
import { PaymentHistoryPage } from '@features/payments/PaymentHistoryPage';
import { OverduePaymentsPage } from '@features/payments/OverduePaymentsPage';
import { ClaimListPage } from '@features/claims/ClaimListPage';
import { ClaimFormPage } from '@features/claims/ClaimFormPage';
import { ClaimEditPage } from '@features/claims/ClaimEditPage';
import { ClaimDetailPage } from '@features/claims/ClaimDetailPage';
import { ClaimHistoryPage } from '@features/claims/ClaimHistoryPage';
import { DocumentListPage } from '@features/documents/DocumentListPage';
import { DocumentUploadPage } from '@features/documents/DocumentUploadPage';
import { DocumentDetailPage } from '@features/documents/DocumentDetailPage';
import { UserListPage } from '@features/users/UserListPage';
import { useAuth } from '@hooks/useAuth';

/**
 * Route guard: unauthenticated visitors are sent to /login (remembering
 * where they were headed), and everything inside renders within AppShell.
 */
function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <AppShell>{children}</AppShell>;
}

export function AppRoutes() {
  const { role, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <Protected>
            <Navigate to={role === 'CUSTOMER' ? '/customers/me' : '/dashboard'} replace />
          </Protected>
        }
      />

      {/* Reports aggregate business-wide figures — ADMIN/AGENT only (mirrors backend RBAC). */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            {role === 'CUSTOMER' ? <Navigate to="/customers/me" replace /> : <DashboardPage />}
          </Protected>
        }
      />

      {/* User administration — ADMIN only (mirrors backend permission matrix). */}
      <Route
        path="/users"
        element={
          <Protected>{role === 'ADMIN' ? <UserListPage /> : <Navigate to="/" replace />}</Protected>
        }
      />

      <Route
        path="/customers"
        element={
          <Protected>
            <CustomerListPage />
          </Protected>
        }
      />
      <Route
        path="/customers/new"
        element={
          <Protected>
            <CustomerFormPage />
          </Protected>
        }
      />
      <Route
        path="/customers/me"
        element={
          <Protected>
            {role === 'CUSTOMER' ? <CustomerProfilePage /> : <Navigate to="/customers" replace />}
          </Protected>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <Protected>
            <CustomerDetailPage />
          </Protected>
        }
      />
      <Route
        path="/customers/:id/edit"
        element={
          <Protected>
            <CustomerFormPage />
          </Protected>
        }
      />

      <Route
        path="/policies"
        element={
          <Protected>
            <PolicyListPage />
          </Protected>
        }
      />
      <Route
        path="/policies/new"
        element={
          <Protected>
            <PolicyFormPage />
          </Protected>
        }
      />
      <Route
        path="/policies/:id"
        element={
          <Protected>
            <PolicyDetailPage />
          </Protected>
        }
      />
      <Route
        path="/policies/:id/edit"
        element={
          <Protected>
            <PolicyFormPage />
          </Protected>
        }
      />
      <Route
        path="/policies/:id/renew"
        element={
          <Protected>
            <PolicyRenewPage />
          </Protected>
        }
      />
      <Route
        path="/policies/:id/payments"
        element={
          <Protected>
            <PaymentHistoryPage />
          </Protected>
        }
      />
      <Route
        path="/policies/:id/claims"
        element={
          <Protected>
            <ClaimHistoryPage />
          </Protected>
        }
      />

      <Route
        path="/premium-payments"
        element={
          <Protected>
            <PaymentListPage />
          </Protected>
        }
      />
      <Route
        path="/premium-payments/overdue"
        element={
          <Protected>
            <OverduePaymentsPage />
          </Protected>
        }
      />
      <Route
        path="/premium-payments/new"
        element={
          <Protected>
            <PaymentFormPage />
          </Protected>
        }
      />
      <Route
        path="/premium-payments/:id"
        element={
          <Protected>
            <PaymentDetailPage />
          </Protected>
        }
      />

      <Route
        path="/claims"
        element={
          <Protected>
            <ClaimListPage />
          </Protected>
        }
      />
      <Route
        path="/claims/new"
        element={
          <Protected>
            <ClaimFormPage />
          </Protected>
        }
      />
      <Route
        path="/claims/:id"
        element={
          <Protected>
            <ClaimDetailPage />
          </Protected>
        }
      />
      <Route
        path="/claims/:id/edit"
        element={
          <Protected>
            <ClaimEditPage />
          </Protected>
        }
      />

      <Route
        path="/documents"
        element={
          <Protected>
            <DocumentListPage />
          </Protected>
        }
      />
      <Route
        path="/documents/upload"
        element={
          <Protected>
            <DocumentUploadPage />
          </Protected>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <Protected>
            <DocumentDetailPage />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
