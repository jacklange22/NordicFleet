'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {parseSpreadsheet} from '@nordicfleet/core';
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
// Three steps:
//   1. paste     — large textarea + Parse button
//   2. preview   — summary card + per-row table with inline error
//                  tags
//   3. confirm   — after save (1.5)
//
// 1.4 will add the manual-mapping fallback when auto-detection misses
// a required column.

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

export default function ImportPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const [stage, setStage] = useState('paste'); // 'paste' | 'preview'
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

  return (
    <div>
      <SiteHeader role="athlete" />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/home" className="text-text-secondary text-sm hover:text-white">
            ← Back to fleet
          </Link>
          <span className="text-text-tertiary text-sm">
            {stage === 'paste' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </span>
        </div>

        {stage === 'paste' ? (
          <PasteStep
            raw={raw}
            setRaw={setRaw}
            onParse={handleParse}
            onUseExample={useExample}
          />
        ) : (
          <PreviewStep parsed={parsed} onStartOver={handleStartOver} />
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

function PreviewStep({parsed, onStartOver}) {
  const rows = parsed.rows || [];
  const validRowCount = useMemo(
    () => rows.filter(r => r.errors.length === 0).length,
    [rows],
  );
  const errorRowCount = rows.length - validRowCount;
  const delim = parsed.delimiter?.kind || 'tab';

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
            . They&apos;ll be ignored — use manual mapping (coming next)
            if any of these should map to a Ski field.
          </div>
        )}

        {parsed.needsManualMapping && (
          <div className="text-sm text-text-secondary bg-bg border border-border rounded-2xl p-4 mb-4">
            <span className="font-semibold text-white">Heads up:</span> at
            least one required field (brand, model, or technique)
            wasn&apos;t recognized from your headers. The save action will
            unlock once manual column mapping is wired up (next commit).
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
        <Button
          variant="primary"
          size="md"
          disabled
          title="Save action lands in Feature 1.5">
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
