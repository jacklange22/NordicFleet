'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {
  parseSpreadsheet,
  applyMapping,
  missingRequiredFields,
  duplicateMappings,
} from '@nordicfleet/core';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {Button} from '@/components/Button';

// Apple-quality matters here per the brief — pasted data is real
// real-world tabular text, often messy, and the user is doing this
// because typing 30 skis manually is unbearable. The UI surface needs
// to be calm, informative, and forgiving.
//
// Stages:
//   1. paste     — large textarea + Parse button
//   2. preview   — summary card + per-row table with inline error
//                  tags
//   2b. mapping  — manual column→field assignment when auto-detection
//                  couldn't recognize a required field, or when the
//                  paste had no header row.
//   3. confirm   — after save (1.5)

const EXAMPLE = `Brand\tModel\tTechnique\tType\tLength\tFlex
Fischer\tSpeedmax\tClassic\tCold\t200\t90
Salomon\tS/Lab Carbon\tSkate\tCold\t192\t75
Madshus\tRedline\tClassic\tWarm\t202\t80`;

const FIELD_ORDER = [
  'name',
  'brand',
  'model',
  'technique',
  'type',
  'length',
  'flex',
  'build',
  'base',
  'grind',
  'year',
  'notes',
];

// Order + labels surfaced in the manual-mapping dropdown. Required
// fields are marked inline so users see why a save is blocked without
// having to read the footer status line.
const MAPPING_OPTIONS = [
  {value: '', label: '— Skip column —'},
  {value: 'name', label: 'Name'},
  {value: 'brand', label: 'Brand (required)'},
  {value: 'model', label: 'Model (required)'},
  {value: 'technique', label: 'Technique (required)'},
  {value: 'type', label: 'Snow type'},
  {value: 'length', label: 'Length'},
  {value: 'flex', label: 'Flex'},
  {value: 'build', label: 'Build'},
  {value: 'base', label: 'Base'},
  {value: 'grind', label: 'Grind / structure'},
  {value: 'year', label: 'Year'},
  {value: 'notes', label: 'Notes'},
];

export default function ImportPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const [stage, setStage] = useState('paste'); // 'paste' | 'preview' | 'mapping'
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState(null);

  const handleParse = () => {
    const result = parseSpreadsheet(raw);
    setParsed(result);
    setStage('preview');
  };

  const handleStartOver = () => {
    setStage('paste');
    setParsed(null);
  };

  const useExample = () => {
    setRaw(EXAMPLE);
  };

  const handleEnterMapping = () => {
    setStage('mapping');
  };

  const handleApplyMapping = newMapping => {
    const rawRows = parsed.rows.map(r => r.raw);
    const rows = applyMapping(rawRows, newMapping);
    const unmapped = [];
    if (parsed.headers && parsed.headers.length > 0) {
      for (let i = 0; i < parsed.headers.length; i += 1) {
        if (!newMapping[i]) {
          unmapped.push(parsed.headers[i]);
        }
      }
    }
    setParsed({
      ...parsed,
      mapping: newMapping,
      rows,
      needsManualMapping: false,
      unmappedHeaders: unmapped,
    });
    setStage('preview');
  };

  const handleCancelMapping = () => {
    setStage('preview');
  };

  const stepLabel =
    stage === 'paste'
      ? 'Step 1 of 2'
      : stage === 'mapping'
        ? 'Step 2 of 2 · mapping'
        : 'Step 2 of 2';

  return (
    <div>
      <SiteHeader role="athlete" />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/home" className="text-text-secondary text-sm hover:text-white">
            ← Back to fleet
          </Link>
          <span className="text-text-tertiary text-sm">{stepLabel}</span>
        </div>

        {stage === 'paste' && (
          <PasteStep
            raw={raw}
            setRaw={setRaw}
            onParse={handleParse}
            onUseExample={useExample}
          />
        )}
        {stage === 'preview' && (
          <PreviewStep
            parsed={parsed}
            onStartOver={handleStartOver}
            onEnterMapping={handleEnterMapping}
          />
        )}
        {stage === 'mapping' && (
          <MappingStep
            parsed={parsed}
            onApply={handleApplyMapping}
            onCancel={handleCancelMapping}
          />
        )}
      </main>
    </div>
  );
}

