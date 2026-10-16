import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import type { RedirectState } from '../components/layout/RouteGuards';
import { Button, FormError, Input } from '../components/ui';
import { useSignIn } from '../hooks/useAuth';
import { errorMessage } from '../lib/errors';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signIn = useSignIn();
  const location = useLocation();
  const state = location.state as RedirectState | null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // On success the ['me'] cache is set and PublicOnlyRoute redirects to the intended page.
    signIn.mutate({ email: email.trim(), password });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your team's standup board"
      footer={
        <>
          New here?{' '}
          <Link
            to="/signup"
            state={state}
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError>{signIn.isError ? errorMessage(signIn.error) : null}</FormError>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={signIn.isPending} disabled={!email.trim() || !password}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
