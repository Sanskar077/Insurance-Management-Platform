import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const NAV_ITEMS = [{ label: 'Customers', to: '/customers' }];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, role, setToken, logout } = useAuth();
  const [tokenInput, setTokenInput] = useState('');

  function handleSetToken(event: FormEvent) {
    event.preventDefault();
    if (tokenInput.trim()) {
      setToken(tokenInput.trim());
      setTokenInput('');
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-ink-900)] px-4 py-6 text-white md:flex">
        <p className="mb-8 px-2 font-[var(--font-display)] text-lg font-semibold">
          Insurance<span className="text-[var(--color-amber-400)]">MP</span>
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-3">
          <p className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink-900)] md:hidden">
            InsuranceMP
          </p>

          {isAuthenticated ? (
            <div className="ml-auto flex items-center gap-3">
              <span className="rounded-full bg-[var(--color-amber-100)] px-3 py-1 text-xs font-semibold text-[var(--color-amber-500)]">
                {role}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSetToken} className="ml-auto flex items-end gap-2">
              <div className="w-72">
                <Input
                  label="Dev: paste a JWT to authenticate"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Bearer token from POST /api/auth/login"
                />
              </div>
              <Button type="submit" size="sm">
                Set
              </Button>
            </form>
          )}
        </header>

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