function PasteStep({raw, setRaw, onParse, onUseExample}) {
  const canParse = raw.trim().length > 0;

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight mb-3">Import skis</h1>
      <p className="text-text-secondary text-lg mb-8 max-w-2xl">
        Paste your ski data below. CSV, tab-separated, copy-direct from
        Excel / Google Sheets, or a markdown table — we&apos;ll detect the
        structure automatically.
      </p>

      <Card className="mb-6">
        <label className="block text-xs uppercase tracking-wider text-text-tertiary mb-3">
          Paste here
        </label>
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder="Brand    Model    Technique    Length"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
          rows={14}
          className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-white placeholder:text-text-tertiary font-mono text-sm focus:border-red outline-none resize-y leading-relaxed"
        />
        <p className="text-text-tertiary text-xs mt-3">
          Tip: select the cells in your spreadsheet, copy (⌘C),
          paste here. The first row should be headers like Brand, Model,
          Technique, etc.{' '}
          <button
            type="button"
            onClick={onUseExample}
            className="text-red hover:text-red-pressed underline">
            Or try a sample
          </button>
          .
        </p>
      </Card>

      <div className="flex gap-3 justify-end">
        <Link href="/home">
          <Button variant="ghost" size="md">
            Cancel
          </Button>
        </Link>
        <Button
          variant="primary"
          size="md"
          disabled={!canParse}
          onClick={onParse}>
          Parse →
        </Button>
      </div>
    </>
  );
}

