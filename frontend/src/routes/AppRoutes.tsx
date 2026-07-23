import { Navigate, Route, Routes } from 'react-router-dom';
import { CustomerListPage } from '@features/customers/CustomerListPage';
import { CustomerFormPage } from '@features/customers/CustomerFormPage';
import { CustomerDetailPage } from '@features/customers/CustomerDetailPage';
import { CustomerProfilePage } from '@features/customers/CustomerProfilePage';
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
      <Route path="*" element={<Navigate to="/customers" replace />} />
    </Routes>
  );
}
