import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: Toast['variant']) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const showSuccess = useCallback((message: string) => push(message, 'success'), [push]);
  const showError = useCallback((message: string) => push(message, 'error'), [push]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`min-w-64 rounded-md border px-4 py-3 text-sm shadow-lg ${
              toast.variant === 'success'
                ? 'border-[var(--color-success-600)]/30 bg-[var(--color-success-100)] text-[var(--color-success-600)]'
                : 'border-[var(--color-danger-600)]/30 bg-[var(--color-danger-100)] text-[var(--color-danger-600)]'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
