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
import {useMode} from '@/components/ModeProvider';
import {
  deriveIsCoach,
  dataExportToJSON,
  dataExportFilename,
  formatWeight,
  formatHeight,
  weightFromMetric,
  weightToMetric,
  heightFromMetric,
  heightToMetric,
  normalizeWeightUnit,
  normalizeHeightUnit,
  buildFeedbackMailto,
} from '@nordicfleet/core';
import {
  subscribeProfile,
  subscribeSkis,
  updateProfile,
  setCoachCapability,
  exportUserData,
  deleteAccount,
} from '@/lib/firestore';
import {MARKETING_URL, FEEDBACK_EMAIL} from '@/lib/urls';

export default function ProfilePage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user, signOut} = useAuth();
  const toast = useToast();
  const {setMode} = useMode();
  const [profile, setProfile] = useState(null);
  const [skis, setSkis] = useState([]);
  const [editing, setEditing] = useState(false);
  const [coachingBusy, setCoachingBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const data = await exportUserData(user.uid);
      const blob = new Blob([dataExportToJSON(data)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dataExportFilename(data);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success({title: 'Export ready', body: 'Your data was downloaded.'});
    } catch (err) {
      toast.error({
        title: 'Export failed',
        body: String((err && err.message) || err),
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteAccount();
      // Auth user is gone; the guard will bounce to /login.
      toast.success({title: 'Account deleted'});
    } catch (err) {
      const code = err && err.code;
      if (code === 'auth/requires-recent-login') {
        toast.error({
          title: 'Please sign in again',
          body: 'For security, re-sign-in then retry deleting your account.',
        });
        setDeleteOpen(false);
        await signOut();
      } else {
        toast.error({
          title: 'Delete failed',
          body: String((err && err.message) || err),
        });
      }
    } finally {
      setDeleting(false);
    }
  };

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

  const isCoach = deriveIsCoach(profile);

  // Display units for body metrics (value stays metric). Default kg/cm.
  const weightUnit = normalizeWeightUnit(profile?.weightUnit);
  const heightUnit = normalizeHeightUnit(profile?.heightUnit);

  const changeUnit = async (field, value) => {
    if (!user) return;
    try {
      await updateProfile(user.uid, {[field]: value});
    } catch (err) {
      toast.error({
        title: 'Update failed',
        body: String((err && err.message) || err),
      });
    }
  };

  const toggleCoaching = async next => {
    if (!user) return;
    if (!next) {
      const ok = window.confirm(
        'Stop coaching? Your athletes will be unlinked from you and you’ll lose access to their fleets. Your own fleet stays.',
      );
      if (!ok) return;
    }
    setCoachingBusy(true);
    try {
      const {clearedAthletes} = await setCoachCapability(user.uid, next);
      if (!next) {
        setMode('personal');
      }
      toast.success({
        title: next ? 'Coaching enabled' : 'Coaching turned off',
        body: next
          ? 'Use the My Fleet / Coaching switcher in the header.'
          : clearedAthletes > 0
            ? `Unlinked ${clearedAthletes} athlete${clearedAthletes === 1 ? '' : 's'}.`
            : '',
      });
    } catch (err) {
      toast.error({
        title: 'Update failed',
        body: String((err && err.message) || err),
      });
    } finally {
      setCoachingBusy(false);
    }
  };

  return (
    <div>
      <SiteHeader />
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
          <Row label="Display name" value={profile?.name || '-'} />
          <Row
            label="Weight"
            value={formatWeight(profile?.weight, weightUnit) || '-'}
          />
          <Row
            label="Height"
            value={formatHeight(profile?.height, heightUnit) || '-'}
          />
          <Row label="Team" value={profile?.team || '-'} />
          <Row label="Location" value={profile?.location || '-'} />
          <Row label="Skis" value={`${skis.length}`} />
        </Card>

        <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
          Units
        </h3>
        <Card className="divide-y divide-border p-0 mb-8">
          <UnitRow
            label="Weight"
            options={['kg', 'lb']}
            value={weightUnit}
            onChange={u => changeUnit('weightUnit', u)}
          />
          <UnitRow
            label="Height"
            options={['cm', 'in']}
            value={heightUnit}
            onChange={u => changeUnit('heightUnit', u)}
          />
        </Card>

        <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
          Coaching
        </h3>
        <Card className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Coach a team</p>
              <p className="text-text-secondary text-sm mt-1 max-w-prose">
                {isCoach
                  ? 'Use the My Fleet / Coaching switcher in the header to manage your athletes.'
                  : 'Turn on to manage other skiers’ fleets. Adds a coaching mode you can switch into.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isCoach}
              disabled={coachingBusy}
              onClick={() => toggleCoaching(!isCoach)}
              className={
                'relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ' +
                (isCoach ? 'bg-coaching' : 'bg-border') +
                (coachingBusy ? ' opacity-50' : '')
              }>
              <span
                className={
                  'absolute top-1 w-5 h-5 rounded-full bg-white transition-all ' +
                  (isCoach ? 'left-6' : 'left-1')
                }
              />
            </button>
          </div>
        </Card>

        {profile && (
          <>
            <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
              My coach
            </h3>
            <CoachLinkCard profile={profile} />
          </>
        )}

        <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3 mt-8">
          Privacy &amp; data
        </h3>
        <Card className="space-y-4 mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-semibold">Export my data</p>
              <p className="text-text-secondary text-sm mt-1 max-w-prose">
                Download everything in your account - profile, skis, wax
                logs, test logs, and wax tests - as a JSON file.
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              loading={exporting}>
              Download
            </Button>
          </div>
          <div className="border-t border-border pt-4 flex flex-wrap gap-4 text-sm">
            <a
              href={`${MARKETING_URL}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-white">
              Privacy Policy ↗
            </a>
            <a
              href={`${MARKETING_URL}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-white">
              Terms of Service ↗
            </a>
            <a
              href={
                buildFeedbackMailto(FEEDBACK_EMAIL, {
                  kind: 'bug',
                  platform: 'web',
                }) || MARKETING_URL
              }
              className="text-text-secondary hover:text-white">
              Report a problem ↗
            </a>
          </div>
          <div className="border-t border-border pt-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-red font-semibold">Delete account</p>
              <p className="text-text-secondary text-sm mt-1 max-w-prose">
                Permanently delete your account and all your data. This
                cannot be undone.
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteOpen(true)}>
              Delete…
            </Button>
          </div>
        </Card>
      </main>

      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Delete your account?"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              loading={deleting}>
              Delete everything
            </Button>
          </>
        }>
        <p className="text-text-secondary">
          This permanently deletes your profile, fleet, and all logs and
          tests. If you coach athletes, they&apos;ll be unlinked from you.
          This <span className="text-white font-semibold">cannot be undone</span>
          . Consider exporting your data first.
        </p>
      </Modal>

      <EditProfileModal
        open={editing}
        onClose={() => setEditing(false)}
        profile={profile}
        weightUnit={weightUnit}
        heightUnit={heightUnit}
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

function UnitRow({label, options, value, onChange}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-text-secondary">{label}</span>
      <div className="flex gap-2">
        {options.map(u => (
          <button
            key={u}
            type="button"
            aria-pressed={value === u}
            onClick={() => onChange(u)}
            className={
              'px-3 py-1 rounded-full border text-sm transition-colors ' +
              (value === u
                ? 'bg-red border-red text-white'
                : 'border-border text-text-secondary hover:text-white')
            }>
            {u}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditProfileModal({
  open,
  onClose,
  profile,
  weightUnit,
  heightUnit,
  onSaved,
  onError,
}) {
  const {user} = useAuth();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [team, setTeam] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // Re-seed every time the modal opens. weight/height are shown in the
  // user's display unit (converted from the stored metric value).
  useEffect(() => {
    if (!open) return;
    setName(profile?.name || '');
    const w = weightFromMetric(profile?.weight, weightUnit);
    const h = heightFromMetric(profile?.height, heightUnit);
    setWeight(w === null ? '' : String(w));
    setHeight(h === null ? '' : String(h));
    setTeam(profile?.team || '');
    setLocation(profile?.location || '');
  }, [open, profile, weightUnit, heightUnit]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Convert the entered display values back to metric (kg/cm).
      const partial = {
        name: name.trim() || null,
        weight: weight === '' ? null : weightToMetric(weight, weightUnit),
        height: height === '' ? null : heightToMetric(height, heightUnit),
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
            suffix={weightUnit}
            inputMode="numeric"
          />
          <FormInput
            label="Height"
            value={height}
            onChange={setHeight}
            suffix={heightUnit}
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
