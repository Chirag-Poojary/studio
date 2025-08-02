
'use client';

import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';

function LoginPageContent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <AuthForm />
    </main>
  );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    )
}
