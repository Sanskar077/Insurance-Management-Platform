import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '@services/auth.service';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { useToast } from '@components/ui/ToastProvider';
import { ApiError } from '@lib/apiClient';
import { USER_ROLES } from '@app-types/user.types';
import type { Role } from '@app-types/customer.types';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  dob: string;
  phone: string;
  address: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'CUSTOMER',
  dob: '',
  phone: '',
  address: '',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCustomer = form.role === 'CUSTOMER';

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = 'Full name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = 'Invalid email address';
    }
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (isCustomer) {
      if (!form.dob) errors.dob = 'Date of birth is required';
      if (!form.phone.trim()) errors.phone = 'Phone is required';
      if (!form.address.trim()) errors.address = 'Address is required';
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage('');

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(isCustomer
          ? {
              fullName: form.name.trim(),
              dob: form.dob,
              phone: form.phone.trim(),
              address: form.address.trim(),
            }
          : {}),
      });
      showSuccess('Account created successfully. Please sign in.');
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const fieldError of error.fieldErrors) {
          errors[fieldError.path] = fieldError.message;
        }
        setFieldErrors(errors);
      }
      const message =
        error instanceof ApiError ? error.message : 'Registration failed — please try again';
      setErrorMessage(message);
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
          Insurance<span className="text-[var(--color-amber-500)]">MP</span>
        </p>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
          <h1 className="mb-1 font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink-900)]">
            Create an account
          </h1>
          <p className="mb-5 text-sm text-[var(--color-slate-500)]">
            Register to access the platform.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Full Name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              error={fieldErrors.name}
              placeholder="Jane Doe"
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              error={fieldErrors.email}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              error={fieldErrors.password}
              placeholder="••••••••"
            />
            <Input
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => updateField('confirmPassword', event.target.value)}
              error={fieldErrors.confirmPassword}
              placeholder="••••••••"
            />

            <Select
              label="Role"
              value={form.role}
              onChange={(event) => updateField('role', event.target.value as Role)}
              error={fieldErrors.role}
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>

            {isCustomer && (
              <>
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  error={fieldErrors.phone}
                  placeholder="+1 555 123 4567"
                />
                <Input
                  label="Address"
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  error={fieldErrors.address}
                  placeholder="123 Main St, Springfield"
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={form.dob}
                  onChange={(event) => updateField('dob', event.target.value)}
                  error={fieldErrors.dob}
                />
              </>
            )}

            {errorMessage && (
              <p role="alert" className="text-sm text-[var(--color-danger-600)]">
                {errorMessage}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--color-slate-500)]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[var(--color-ink-900)] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
