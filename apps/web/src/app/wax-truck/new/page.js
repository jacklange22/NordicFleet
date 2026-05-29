'use client';

// New wax test — name, conditions, fleet size, and the combination
// builder. The Kick/Paraffin/Topcoat/Structure category selector filters
// the wax typeahead, but the picker is always free-text: a coach can
// commit a wax (or structure) that exists nowhere in the dictionary.
// On create → buildWaxTestCreatePayload → bracket → open the runner.

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {WAX_CATEGORIES, buildCombinationLabel} from '@nordicfleet/core';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import {FormInput} from '@/components/forms/FormInput';
import {FormPillSelector} from '@/components/forms/FormPillSelector';
import {WaxPicker} from '@/components/forms/WaxPicker';
import {useToast} from '@/components/Toast';
import {createWaxTest} from '@/lib/firestore';

const SNOW_TYPES = ['New', 'Fresh', 'Transformed', 'Old', 'Icy'];
const SURFACES = ['Powder', 'Packed', 'Granular', 'Corduroy', 'Crust'];
const FLEET_SIZES = [2, 4, 8, 16];
const CATEGORY_LABEL = {
  kick: 'Kick',
  paraffin: 'Paraffin',
  topcoat: 'Topcoat',
  structure: 'Structure',
};

let _uid = 0;
const nextId = p => `${p}${Date.now().toString(36)}${(_uid++).toString(36)}`;
const makeLayer = (category = 'paraffin') => ({
  key: nextId('l'),
  category,
  waxId: null,
  waxName: '',
});
const makeCombination = () => ({
  id: nextId('c'),
  label: '',
  layers: [makeLayer('paraffin')],
  performanceNumber: '',
});

