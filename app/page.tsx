import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-zinc-400 uppercase">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
