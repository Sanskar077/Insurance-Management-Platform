import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@hooks/useAuth';
import { ToastProvider } from '@components/ui/ToastProvider';
import { ErrorBoundary } from '@components/layout/ErrorBoundary';
import { AppRoutes } from '@routes/AppRoutes';

// AppShell is applied per-route inside AppRoutes so the login page can
// render outside the authenticated chrome.
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
