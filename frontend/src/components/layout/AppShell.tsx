import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/Button';
import { GlobalSearch } from '@components/layout/GlobalSearch';

/** Sidebar navigation, filtered by role (mirrors the backend permission matrix). */
const NAV_ITEMS: { label: string; to: string; roles?: ('ADMIN' | 'AGENT' | 'CUSTOMER')[] }[] = [
  { label: 'Dashboard', to: '/dashboard', roles: ['ADMIN', 'AGENT'] },
  { label: 'Customers', to: '/customers' },
  { label: 'Policies', to: '/policies' },
  { label: 'Premium Payments', to: '/premium-payments' },
  { label: 'Claims', to: '/claims' },
  { label: 'Documents', to: '/documents' },
  { label: 'Users', to: '/users', roles: ['ADMIN'] },
];

// AppShell only renders inside Protected routes, so the user is always
// authenticated here — the login flow lives on its own /login page.
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { role, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role !== null && item.roles.includes(role)),
  );

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-ink-900)] px-4 py-6 text-white md:flex">
        <p className="mb-8 px-2 font-[var(--font-display)] text-lg font-semibold">
          Insurance<span className="text-[var(--color-amber-400)]">MP</span>
        </p>
        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => {
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

          <div className="ml-4 flex flex-1 items-center justify-between gap-3">
            <GlobalSearch />
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--color-amber-100)] px-3 py-1 text-xs font-semibold text-[var(--color-amber-500)]">
                {role}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
