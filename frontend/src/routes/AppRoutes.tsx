import { Navigate, Route, Routes } from 'react-router-dom';
import { CustomerListPage } from '@features/customers/CustomerListPage';
import { CustomerFormPage } from '@features/customers/CustomerFormPage';
import { CustomerDetailPage } from '@features/customers/CustomerDetailPage';
import { CustomerProfilePage } from '@features/customers/CustomerProfilePage';
import { PolicyListPage } from '@features/policies/PolicyListPage';
import { PolicyFormPage } from '@features/policies/PolicyFormPage';
import { PolicyDetailPage } from '@features/policies/PolicyDetailPage';
import { PolicyRenewPage } from '@features/policies/PolicyRenewPage';
import { useAuth } from '@hooks/useAuth';

export function AppRoutes() {
  const { role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/customers" replace />} />
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

      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
