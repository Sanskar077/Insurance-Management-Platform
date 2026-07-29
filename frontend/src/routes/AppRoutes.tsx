import { Navigate, Route, Routes } from 'react-router-dom';
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
import { useAuth } from '@hooks/useAuth';

export function AppRoutes() {
  const { role } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={role === 'CUSTOMER' ? '/customers' : '/dashboard'} replace />}
      />
      {/* Reports aggregate business-wide figures — ADMIN/AGENT only (mirrors backend RBAC). */}
      <Route
        path="/dashboard"
        element={role === 'CUSTOMER' ? <Navigate to="/customers" replace /> : <DashboardPage />}
      />
      <Route path="/customers" element={<CustomerListPage />} />
      <Route path="/customers/new" element={<CustomerFormPage />} />
      <Route
        path="/customers/me"
        element={
          role === 'CUSTOMER' ? <CustomerProfilePage /> : <Navigate to="/customers" replace />
        }
      />
      <Route path="/customers/:id" element={<CustomerDetailPage />} />
      <Route path="/customers/:id/edit" element={<CustomerFormPage />} />

      <Route path="/policies" element={<PolicyListPage />} />
      <Route path="/policies/new" element={<PolicyFormPage />} />
      <Route path="/policies/:id" element={<PolicyDetailPage />} />
      <Route path="/policies/:id/edit" element={<PolicyFormPage />} />
      <Route path="/policies/:id/renew" element={<PolicyRenewPage />} />
      <Route path="/policies/:id/payments" element={<PaymentHistoryPage />} />
      <Route path="/policies/:id/claims" element={<ClaimHistoryPage />} />

      <Route path="/premium-payments" element={<PaymentListPage />} />
      <Route path="/premium-payments/overdue" element={<OverduePaymentsPage />} />
      <Route path="/premium-payments/new" element={<PaymentFormPage />} />
      <Route path="/premium-payments/:id" element={<PaymentDetailPage />} />

      <Route path="/claims" element={<ClaimListPage />} />
      <Route path="/claims/new" element={<ClaimFormPage />} />
      <Route path="/claims/:id" element={<ClaimDetailPage />} />
      <Route path="/claims/:id/edit" element={<ClaimEditPage />} />

      <Route path="/documents" element={<DocumentListPage />} />
      <Route path="/documents/upload" element={<DocumentUploadPage />} />
      <Route path="/documents/:id" element={<DocumentDetailPage />} />

      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
