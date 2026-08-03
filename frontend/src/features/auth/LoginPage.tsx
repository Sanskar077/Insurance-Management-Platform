import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '@services/auth.service';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ApiError } from '@lib/apiClient';

export function LoginPage() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where the user was headed before being bounced to /login.
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const result = await login(email.trim(), password);
      setToken(result.token);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Login failed — please try again',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-4">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
          Insurance<span className="text-[var(--color-amber-500)]">MP</span>
        </p>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
          <h1 className="mb-1 font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink-900)]">
            Sign in
          </h1>
          <p className="mb-5 text-sm text-[var(--color-slate-500)]">
            Use your platform account credentials.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />

            {errorMessage && (
              <p role="alert" className="text-sm text-[var(--color-danger-600)]">
                {errorMessage}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--color-slate-500)]">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-[var(--color-ink-900)] hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
