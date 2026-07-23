import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Spinner } from '@components/ui/Spinner';
import { ErrorState } from '@components/ui/ErrorState';
import { useToast } from '@components/ui/ToastProvider';
import { useAuth } from '@hooks/useAuth';
import { createCustomer, getCustomerById, updateCustomer } from '@services/customer.service';
import { ApiError } from '@lib/apiClient';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
}

const EMPTY_FORM: FormState = { fullName: '', email: '', phone: '', address: '', dob: '' };

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { role } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'error'>(
    isEditMode ? 'loading' : 'idle',
  );
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customers may only edit phone/address on their own profile.
  const isRestrictedEditor = isEditMode && role === 'CUSTOMER';

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadStatus('loading');
    getCustomerById(id)
      .then((customer) => {
        setForm({
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          dob: customer.dob.slice(0, 10),
        });
        setLoadStatus('idle');
      })
      .catch((error) => {
        setLoadError(error instanceof ApiError ? error.message : 'Failed to load customer');
        setLoadStatus('error');
      });
  }, [id, isEditMode]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (isEditMode && id) {
        const payload = isRestrictedEditor ? { phone: form.phone, address: form.address } : form;
        await updateCustomer(id, payload);
        showSuccess('Customer updated successfully');
        navigate(`/customers/${id}`);
      } else {
        const result = await createCustomer(form);
        showSuccess(
          `Customer created. Temporary password: ${result.temporaryPassword} (share securely — this is shown only once)`,
        );
        navigate(`/customers/${result.customer.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const errors: Record<string, string> = {};
        for (const fieldError of error.fieldErrors) {
          errors[fieldError.path] = fieldError.message;
        }
        setFieldErrors(errors);
      }
      showError(error instanceof ApiError ? error.message : 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadStatus === 'loading') return <Spinner label="Loading customer…" />;
  if (loadStatus === 'error') return <ErrorState message={loadError} />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
        {isEditMode ? 'Edit Customer' : 'New Customer'}
      </h1>
      <p className="mb-6 text-sm text-[var(--color-slate-500)]">
        {isRestrictedEditor
          ? 'You may update your phone number and address.'
          : isEditMode
            ? 'Update this customer\u2019s profile details.'
            : 'Register a new customer profile and login account.'}
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-white p-6"
      >
        <Input
          label="Full name"
          value={form.fullName}
          onChange={(event) => updateField('fullName', event.target.value)}
          error={fieldErrors.fullName}
          disabled={isRestrictedEditor}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          error={fieldErrors.email}
          disabled={isRestrictedEditor}
          required
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
          error={fieldErrors.phone}
          required
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(event) => updateField('address', event.target.value)}
          error={fieldErrors.address}
          required
        />
        <Input
          label="Date of birth"
          type="date"
          value={form.dob}
          onChange={(event) => updateField('dob', event.target.value)}
          error={fieldErrors.dob}
          disabled={isRestrictedEditor}
          required
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditMode ? 'Save changes' : 'Create customer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
