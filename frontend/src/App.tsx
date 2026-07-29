import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@hooks/useAuth';
import { ToastProvider } from '@components/ui/ToastProvider';
import { AppRoutes } from '@routes/AppRoutes';

// AppShell is applied per-route inside AppRoutes so the login page can
// render outside the authenticated chrome.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
