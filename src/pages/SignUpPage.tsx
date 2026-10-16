import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import type { RedirectState } from '../components/layout/RouteGuards';
import { Button, FormError, Input } from '../components/ui';
import { useSignUp } from '../hooks/useAuth';
import { errorMessage } from '../lib/errors';

export function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const signUp = useSignUp();
  const location = useLocation();
  const state = location.state as RedirectState | null;

  const passwordError = touched && password.length > 0 && password.length < 8 ? 'Use at least 8 characters.' : undefined;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (password.length < 8) return;
    signUp.mutate({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Async standups and a shared board for your team"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/signin" state={state} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError>{signUp.isError ? errorMessage(signUp.error) : null}</FormError>
        <Input label="Name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          hint="At least 8 characters"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched(true)}
          error={passwordError}
        />
        <Button
          type="submit"
          className="w-full"
          loading={signUp.isPending}
          disabled={!name.trim() || !email.trim() || !password}
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
