import { useEffect, useState, type ReactNode } from 'react';
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { role } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role !== null && item.roles.includes(role)),
  );

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {visibleItems.map((item) => {
        const active = location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-amber-400)] ${
              active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// AppShell only renders inside Protected routes, so the user is always
// authenticated here — the login flow lives on its own /login page.
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { role, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes or Escape is pressed.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileNavOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-ink-900)] focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-ink-900)] px-4 py-6 text-white md:flex">
        <p className="mb-8 px-2 font-[var(--font-display)] text-lg font-semibold">
          Insurance<span className="text-[var(--color-amber-400)]">MP</span>
        </p>
        <NavLinks />
      </aside>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/40"
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[var(--color-ink-900)] px-4 py-6 text-white shadow-xl">
            <div className="mb-8 flex items-center justify-between px-2">
              <p className="font-[var(--font-display)] text-lg font-semibold">
                Insurance<span className="text-[var(--color-amber-400)]">MP</span>
              </p>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 sm:px-6">
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-2 text-[var(--color-ink-900)] hover:bg-[var(--color-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-amber-500)] md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex flex-1 items-center justify-between gap-3">
            <GlobalSearch />
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-full bg-[var(--color-amber-100)] px-3 py-1 text-xs font-semibold text-[var(--color-amber-500)]">
                {role}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
