import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listUsers, createUser, updateUserRole } from '@services/user.service';
import type { UserAccount } from '@app-types/user.types';
import { USER_ROLES } from '@app-types/user.types';
import type { PaginationMeta, Role } from '@app-types/customer.types';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@components/ui/ToastProvider';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Spinner } from '@components/ui/Spinner';
import { EmptyState } from '@components/ui/EmptyState';
import { ErrorState } from '@components/ui/ErrorState';
import { Pagination } from '@components/ui/Pagination';
import { SearchBar } from '@components/ui/SearchBar';
import { ConfirmDialog } from '@components/ui/ConfirmDialog';
import { ApiError } from '@lib/apiClient';

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-[var(--color-amber-100)] text-[var(--color-amber-500)]',
  AGENT: 'bg-[var(--color-success-100)] text-[var(--color-success-600)]',
  CUSTOMER: 'bg-[var(--color-surface-muted)] text-[var(--color-slate-600)]',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[role] ?? ROLE_BADGE.CUSTOMER}`}
    >
      {role}
    </span>
  );
}

interface PendingRoleChange {
  user: UserAccount;
  nextRole: 'ADMIN' | 'AGENT';
}

export function UserListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const limit = Number(searchParams.get('limit') ?? '10');
  const search = searchParams.get('search') ?? '';
  const roleFilter = (searchParams.get('role') as Role | null) ?? undefined;

  const { userId } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'AGENT'>('AGENT');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [pendingChange, setPendingChange] = useState<PendingRoleChange | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await listUsers({
        page,
        limit,
        search: search || undefined,
        role: roleFilter,
      });
      setUsers(result.data);
      setMeta(result.meta);
      setStatus('idle');
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load users');
      setStatus('error');
    }
  }, [page, limit, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function updateParams(partial: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(partial)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreateError('');
    setIsCreating(true);
    try {
      await createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      showSuccess(`${newRole === 'ADMIN' ? 'Administrator' : 'Agent'} account created`);
      setShowCreateForm(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('AGENT');
      await fetchUsers();
    } catch (error) {
      setCreateError(error instanceof ApiError ? error.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleConfirmRoleChange() {
    if (!pendingChange) return;
    setIsChangingRole(true);
    try {
      await updateUserRole(pendingChange.user.id, pendingChange.nextRole);
      showSuccess(`${pendingChange.user.name} is now ${pendingChange.nextRole}`);
      setPendingChange(null);
      await fetchUsers();
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Failed to change role');
    } finally {
      setIsChangingRole(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            User Management
          </h1>
          <p className="text-sm text-[var(--color-slate-500)]">
            Platform accounts, roles, and access control.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm((open) => !open)}>
          {showCreateForm ? 'Close' : '+ New Staff User'}
        </Button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Input
            label="Name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Full name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="user@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Min 8 characters"
            required
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                label="Role"
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as 'ADMIN' | 'AGENT')}
              >
                <option value="AGENT">AGENT</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create'}
            </Button>
          </div>
          {createError && (
            <p
              role="alert"
              className="text-sm text-[var(--color-danger-600)] sm:col-span-2 lg:col-span-4"
            >
              {createError}
            </p>
          )}
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchBar
          initialValue={search}
          onSearch={(value) => updateParams({ search: value || undefined })}
          placeholder="Search by name or email…"
        />
        <div className="w-40">
          <Select
            label="Role"
            value={roleFilter ?? ''}
            onChange={(event) => updateParams({ role: event.target.value || undefined })}
          >
            <option value="">All roles</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {status === 'loading' && <Spinner label="Loading users…" />}

        {status === 'error' && <ErrorState message={errorMessage} onRetry={fetchUsers} />}

        {status === 'idle' && users.length === 0 && (
          <EmptyState
            title={search || roleFilter ? 'No matching users' : 'No users yet'}
            description={
              search || roleFilter
                ? 'Try different search terms or filters.'
                : 'Accounts appear here as they are created.'
            }
          />
        )}

        {status === 'idle' && users.length > 0 && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-wide text-[var(--color-slate-500)]">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === userId;
                  const isLockedCustomer = user.hasCustomerProfile;
                  return (
                    <tr key={user.id} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar fullName={user.name} size="sm" />
                          <span className="font-medium text-[var(--color-ink-900)]">
                            {user.name}
                            {isSelf && (
                              <span className="ml-2 text-xs text-[var(--color-slate-500)]">
                                (you)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">{user.email}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3 text-[var(--color-slate-600)]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="text-xs text-[var(--color-slate-500)]">
                            Cannot change own role
                          </span>
                        ) : isLockedCustomer ? (
                          <span className="text-xs text-[var(--color-slate-500)]">
                            Customer account
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(event) => {
                              const nextRole = event.target.value as 'ADMIN' | 'AGENT';
                              if (nextRole !== user.role) {
                                setPendingChange({ user, nextRole });
                              }
                            }}
                            aria-label={`Change role for ${user.name}`}
                            className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1.5 text-sm text-[var(--color-ink-900)] outline-none focus:border-[var(--color-ink-700)]"
                          >
                            <option value="AGENT">AGENT</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {meta && (
              <Pagination
                meta={meta}
                onPageChange={handlePageChange}
                itemLabel="users"
                pageSize={limit}
                onPageSizeChange={(size) => updateParams({ limit: String(size) })}
              />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={pendingChange !== null}
        title={`Make ${pendingChange?.user.name ?? ''} ${pendingChange?.nextRole ?? ''}?`}
        description={
          pendingChange?.nextRole === 'ADMIN'
            ? 'Administrators have full access, including user management and deletions.'
            : 'Agents can manage customers, policies, payments, claims, and documents.'
        }
        confirmLabel="Change role"
        isLoading={isChangingRole}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  );
}