function PreviewStep({parsed, onStartOver, onEnterMapping}) {
  const rows = parsed.rows || [];
  const validRowCount = useMemo(
    () => rows.filter(r => r.errors.length === 0).length,
    [rows],
  );
  const errorRowCount = rows.length - validRowCount;
  const delim = parsed.delimiter?.kind || 'tab';
  const saveTitle = parsed.needsManualMapping
    ? 'Map your columns first'
    : 'Save action lands in Feature 1.5';

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight mb-3">Preview</h1>
      <p className="text-text-secondary text-lg mb-6 max-w-2xl">
        Found{' '}
        <span className="text-white font-semibold">{rows.length}</span>{' '}
        {rows.length === 1 ? 'ski' : 'skis'}
        {errorRowCount > 0 ? (
          <>
            {' '}— <span className="text-red font-semibold">{errorRowCount}</span>{' '}
            need{errorRowCount === 1 ? 's' : ''} attention.
          </>
        ) : (
          ' — every row looks good.'
        )}
      </p>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Pill variant="outline">Delimiter: {delim}</Pill>
          {parsed.headers.length > 0 && (
            <Pill variant="outline">
              {parsed.headers.length} header{parsed.headers.length === 1 ? '' : 's'}
            </Pill>
          )}
          {parsed.unmappedHeaders?.length > 0 && (
            <Pill variant="ghost">
              {parsed.unmappedHeaders.length} unrecognized column
              {parsed.unmappedHeaders.length === 1 ? '' : 's'}
            </Pill>
          )}
          {parsed.needsManualMapping && (
            <Pill variant="solid">Needs manual mapping</Pill>
          )}
        </div>

        {parsed.unmappedHeaders?.length > 0 && (
          <div className="text-sm text-text-tertiary mb-4">
            Unrecognized columns:{' '}
            <span className="text-text-secondary">
              {parsed.unmappedHeaders.join(', ')}
            </span>
            . They&apos;ll be ignored — open the mapping editor if any of
            these should map to a Ski field.
          </div>
        )}

        {parsed.needsManualMapping && (
          <div className="text-sm bg-bg border border-border rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="text-text-secondary">
              <span className="font-semibold text-white">
                Map columns to continue.
              </span>{' '}
              We couldn&apos;t auto-detect every required field (brand,
              model, technique) — pick the columns by hand.
            </div>
            <Button variant="primary" size="sm" onClick={onEnterMapping}>
              Map columns →
            </Button>
          </div>
        )}

        {!parsed.needsManualMapping && parsed.mapping?.some(m => m) && (
          <div className="text-sm text-text-tertiary flex items-center justify-between gap-3">
            <span>
              Auto-detected the column mapping.{' '}
              {parsed.unmappedHeaders?.length > 0
                ? 'Unrecognized columns will be skipped.'
                : ''}
            </span>
            <button
              type="button"
              onClick={onEnterMapping}
              className="text-text-secondary hover:text-white underline whitespace-nowrap">
              Edit mapping
            </button>
          </div>
        )}
      </Card>

      {rows.length === 0 ? (
        <Card>
          <p className="text-text-tertiary italic">
            No data rows detected. Go back and check the paste — the first
            row should be column headers, and at least one data row should
            follow.
          </p>
        </Card>
      ) : (
        <div className="space-y-3 mb-6">
          {rows.map((row, idx) => (
            <RowCard key={idx} row={row} index={idx + 1} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="ghost" size="md" onClick={onStartOver}>
          ← Edit paste
        </Button>
        <Button variant="primary" size="md" disabled title={saveTitle}>
          Save {validRowCount} {validRowCount === 1 ? 'ski' : 'skis'}
        </Button>
      </div>
    </>
  );
}

function RowCard({row, index}) {
  const hasErrors = row.errors.length > 0;
  const {data} = row;
  return (
    <Card
      className={
        hasErrors
          ? 'border-red/40 bg-red/[0.03]'
          : ''
      }>
      <div className="flex items-start gap-4">
        <span
          className={
            'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ' +
            (hasErrors
              ? 'bg-red/20 text-red'
              : 'bg-success/15 text-success')
          }>
          {hasErrors ? '!' : '✓'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold truncate">
              {data.name || `Row ${index}`}
            </h3>
            <span className="text-text-tertiary text-xs">#{index}</span>
          </div>
          <FieldGrid data={data} />
          {hasErrors && (
            <ul className="mt-3 space-y-1">
              {row.errors.map((e, i) => (
                <li key={i} className="text-sm text-red flex items-start gap-2">
                  <span className="mt-0.5">●</span>
                  <span>{e.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function MappingStep({parsed, onApply, onCancel}) {
  const rawRows = useMemo(() => parsed.rows.map(r => r.raw), [parsed]);
  const headers = parsed.headers || [];

  // Column count is the widest row (or the header row if it's wider).
  // Lets us render a dropdown for every column the user actually
  // pasted, even if some data rows came up short.
  const colCount = useMemo(() => {
    let max = headers.length;
    for (const r of rawRows) {
      if (r.length > max) max = r.length;
    }
    return max;
  }, [headers, rawRows]);

  const [draft, setDraft] = useState(() => {
    const base = (parsed.mapping || []).slice();
    while (base.length < colCount) {
      base.push(null);
    }
    return base;
  });

  const missing = missingRequiredFields(draft);
  const dupes = duplicateMappings(draft);
  const canApply = missing.length === 0 && dupes.length === 0;

  const update = (idx, value) => {
    setDraft(prev => {
      const next = prev.slice();
      next[idx] = value || null;
      return next;
    });
  };

  const sampleFor = idx =>
    rawRows
      .slice(0, 3)
      .map(r => r[idx])
      .map(v => (typeof v === 'string' ? v.trim() : ''))
      .filter(v => v.length > 0);

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight mb-3">Map columns</h1>
      <p className="text-text-secondary text-lg mb-6 max-w-2xl">
        For each column from your paste, choose which ski field it
        represents. Brand, model, and technique are required — the rest
        are optional.
      </p>

      <Card className="mb-6">
        <div className="space-y-0">
          {Array.from({length: colCount}).map((_, idx) => {
            const samples = sampleFor(idx);
            const headerLabel = headers[idx];
            const selected = draft[idx] || '';
            const isDup = selected && dupes.includes(selected);
            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-[120px_1fr_220px] gap-3 md:gap-5 md:items-start py-4 border-t border-border first:border-0 first:pt-0">
                <div>
                  <span className="text-text-tertiary uppercase text-[10px] tracking-wider block">
                    Column {idx + 1}
                  </span>
                  {headerLabel && (
                    <span className="text-white font-medium text-sm block mt-1 truncate">
                      {headerLabel}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-text-tertiary text-[10px] uppercase tracking-wider block mb-1">
                    Examples
                  </span>
                  {samples.length > 0 ? (
                    <span className="text-text-secondary text-sm block truncate font-mono">
                      {samples.join(' · ')}
                    </span>
                  ) : (
                    <span className="text-text-tertiary text-sm italic">
                      (empty)
                    </span>
                  )}
                </div>
                <div>
                  <label className="sr-only" htmlFor={`map-col-${idx}`}>
                    Map column {idx + 1}
                  </label>
                  <select
                    id={`map-col-${idx}`}
                    value={selected}
                    onChange={e => update(idx, e.target.value)}
                    className={
                      'w-full bg-bg border rounded-2xl px-3 py-2 text-white text-sm focus:border-red outline-none appearance-none ' +
                      (isDup ? 'border-red/60' : 'border-border')
                    }>
                    {MAPPING_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 pt-4 border-t border-border text-sm">
          {missing.length > 0 ? (
            <p className="text-red">
              Still missing required field{missing.length === 1 ? '' : 's'}:{' '}
              <span className="font-semibold">{missing.join(', ')}</span>
            </p>
          ) : dupes.length > 0 ? (
            <p className="text-red">
              {dupes.join(', ')}{' '}
              {dupes.length === 1 ? 'is mapped' : 'are mapped'} to more than
              one column. Pick one.
            </p>
          ) : (
            <p className="text-success">All required fields mapped ✓</p>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={!canApply}
          onClick={() => onApply(draft)}>
          Apply mapping
        </Button>
      </div>
    </>
  );
}

function FieldGrid({data}) {
  const cells = FIELD_ORDER.filter(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
  if (cells.length === 0) {
    return (
      <p className="text-text-tertiary text-sm italic">
        No fields were parsed for this row.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
      {cells.map(field => (
        <div key={field} className="min-w-0">
          <span className="text-text-tertiary uppercase text-[10px] tracking-wider block">
            {field}
          </span>
          <span className="text-white truncate block">{String(data[field])}</span>
        </div>
      ))}
    </div>
  );
}