export default function NewWaxTestPage() {
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

  const [name, setName] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [snowType, setSnowType] = useState('');
  const [surface, setSurface] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [fleetSize, setFleetSize] = useState(8);
  const [combinations, setCombinations] = useState([
    makeCombination(),
    makeCombination(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (combinations.length < 2 || combinations.length > fleetSize) {
      return false;
    }
    return combinations.every(c => c.layers.some(l => (l.waxName || '').trim()));
  }, [name, fleetSize, combinations]);

  const updateCombination = (id, patch) =>
    setCombinations(prev => prev.map(c => (c.id === id ? {...c, ...patch} : c)));

  const addCombination = () =>
    setCombinations(prev =>
      prev.length >= fleetSize ? prev : [...prev, makeCombination()],
    );

  const removeCombination = id =>
    setCombinations(prev =>
      prev.length <= 2 ? prev : prev.filter(c => c.id !== id),
    );

  const addLayer = comboId =>
    setCombinations(prev =>
      prev.map(c =>
        c.id === comboId ? {...c, layers: [...c.layers, makeLayer()]} : c,
      ),
    );

  const updateLayer = (comboId, layerKey, patch) =>
    setCombinations(prev =>
      prev.map(c =>
        c.id === comboId
          ? {
              ...c,
              layers: c.layers.map(l =>
                l.key === layerKey ? {...l, ...patch} : l,
              ),
            }
          : c,
      ),
    );

  const removeLayer = (comboId, layerKey) =>
    setCombinations(prev =>
      prev.map(c =>
        c.id === comboId
          ? {
              ...c,
              layers:
                c.layers.length <= 1
                  ? c.layers
                  : c.layers.filter(l => l.key !== layerKey),
            }
          : c,
      ),
    );

  const handleCreate = async () => {
    setError('');
    if (!isValid) {
      setError(
        !name.trim()
          ? 'Give the test a name.'
          : combinations.length > fleetSize
            ? 'You have more combinations than the fleet size allows.'
            : 'Every combination needs at least one wax layer.',
      );
      return;
    }
    setSubmitting(true);
    try {
      const payloadCombos = combinations.map(c => ({
        id: c.id,
        label: c.label.trim() || undefined,
        performanceNumber: c.performanceNumber,
        layers: c.layers
          .filter(l => (l.waxName || '').trim())
          .map((l, i) => ({
            category: l.category,
            waxId: l.waxId || null,
            waxName: l.waxName.trim(),
            order: i,
          })),
      }));
      const testId = await createWaxTest(user.uid, {
        name: name.trim(),
        fleetSize,
        conditions: {temperature, humidity, snowType, surface, locationLabel},
        combinations: payloadCombos,
      });
      toast.success({title: 'Test created', body: 'Bracket generated.'});
      router.replace(`/wax-truck/${testId}`);
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
            href="/wax-truck"
            className="text-text-secondary text-sm hover:text-white">
            ← Back to tests
          </Link>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-6">New wax test</h1>

        <Card className="mb-6 space-y-5">
          <FormInput
            label="Test name"
            value={name}
            onChange={setName}
            placeholder="Stratton AM glide test"
            required
          />
          <FormInput
            label="Location (optional)"
            value={locationLabel}
            onChange={setLocationLabel}
            placeholder="Stratton, VT"
          />
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
            options={SURFACES}
            value={surface}
            onChange={setSurface}
          />
        </Card>

        <Card className="mb-6">
          <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-3">
            Fleet size — max combinations
          </span>
          <div className="flex gap-2">
            {FLEET_SIZES.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setFleetSize(n)}
                aria-pressed={fleetSize === n}
                className={
                  'px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors ' +
                  (fleetSize === n
                    ? 'bg-waxtruck text-black border-waxtruck'
                    : 'border-border-strong text-white hover:bg-surface')
                }>
                {n}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
            Combinations ({combinations.length}/{fleetSize})
          </h2>
        </div>

        {combinations.map((combo, idx) => {
          const autoLabel = buildCombinationLabel(combo.layers);
          return (
            <Card key={combo.id} className="mb-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-waxtruck font-bold">#{idx + 1}</span>
                <span className="text-text-secondary text-sm truncate flex-1">
                  {combo.label.trim() || autoLabel}
                </span>
                {combinations.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCombination(combo.id)}
                    className="text-text-tertiary hover:text-red text-sm">
                    Remove
                  </button>
                )}
              </div>

              {combo.layers.map(layer => (
                <div
                  key={layer.key}
                  className="border-b border-border pb-4 last:border-b-0 last:pb-0 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {WAX_CATEGORIES.map(cat => {
                      const active = layer.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            updateLayer(combo.id, layer.key, {category: cat})
                          }
                          className={
                            'px-3 py-1 rounded-full border text-xs font-semibold transition-colors ' +
                            (active
                              ? 'bg-waxtruck text-black border-waxtruck'
                              : 'border-border text-text-secondary hover:text-white')
                          }>
                          {CATEGORY_LABEL[cat]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-end gap-2">
                    <WaxPicker
                      className="flex-1"
                      label={CATEGORY_LABEL[layer.category]}
                      category={layer.category}
                      value={layer.waxName}
                      waxId={layer.waxId}
                      placeholder="Pick or type any wax"
                      onChange={({value, waxId}) =>
                        updateLayer(combo.id, layer.key, {
                          waxName: value,
                          waxId,
                        })
                      }
                    />
                    {combo.layers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLayer(combo.id, layer.key)}
                        className="h-12 px-3 text-text-tertiary hover:text-red text-sm">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addLayer(combo.id)}
                className="text-waxtruck text-sm font-semibold hover:opacity-80">
                + Add layer
              </button>

              <FormInput
                label="Custom label (optional)"
                value={combo.label}
                onChange={v => updateCombination(combo.id, {label: v})}
                placeholder={autoLabel}
              />
              <FormInput
                label="Performance number (optional)"
                value={combo.performanceNumber}
                onChange={v =>
                  updateCombination(combo.id, {performanceNumber: v})
                }
                inputMode="numeric"
                placeholder="e.g. glide-out distance"
              />
            </Card>
          );
        })}

        <Button
          variant="secondary"
          size="md"
          disabled={combinations.length >= fleetSize}
          onClick={addCombination}
          className="mb-6">
          + Add combination
        </Button>

        {error && (
          <div className="mb-4 text-sm text-red bg-red/[0.05] border border-red/40 rounded-2xl p-4">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            disabled={!isValid || submitting}
            loading={submitting}
            onClick={handleCreate}>
            Create &amp; generate bracket
          </Button>
        </div>
      </main>
    </div>
  );
}
