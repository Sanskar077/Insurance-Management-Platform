import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@hooks/useAuth';
import { ToastProvider } from '@components/ui/ToastProvider';
import { AppShell } from '@components/layout/AppShell';
import { AppRoutes } from '@routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
