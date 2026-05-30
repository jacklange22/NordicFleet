'use client';

// Wax test detail - arrange, run, and read the result. Three phases
// keyed off `status`, mirroring the mobile waxTestRunner:
//   setup     → reorder seeds (up/down), then Start.
//   running   → pick a winner per live matchup; record performance #s.
//   complete  → winner + standings.
// All bracket math is pure (@nordicfleet/core); the page renders and
// persists merges via updateWaxTest.

import {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import {
  advanceWinner,
  rearrangeBracket,
  bracketProgress,
} from '@nordicfleet/core';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import {Modal} from '@/components/Modal';
import {FormInput} from '@/components/forms/FormInput';
import {useToast} from '@/components/Toast';
import {getWaxTest, updateWaxTest, deleteWaxTest} from '@/lib/firestore';

export default function WaxTestDetailPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const testId = params?.testId;

  const [test, setTest] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user || !testId) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await getWaxTest(user.uid, testId);
        if (!cancelled) {
          if (!t) setError('This test no longer exists.');
          else setTest(t);
        }
      } catch (err) {
        if (!cancelled) setError(String((err && err.message) || err));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, testId]);

  const comboById = useMemo(() => {
    const m = {};
    (test?.combinations || []).forEach(c => {
      m[c.id] = c;
    });
    return m;
  }, [test]);

  const labelFor = useCallback(
    id => (id ? comboById[id]?.label || 'Unknown' : null),
    [comboById],
  );

  const persist = useCallback(
    async patch => {
      try {
        await updateWaxTest(user.uid, testId, patch);
      } catch (err) {
        toast.error({title: "Couldn't save", body: String((err && err.message) || err)});
      }
    },
    [user, testId, toast],
  );

  const moveCombo = (from, to) => {
    if (!test || to < 0 || to >= test.combinations.length) return;
    const {combinations, bracket} = rearrangeBracket(test.combinations, from, to);
    setTest(prev => ({...prev, combinations, bracket}));
    persist({combinations, bracket});
  };

  const startTest = () => {
    setTest(prev => ({...prev, status: 'running'}));
    persist({status: 'running'});
  };

  const pickWinner = (matchId, winnerId) => {
    const bracket = advanceWinner(test.bracket, matchId, winnerId);
    const status = bracket.winnerId ? 'complete' : 'running';
    setTest(prev => ({...prev, bracket, status}));
    persist({bracket, status});
    if (bracket.winnerId) {
      toast.success({title: 'We have a winner', body: labelFor(bracket.winnerId)});
    }
  };

  const setPerf = (comboId, value) =>
    setTest(prev => ({
      ...prev,
      combinations: prev.combinations.map(c =>
        c.id === comboId ? {...c, performanceNumber: value} : c,
      ),
    }));

  const savePerf = () => {
    const combinations = test.combinations.map(c => ({
      ...c,
      performanceNumber:
        c.performanceNumber === '' || c.performanceNumber == null
          ? null
          : Number(c.performanceNumber),
    }));
    setTest(prev => ({...prev, combinations}));
    persist({combinations});
    toast.success({title: 'Numbers saved'});
  };

  const doDelete = async () => {
    try {
      await deleteWaxTest(user.uid, testId);
      router.replace('/wax-truck');
    } catch (err) {
      toast.error({title: "Couldn't delete", body: String((err && err.message) || err)});
    }
  };

  if (!loaded) {
    return (
      <div>
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-text-secondary">Loading…</p>
        </main>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div>
        <SiteHeader />
        <main className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-red mb-4">{error || 'Test not found.'}</p>
          <Link href="/wax-truck">
            <Button variant="secondary" size="md">
              Back to tests
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const progress = bracketProgress(test.bracket);

  return (
    <div>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/wax-truck"
            className="text-text-secondary text-sm hover:text-white">
            ← Back to tests
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{test.name}</h1>
        <p className="text-text-secondary mt-1 mb-6">
          {test.status === 'setup'
            ? 'Arrange the bracket, then start.'
            : test.status === 'complete'
              ? 'Result'
              : `Round ${progress.currentRound + 1} of ${progress.totalRounds} - ${progress.decided} of ${progress.total} decided`}
        </p>

        {test.status === 'setup' && (
          <Arranger
            combinations={test.combinations}
            onMove={moveCombo}
            onStart={startTest}
          />
        )}

        {test.status === 'running' && (
          <Runner bracket={test.bracket} labelFor={labelFor} onPick={pickWinner} />
        )}

        {test.status === 'complete' && (
          <Results test={test} labelFor={labelFor} comboById={comboById} />
        )}

        {test.status !== 'setup' && (
          <PerfNumbers combinations={test.combinations} onChange={setPerf} onSave={savePerf} />
        )}

        <h2 className="text-xs uppercase tracking-wider text-text-tertiary mt-8 mb-3">
          Bracket
        </h2>
        <BracketOverview bracket={test.bracket} labelFor={labelFor} />

        <div className="mt-8">
          <Button variant="ghost" size="md" onClick={() => setConfirmDelete(true)}>
            Delete test
          </Button>
        </div>
      </main>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this test?">
        <p className="text-text-secondary mb-6">
          This permanently removes the test and its bracket. This cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="md" onClick={doDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Arranger({combinations, onMove, onStart}) {
  return (
    <div>
      <p className="text-text-secondary text-sm mb-4">
        Order sets the seeding - top seeds get any byes. Reorder, then start.
      </p>
      <div className="space-y-2 mb-6">
        {combinations.map((c, i) => (
          <Card key={c.id} className="flex items-center gap-3 py-3">
            <span className="text-waxtruck font-bold w-6">{i + 1}</span>
            <span className="flex-1 truncate">{c.label}</span>
            <button
              type="button"
              aria-label={`Move ${c.label} up`}
              disabled={i === 0}
              onClick={() => onMove(i, i - 1)}
              className="px-2 py-1 text-white disabled:opacity-30 hover:bg-surface rounded">
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${c.label} down`}
              disabled={i === combinations.length - 1}
              onClick={() => onMove(i, i + 1)}
              className="px-2 py-1 text-white disabled:opacity-30 hover:bg-surface rounded">
              ↓
            </button>
          </Card>
        ))}
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onStart}>
        Start test
      </Button>
    </div>
  );
}

function Runner({bracket, labelFor, onPick}) {
  const live = [];
  bracket.rounds.forEach(round =>
    round.forEach(m => {
      if (!m.winnerId && m.combinationIdA && m.combinationIdB) live.push(m);
    }),
  );
  if (live.length === 0) {
    return (
      <Card>
        <p className="text-text-secondary">
          Waiting on earlier rounds - no live matchups right now.
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">Tap the faster wax in each matchup.</p>
      {live.map(m => (
        <Card key={m.matchId} className="space-y-2">
          <Competitor label={labelFor(m.combinationIdA)} onClick={() => onPick(m.matchId, m.combinationIdA)} />
          <div className="text-center text-xs uppercase tracking-wide text-text-tertiary">
            vs
          </div>
          <Competitor label={labelFor(m.combinationIdB)} onClick={() => onPick(m.matchId, m.combinationIdB)} />
        </Card>
      ))}
    </div>
  );
}

function Competitor({label, onClick}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 bg-bg border border-border rounded-2xl px-5 py-4 text-left hover:border-waxtruck hover:bg-waxtruck-dim transition-colors">
      <span className="font-semibold">{label}</span>
      <span className="text-waxtruck text-sm">Wins →</span>
    </button>
  );
}

function PerfNumbers({combinations, onChange, onSave}) {
  return (
    <div className="mt-8">
      <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2">
        Performance numbers
      </h2>
      <p className="text-text-secondary text-sm mb-4">
        Optional objective readings (glide-out distance, timing gate) per
        combination.
      </p>
      <div className="space-y-2 mb-4">
        {combinations.map(c => (
          <div key={c.id} className="flex items-center gap-3">
            <span className="flex-1 truncate text-sm">{c.label}</span>
            <div className="w-32">
              <FormInput
                value={c.performanceNumber == null ? '' : String(c.performanceNumber)}
                onChange={v => onChange(c.id, v)}
                inputMode="numeric"
                placeholder="-"
              />
            </div>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="md" onClick={onSave}>
        Save numbers
      </Button>
    </div>
  );
}

function Results({test, labelFor, comboById}) {
  const winnerId = test.bracket.winnerId;
  const ranked = [...test.combinations].sort((a, b) => {
    if (a.id === winnerId) return -1;
    if (b.id === winnerId) return 1;
    const an = a.performanceNumber == null ? -Infinity : a.performanceNumber;
    const bn = b.performanceNumber == null ? -Infinity : b.performanceNumber;
    return bn - an;
  });
  return (
    <div>
      <Card className="text-center py-10 mb-6">
        <div className="text-waxtruck text-xs uppercase tracking-widest mb-2">
          Fastest wax
        </div>
        <div className="text-3xl font-bold">{labelFor(winnerId)}</div>
        {comboById[winnerId]?.performanceNumber != null && (
          <div className="text-waxtruck mt-2">
            Performance: {comboById[winnerId].performanceNumber}
          </div>
        )}
      </Card>
      <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2">
        Standings
      </h2>
      <div className="divide-y divide-border">
        {ranked.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 py-3">
            <span className="text-text-tertiary font-semibold w-6">{i + 1}</span>
            <span className="flex-1 truncate">{c.label}</span>
            {c.performanceNumber != null && (
              <span className="text-text-secondary text-sm">{c.performanceNumber}</span>
            )}
            {c.id === winnerId && <span className="text-waxtruck text-sm">🏆</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketOverview({bracket, labelFor}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4">
        {bracket.rounds.map((round, ri) => (
          <div key={ri} className="flex flex-col justify-around gap-3 min-w-[150px]">
            <div className="text-[11px] uppercase tracking-wide text-text-tertiary">
              {ri === bracket.rounds.length - 1 ? 'Final' : `R${ri + 1}`}
            </div>
            {round.map(m => (
              <div key={m.matchId} className="bg-surface border border-border rounded-lg p-2 text-xs">
                <Slot label={labelFor(m.combinationIdA)} won={m.winnerId === m.combinationIdA} />
                <div className="h-px bg-border my-1" />
                <Slot label={labelFor(m.combinationIdB)} won={m.winnerId === m.combinationIdB} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Slot({label, won}) {
  return (
    <div className={`truncate ${won ? 'text-waxtruck font-bold' : 'text-text-secondary'}`}>
      {label || '-'}
    </div>
  );
}
