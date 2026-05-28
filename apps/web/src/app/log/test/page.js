'use client';

// Log a test — record conditions once, then per-ski ratings + notes.
// Save fans out one createTestLog per selected ski via Promise.allSettled.

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {SNOW_TYPES, SURFACE_TYPES} from '@nordicfleet/core';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {Button} from '@/components/Button';
import {FormInput} from '@/components/forms/FormInput';
import {FormTextarea} from '@/components/forms/FormTextarea';
import {FormPillSelector} from '@/components/forms/FormPillSelector';
import {FormChipMultiselect} from '@/components/forms/FormChipMultiselect';
import {FormRating} from '@/components/forms/FormRating';
import {useToast} from '@/components/Toast';
import {subscribeSkis, createTestLog} from '@/lib/firestore';

const DEFAULT_ENTRY = () => ({
  glideRating: 5,
  kickRating: null,
  stabilityRating: null,
  climbingRating: null,
  notes: '',
});

export default function LogTestPage() {
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
  const [skis, setSkis] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [snowType, setSnowType] = useState('');
  const [surface, setSurface] = useState('');
  const [locationLabel, setLocationLabel] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);
  const [entries, setEntries] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeSkis(user.uid, list => {
      setSkis(list.filter(s => !s.retired));
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    setEntries(prev => {
      const next = {...prev};
      for (const id of selectedIds) {
        if (!next[id]) {
          next[id] = DEFAULT_ENTRY();
        }
      }
      return next;
    });
  }, [selectedIds]);

  const skiOptions = useMemo(
    () =>
      skis.map(s => ({
        value: s.id,
        label: s.name || 'Unnamed ski',
        sub: s.technique || '',
      })),
    [skis],
  );

  const updateEntry = (skiId, patch) => {
    setEntries(prev => ({
      ...prev,
      [skiId]: {...(prev[skiId] || DEFAULT_ENTRY()), ...patch},
    }));
  };

  const handleSave = async () => {
    setError('');
    if (selectedIds.length === 0) {
      setError('Pick at least one ski to log a test for.');
      return;
    }
    setSubmitting(true);
    try {
      const writes = selectedIds.map(skiId => {
        const ski = skis.find(s => s.id === skiId);
        const entry = entries[skiId] || DEFAULT_ENTRY();
        const isClassic =
          ski && (ski.technique || '').toLowerCase() === 'classic';
        const isSkate =
          ski && (ski.technique || '').toLowerCase() === 'skate';
        // The core TestLog validator drops a `location` object that
        // doesn't carry valid lat/lng — and the web user only types a
        // label (no browser geolocation in this session, deferred).
        // Prepend the typed label to notes instead of fabricating a
        // coordinate. Notes are the right home for a free-form
        // venue tag.
        const noteText = entry.notes;
        const notes =
          locationLabel && noteText
            ? `Location: ${locationLabel}\n${noteText}`
            : locationLabel
              ? `Location: ${locationLabel}`
              : noteText;
        return createTestLog(user.uid, {
          skiId,
          temperature,
          humidity,
          snowType,
          surface,
          glideRating: entry.glideRating,
          kickRating: isClassic ? entry.kickRating : null,
          stabilityRating: isSkate ? entry.stabilityRating : null,
          climbingRating: isSkate ? entry.climbingRating : null,
          notes,
        });
      });
      const settled = await Promise.allSettled(writes);
      const failed = settled.filter(r => r.status === 'rejected');
      const ok = settled.length - failed.length;
      if (failed.length === 0) {
        toast.success({
          title: ok === 1 ? 'Test logged' : `${ok} tests logged`,
        });
        router.replace('/home');
      } else {
        toast.error({
          title: 'Some logs failed',
          body: `${ok} saved, ${failed.length} failed`,
        });
        setSubmitting(false);
      }
    } catch (err) {
      setError(String((err && err.message) || err));
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/home"
            className="text-text-secondary text-sm hover:text-white">
            ← Back to fleet
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Log a test</h1>
        <p className="text-text-secondary mb-6 max-w-prose">
          Capture the conditions once, then rate each ski you tested.
          Ratings: 1 (worst) to 10 (best).
        </p>

        <Card className="mb-6 space-y-5">
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
            Conditions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Temperature"
              value={temperature}
              onChange={setTemperature}
              suffix="°C"
              inputMode="numeric"
            />
            <FormInput
              label="Humidity"
              value={humidity}
              onChange={setHumidity}
              suffix="%"
              inputMode="numeric"
            />
          </div>
          <FormPillSelector
            label="Snow type"
            options={SNOW_TYPES}
            value={snowType}
            onChange={setSnowType}
          />
          <FormPillSelector
            label="Surface"
            options={SURFACE_TYPES}
            value={surface}
            onChange={setSurface}
          />
          <FormInput
            label="Location (optional)"
            value={locationLabel}
            onChange={setLocationLabel}
            placeholder="e.g. Silverstar morning loop"
          />
        </Card>

        <Card className="mb-6">
          <FormChipMultiselect
            label="Skis tested"
            options={skiOptions}
            value={selectedIds}
            onChange={setSelectedIds}
            emptyMessage={
              loaded
                ? 'No active skis — add one before logging a test.'
                : 'Loading…'
            }
            required
          />
        </Card>

        {selectedIds.map(skiId => {
          const ski = skis.find(s => s.id === skiId);
          if (!ski) return null;
          const entry = entries[skiId] || DEFAULT_ENTRY();
          const isClassic =
            (ski.technique || '').toLowerCase() === 'classic';
          const isSkate = (ski.technique || '').toLowerCase() === 'skate';
          return (
            <Card key={skiId} className="mb-4 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold truncate">
                    {ski.name || 'Unnamed ski'}
                  </h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {ski.technique && <Pill>{ski.technique}</Pill>}
                    {ski.type && <Pill>{ski.type}</Pill>}
                  </div>
                </div>
              </div>

              <FormRating
                label="Glide"
                value={entry.glideRating}
                onChange={n => updateEntry(skiId, {glideRating: n})}
              />
              {isClassic && (
                <FormRating
                  label="Kick"
                  value={entry.kickRating}
                  onChange={n => updateEntry(skiId, {kickRating: n})}
                />
              )}
              {isSkate && (
                <>
                  <FormRating
                    label="Stability"
                    value={entry.stabilityRating}
                    onChange={n =>
                      updateEntry(skiId, {stabilityRating: n})
                    }
                  />
                  <FormRating
                    label="Climbing"
                    value={entry.climbingRating}
                    onChange={n =>
                      updateEntry(skiId, {climbingRating: n})
                    }
                  />
                </>
              )}
              <FormTextarea
                label="Notes (optional)"
                value={entry.notes}
                onChange={v => updateEntry(skiId, {notes: v})}
                rows={3}
              />
            </Card>
          );
        })}

        {error && (
          <div className="mb-4 text-sm text-red bg-red/[0.05] border border-red/40 rounded-2xl p-4">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            disabled={selectedIds.length === 0 || submitting}
            loading={submitting}
            onClick={handleSave}>
            {selectedIds.length <= 1
              ? 'Save test log'
              : `Save ${selectedIds.length} test logs`}
          </Button>
        </div>
      </main>
    </div>
  );
}
