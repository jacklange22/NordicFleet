'use client';

// Log a wax — pick one or more skis from the active fleet, fill out
// the per-ski wax stack (binder / kick / glide layers), save all of
// them in one batch.

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {BINDER_TYPES} from '@nordicfleet/core';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {Button} from '@/components/Button';
import {FormChipMultiselect} from '@/components/forms/FormChipMultiselect';
import {FormPillSelector} from '@/components/forms/FormPillSelector';
import {FormStepper} from '@/components/forms/FormStepper';
import {FormTextarea} from '@/components/forms/FormTextarea';
import {WaxPicker} from '@/components/forms/WaxPicker';
import {useToast} from '@/components/Toast';
import {subscribeSkis, createWaxLog} from '@/lib/firestore';

const DEFAULT_ENTRY = () => ({
  binder: '',
  binderId: null,
  kickLayers: 1,
  kickWaxes: [''],
  kickWaxIds: [null],
  glideLayers: 1,
  glideWaxes: [''],
  glideWaxIds: [null],
  notes: '',
});

function resize(arr, n, fill) {
  const next = arr.slice(0, n);
  while (next.length < n) {
    next.push(fill);
  }
  return next;
}

export default function LogWaxPage() {
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
  const [selectedIds, setSelectedIds] = useState([]);
  // Map skiId → entry. Survives selection changes (so deselecting +
  // reselecting keeps the user's typed values).
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

  // Make sure every selected ski has a default entry.
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
      setError('Pick at least one ski to log a wax for.');
      return;
    }
    setSubmitting(true);
    try {
      const writes = selectedIds.map(skiId => {
        const ski = skis.find(s => s.id === skiId);
        const entry = entries[skiId] || DEFAULT_ENTRY();
        const isClassic =
          ski && (ski.technique || '').toLowerCase() === 'classic';
        const kickLayers = isClassic ? entry.kickLayers : 0;
        const kickWax = isClassic
          ? entry.kickWaxes.filter(w => w && w.trim()).join(' · ') || null
          : null;
        const kickWaxId = isClassic
          ? entry.kickWaxIds.find(Boolean) || null
          : null;
        return createWaxLog(user.uid, {
          skiId,
          binder:
            entry.binder && entry.binder !== 'None' ? entry.binder : null,
          binderId: entry.binderId || null,
          kickLayers,
          kickWax,
          kickWaxId,
          glideLayers: entry.glideLayers,
          glideWaxes: entry.glideWaxes,
          glideWaxIds: entry.glideWaxIds,
          notes: entry.notes,
        });
      });
      const settled = await Promise.allSettled(writes);
      const failed = settled.filter(r => r.status === 'rejected');
      const ok = settled.length - failed.length;
      if (failed.length === 0) {
        toast.success({
          title:
            ok === 1 ? 'Wax logged' : `${ok} waxes logged`,
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
      <SiteHeader role="athlete" />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/home"
            className="text-text-secondary text-sm hover:text-white">
            ← Back to fleet
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Log a wax</h1>
        <p className="text-text-secondary mb-6 max-w-prose">
          Pick the skis you waxed today, then fill in the layers per ski.
          Classic skis get a kick section; skate skis skip it.
        </p>

        <Card className="mb-6">
          <FormChipMultiselect
            label="Skis"
            options={skiOptions}
            value={selectedIds}
            onChange={setSelectedIds}
            emptyMessage={
              loaded
                ? 'No active skis — add one before logging a wax.'
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
          return (
            <Card key={skiId} className="mb-4">
              <div className="flex items-center justify-between mb-4 gap-3">
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

              {isClassic && (
                <>
                  <FormPillSelector
                    className="mb-5"
                    label="Binder"
                    options={BINDER_TYPES}
                    value={entry.binder}
                    onChange={v => updateEntry(skiId, {binder: v})}
                  />
                  <div className="mb-3">
                    <FormStepper
                      label="Kick layers"
                      value={entry.kickLayers}
                      onChange={n => {
                        updateEntry(skiId, {
                          kickLayers: n,
                          kickWaxes: resize(entry.kickWaxes, n, ''),
                          kickWaxIds: resize(entry.kickWaxIds, n, null),
                        });
                      }}
                      min={0}
                      max={5}
                    />
                  </div>
                  {entry.kickLayers > 0 &&
                    entry.kickWaxes.map((wax, i) => (
                      <div key={`kick-${i}`} className="mb-3">
                        <WaxPicker
                          label={`Kick layer ${i + 1}`}
                          value={wax}
                          waxId={entry.kickWaxIds[i]}
                          type="kick"
                          onChange={({value, waxId}) => {
                            const nextW = entry.kickWaxes.slice();
                            const nextI = entry.kickWaxIds.slice();
                            nextW[i] = value;
                            nextI[i] = waxId;
                            updateEntry(skiId, {
                              kickWaxes: nextW,
                              kickWaxIds: nextI,
                            });
                          }}
                        />
                      </div>
                    ))}
                </>
              )}

              <div className="mb-3">
                <FormStepper
                  label="Glide layers"
                  value={entry.glideLayers}
                  onChange={n => {
                    updateEntry(skiId, {
                      glideLayers: n,
                      glideWaxes: resize(entry.glideWaxes, n, ''),
                      glideWaxIds: resize(entry.glideWaxIds, n, null),
                    });
                  }}
                  min={1}
                  max={10}
                />
              </div>
              {entry.glideWaxes.map((wax, i) => (
                <div key={`glide-${i}`} className="mb-3">
                  <WaxPicker
                    label={`Glide layer ${i + 1}`}
                    value={wax}
                    waxId={entry.glideWaxIds[i]}
                    type="glide"
                    onChange={({value, waxId}) => {
                      const nextW = entry.glideWaxes.slice();
                      const nextI = entry.glideWaxIds.slice();
                      nextW[i] = value;
                      nextI[i] = waxId;
                      updateEntry(skiId, {
                        glideWaxes: nextW,
                        glideWaxIds: nextI,
                      });
                    }}
                  />
                </div>
              ))}

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
              ? 'Save wax log'
              : `Save ${selectedIds.length} wax logs`}
          </Button>
        </div>
      </main>
    </div>
  );
}
