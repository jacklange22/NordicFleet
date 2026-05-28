'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import {useAuth} from '../../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {SkiForm} from '@/components/SkiForm';
import {useToast} from '@/components/Toast';
import {getSki, updateSki} from '@/lib/firestore';

export default function EditSkiPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const router = useRouter();
  const {id: skiId} = useParams();
  const toast = useToast();
  const [ski, setSki] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user || !skiId) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    getSki(user.uid, skiId)
      .then(doc => {
        if (cancelled) return;
        if (!doc) {
          setLoadError("We couldn't find that ski.");
        } else {
          setSki(doc);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setLoadError(String((err && err.message) || err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, skiId]);

  const handleSubmit = async data => {
    await updateSki(user.uid, skiId, data);
    toast.success({title: 'Ski updated', body: data.name});
    router.replace(`/ski/${skiId}`);
  };

  return (
    <div>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href={`/ski/${skiId}`}
            className="text-text-secondary text-sm hover:text-white">
            ← Back to ski
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Edit ski</h1>
        {loading && <p className="text-text-tertiary">Loading…</p>}
        {!loading && loadError && (
          <p className="text-red">{loadError}</p>
        )}
        {!loading && !loadError && ski && (
          <Card>
            <SkiForm
              initial={ski}
              onSubmit={handleSubmit}
              submitLabel="Save changes"
            />
          </Card>
        )}
      </main>
    </div>
  );
}
