import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../components/layout/AppShell';
import { Avatar, Button, Card, CardBody, CardHeader, FormError, Input, useToast } from '../components/ui';
import { useAuth, useUpdateProfile } from '../hooks/useAuth';
import { errorMessage } from '../lib/errors';

export function ProfilePage() {
  const { user } = useAuth();
  const update = useUpdateProfile();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!user) return null;
  const trimmed = name.trim();
  const dirty = trimmed !== user.name;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed || !dirty) return;
    update.mutate({ name: trimmed }, { onSuccess: () => toast.success('Profile updated') });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" description="How you appear to your teammates." />
      <Card>
        <CardHeader title="Your details" />
        <CardBody>
          <div className="mb-6 flex items-center gap-4">
            <Avatar name={trimmed || user.name} id={user.id} size="lg" />
            <div className="min-w-0">
              <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">{trimmed || user.name}</div>
              <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</div>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormError>{update.isError ? errorMessage(update.error) : null}</FormError>
            <Input
              label="Display name"
              value={name}
              maxLength={100}
              onChange={(e) => {
                setName(e.target.value);
                if (update.isError) update.reset();
              }}
              required
            />
            <Input label="Email" value={user.email} disabled hint="Can't be changed" readOnly />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" disabled={!dirty || update.isPending} onClick={() => setName(user.name)}>
                Reset
              </Button>
              <Button type="submit" loading={update.isPending} disabled={!dirty || !trimmed}>
                Save changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
