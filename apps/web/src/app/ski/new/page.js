'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {SkiForm} from '@/components/SkiForm';
import {useToast} from '@/components/Toast';
import {createSki} from '@/lib/firestore';

export default function NewSkiPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async data => {
    if (!user) {
      throw new Error('Sign in to add a ski.');
    }
    const id = await createSki(user.uid, data);
    toast.success({title: 'Ski added', body: data.name});
    router.replace(`/ski/${id}`);
  };

  return (
    <div>
      <SiteHeader role="athlete" />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/home"
            className="text-text-secondary text-sm hover:text-white">
            ← Back to fleet
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Add a ski</h1>
        <p className="text-text-secondary mb-6 max-w-prose">
          Fill out what you know. Brand, model, build details — all optional
          except for the basics.
        </p>
        <Card>
          <SkiForm onSubmit={handleSubmit} submitLabel="Save ski" />
        </Card>
      </main>
    </div>
  );
}
