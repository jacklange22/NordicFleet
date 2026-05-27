'use client';

import {useEffect, useState} from 'react';
import {useAuth} from '../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import {Modal} from '@/components/Modal';
import {FormInput} from '@/components/forms/FormInput';
import {useToast} from '@/components/Toast';
import {CoachLinkCard} from '@/components/CoachLinkCard';
import {
  subscribeProfile,
  subscribeSkis,
  updateProfile,
} from '@/lib/firestore';

export default function ProfilePage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [skis, setSkis] = useState([]);
  const [editing, setEditing] = useState(false);

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
            {(profile?.name || profile?.email || 'N')
              .charAt(0)
              .toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold">
            {profile?.name || profile?.displayName || profile?.email || ''}
          </h2>
          <p className="text-text-secondary">
            {profile?.email || user?.email}
          </p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wider text-text-tertiary">
            Personal info
          </h3>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-red text-sm hover:text-red-pressed">
            Edit
          </button>
        </div>
        <Card className="divide-y divide-border p-0 mb-8">
          <Row label="Display name" value={profile?.name || '—'} />
          <Row
            label="Weight"
            value={profile?.weight ? `${profile.weight} kg` : '—'}
          />
          <Row
            label="Height"
            value={profile?.height ? `${profile.height} cm` : '—'}
          />
          <Row label="Team" value={profile?.team || '—'} />
          <Row label="Location" value={profile?.location || '—'} />
          {!isCoach && <Row label="Skis" value={`${skis.length}`} />}
        </Card>

        {!isCoach && profile && (
          <>
            <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
              Coach
            </h3>
            <CoachLinkCard profile={profile} />
          </>
        )}
      </main>

      <EditProfileModal
        open={editing}
        onClose={() => setEditing(false)}
        profile={profile}
        onSaved={() => {
          toast.success({title: 'Profile updated'});
          setEditing(false);
        }}
        onError={msg => toast.error({title: 'Update failed', body: msg})}
      />
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

function EditProfileModal({open, onClose, profile, onSaved, onError}) {
  const {user} = useAuth();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [team, setTeam] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // Re-seed every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setName(profile?.name || '');
    setWeight(profile?.weight != null ? String(profile.weight) : '');
    setHeight(profile?.height != null ? String(profile.height) : '');
    setTeam(profile?.team || '');
    setLocation(profile?.location || '');
  }, [open, profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const w = weight === '' ? null : Number(weight);
      const h = height === '' ? null : Number(height);
      const partial = {
        name: name.trim() || null,
        weight: Number.isFinite(w) ? w : null,
        height: Number.isFinite(h) ? h : null,
        team: team.trim() || null,
        location: location.trim() || null,
      };
      await updateProfile(user.uid, partial);
      onSaved();
    } catch (err) {
      onError(String((err && err.message) || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Edit profile"
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}>
            Save
          </Button>
        </>
      }>
      <div className="space-y-4">
        <FormInput label="Display name" value={name} onChange={setName} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Weight"
            value={weight}
            onChange={setWeight}
            suffix="kg"
            inputMode="numeric"
          />
          <FormInput
            label="Height"
            value={height}
            onChange={setHeight}
            suffix="cm"
            inputMode="numeric"
          />
        </div>
        <FormInput label="Team" value={team} onChange={setTeam} />
        <FormInput
          label="Location"
          value={location}
          onChange={setLocation}
          placeholder="e.g. Park City, UT"
        />
      </div>
    </Modal>
  );
}
