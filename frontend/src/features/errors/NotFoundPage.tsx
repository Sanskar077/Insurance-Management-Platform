import { Link } from 'react-router-dom';
import { Button } from '@components/ui/Button';

/** 404 page for authenticated users — unknown paths render this instead of a silent redirect. */
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="font-[var(--font-display)] text-6xl font-semibold text-[var(--color-ink-900)]">
        404
      </p>
      <div>
        <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink-900)]">
          Page not found
        </h1>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-slate-500)]">
          The page you are looking for doesn’t exist or may have been moved.
        </p>
      </div>
      <Link to="/">
        <Button variant="secondary">Go to home</Button>
      </Link>
    </div>
  );
}
