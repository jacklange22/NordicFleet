'use client';

// Shared ski form. Used by both /ski/new (add) and /ski/[id]/edit.
// Field list + validation rules mirror apps/mobile/src/screens/newSki.js
// so the data model stays consistent.

import {useMemo, useState} from 'react';
import {FormInput} from './forms/FormInput';
import {FormTextarea} from './forms/FormTextarea';
import {FormPillSelector} from './forms/FormPillSelector';
import {Button} from './Button';

const BRAND_OPTIONS = [
  'Salomon',
  'Fischer',
  'Atomic',
  'Madshus',
  'Rossignol',
  'Other',
];
const TECHNIQUE_OPTIONS = [
  {value: 'classic', label: 'Classic'},
  {value: 'skate', label: 'Skate'},
];
const TYPE_OPTIONS = [
  {value: 'cold', label: 'Cold'},
  {value: 'universal', label: 'Universal'},
  {value: 'warm', label: 'Warm'},
  {value: 'zero', label: 'Zero'},
];

export function SkiForm({initial = {}, onSubmit, submitLabel = 'Save'}) {
  const [name, setName] = useState(initial.name || '');
  // Brand splits into a chip pick + a custom text field. If the
  // initial brand matches a known chip, prefill that chip. Else use
  // "Other" + the custom text.
  const initialBrandMatch = useMemo(() => {
    const b = (initial.brand || '').trim();
    if (!b) return {chip: '', custom: '', other: false};
    const matched = BRAND_OPTIONS.find(
      o => o.toLowerCase() === b.toLowerCase() && o !== 'Other',
    );
    if (matched) {
      return {chip: matched, custom: '', other: false};
    }
    return {chip: 'Other', custom: b, other: true};
  }, [initial.brand]);

  const [brandChip, setBrandChip] = useState(initialBrandMatch.chip);
  const [customBrand, setCustomBrand] = useState(initialBrandMatch.custom);
  const [brandIsOther, setBrandIsOther] = useState(initialBrandMatch.other);

  const [model, setModel] = useState(initial.model || '');
  const [technique, setTechnique] = useState(initial.technique || '');
  const [type, setType] = useState(initial.type || '');
  const [build, setBuild] = useState(initial.build || '');
  const [base, setBase] = useState(initial.base || '');
  const [grind, setGrind] = useState(initial.grind || '');
  const [length, setLength] = useState(
    initial.length != null ? String(initial.length) : '',
  );
  const [flex, setFlex] = useState(
    initial.flex != null ? String(initial.flex) : '',
  );
  const [year, setYear] = useState(
    initial.year != null ? String(initial.year) : '',
  );
  const [notes, setNotes] = useState(initial.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveBrand = brandIsOther
    ? customBrand.trim()
    : brandChip === 'Other'
      ? ''
      : brandChip;

  const isValid =
    !!name.trim() && !!technique && !!type;

  const onBrandChip = next => {
    if (next === 'Other') {
      setBrandChip('Other');
      setBrandIsOther(true);
    } else {
      setBrandChip(next);
      setBrandIsOther(false);
      setCustomBrand('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!isValid) {
      setError('Name, technique, and type are required.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        brand: effectiveBrand,
        model: model.trim(),
        technique,
        type,
        build: build.trim(),
        base: base.trim(),
        grind: grind.trim(),
        length,
        flex,
        year,
        notes,
      });
    } catch (err) {
      setError(String((err && err.message) || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
          Identity
        </h2>
        <FormInput
          label="Ski name"
          required
          value={name}
          onChange={setName}
          placeholder="e.g. Cold day Speedmax"
          autoCapitalize="words"
        />
        <FormPillSelector
          label="Brand"
          options={BRAND_OPTIONS}
          value={brandChip}
          onChange={onBrandChip}
        />
        {brandIsOther && (
          <FormInput
            label="Brand name"
            value={customBrand}
            onChange={setCustomBrand}
            placeholder="e.g. Peltonen"
            autoCapitalize="words"
          />
        )}
        <FormInput
          label="Model"
          value={model}
          onChange={setModel}
          placeholder="e.g. Speedmax 3D"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
          Specs
        </h2>
        <FormPillSelector
          label="Technique"
          required
          options={TECHNIQUE_OPTIONS}
          value={technique}
          onChange={setTechnique}
        />
        <FormPillSelector
          label="Type"
          required
          options={TYPE_OPTIONS}
          value={type}
          onChange={setType}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Length"
            value={length}
            onChange={setLength}
            suffix="cm"
            inputMode="numeric"
          />
          <FormInput
            label="Flex"
            value={flex}
            onChange={setFlex}
            suffix="kg"
            inputMode="numeric"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
          Setup
        </h2>
        <FormInput label="Build" value={build} onChange={setBuild} />
        <FormInput label="Base" value={base} onChange={setBase} />
        <FormInput label="Grind" value={grind} onChange={setGrind} />
        <FormInput
          label="Year"
          value={year}
          onChange={setYear}
          inputMode="numeric"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
          Notes
        </h2>
        <FormTextarea
          label="Notes (optional)"
          value={notes}
          onChange={setNotes}
          rows={4}
        />
      </section>

      {error && (
        <div className="text-sm text-red bg-red/[0.05] border border-red/40 rounded-2xl p-4">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!isValid || submitting}
          loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
