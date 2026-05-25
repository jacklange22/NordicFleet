'use client';

import {useEffect, useState} from 'react';
import {useAuth} from '../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {subscribeProfile, subscribeSkis} from '@/lib/firestore';

export default function ProfilePage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const [profile, setProfile] = useState(null);
  const [skis, setSkis] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubP = subscribeProfile(user.uid, setProfile);
    const unsubS = subscribeSkis(user.uid, list =>
      setSkis(list.filter(s => !s.retired)),
    );
    return () => {
      unsubP();
      unsubS();
    };
  }, [user]);

  const isCoach = profile?.role === 'coach';

  return (
    <div>
      <SiteHeader role={isCoach ? 'coach' : 'athlete'} />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-red text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3">
            {(profile?.name || profile?.email || 'N').charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold">
            {profile?.name || profile?.displayName || profile?.email || ''}
          </h2>
          <p className="text-text-secondary">{profile?.email || user?.email}</p>
        </div>

        <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
          Personal info
        </h3>
        <Card className="divide-y divide-border p-0 mb-8">
          <Row label="Weight" value={profile?.weight ? `${profile.weight} kg` : '—'} />
          <Row label="Height" value={profile?.height ? `${profile.height} cm` : '—'} />
          <Row label="Team" value={profile?.team || '—'} />
          <Row label="Location" value={profile?.location || '—'} />
          {!isCoach && (
            <Row label="Skis" value={`${skis.length}`} />
          )}
        </Card>

        <Card className="border-dashed">
          <p className="text-sm text-text-secondary">
            Edit your profile, change password, manage coach, or delete your
            account in the iOS app for now. Web is a read-only preview while
            the platform matures.
          </p>
        </Card>
      </main>
    </div>
  );
}

function Row({label, value}) {
  return (
    <div className="flex justify-between px-4 py-3">
      <span className="text-text-secondary">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
