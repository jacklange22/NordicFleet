# Ski Sticker Parsing Plan

_2026-05-30. Foundation status + the path to brand-aware parsing. Copy was
renamed from "base sticker" to "ski sticker" across the apps in this pass._

## Where it stands today

- **OCR:** `apps/mobile/src/screens/scanSki.js` uses Apple Vision (on-device,
  iPhone only) to read the lines off a ski topsheet sticker. Photos stay on
  device.
- **Parser:** `packages/core/src/parsers/stickerParser.js` `parseStickerText`
  is a pure function that takes the OCR lines and returns a SkiInput-shaped
  object **with per-field confidence** (`high` / `medium` / `low`) and a
  reason per field. It matches brand+model against the ski-model database,
  falls back to a known-brand list, and pulls cm-labeled length and kg-labeled
  flex. `toSkiInput` maps the result into the Add-Ski form, where **the user
  can edit every field before saving**.

So the foundation already has: generic parsing, confidence per field, and a
human-in-the-loop confirm step. What is missing is **brand-specific** parsing
and **capturing the extra values** that appear on real stickers (serial, pair
id, FA/HR, grind codes).

## Target architecture (brand-aware)

```
OCR lines
   |
   v
brandDetect(lines) -> 'fischer' | 'salomon' | 'madshus' | ... | null
   |
   v
parserRegistry[brand]  (or genericParser if null)
   |
   v
{ fields: { brand, model, length, flex, grind, serial, pairId, ... with confidence },
  stickerMetrics: { <brand-specific key>: value },   // flexible map
  stickerRawText: "<joined OCR lines>",
  stickerBrand: 'fischer' }
```

- **Parser registry by brand.** `registerStickerParser(brand, fn)` with a
  generic fallback. Each brand parser knows that brand's label layout and
  field aliases (for example Fischer "SN" vs Salomon "Serial", or a brand that
  prints flex as "HARD/MED/SOFT" instead of a kg number).
- **Field aliases per brand.** A small alias table maps brand label text to
  canonical fields, so "FA", "HR", "Stiffness", "Camber" land in the right
  place or in `stickerMetrics`.
- **Confidence per field** (already present) drives the review UI: sure fields
  prefilled, unsure fields flagged for the user to confirm.
- **Anything unrecognized** goes into `stickerMetrics` as a key/value pair so
  no information is lost, and `stickerRawText` preserves the original read.

## Extensible ski metadata (additive, no schema migration)

Add these optional fields to the ski document (Firestore is schemaless, so
this is additive and back-compatible):

- `stickerBrand` (string)
- `stickerRawText` (string)
- `stickerMetrics` (map of string -> string|number): serial, pairId, FA, HR,
  grind code, hand-flex, anything brand-specific.

`createSki` / `updateSki` already accept a flexible payload through the core
builder; these fields would be normalized there and shown read-only on the ski
detail "sticker" section.

**Photos:** do NOT add sticker photo upload yet. That needs Firebase Storage
plus Storage security rules (owner-only read/write) which are not in place.
Keep the OCR result + raw text on device / in Firestore only, and treat photo
storage as a separate, rules-tested feature.

## What is needed next (and why it is blocked)

To build accurate brand parsers without overfitting, we need **real sample
sticker photos** per brand. Please collect, for each brand you care about:

- 3 to 5 clear photos of the topsheet/serial sticker (front + any secondary
  sticker), across a few model years.
- The correct values a human would enter for each (brand, model, length, flex,
  grind, serial, etc.).

Priority brands (typical nordic quivers): **Fischer, Madshus, Salomon, Atomic,
Rossignol**. With ~5 labeled samples per brand we can write and unit-test a
brand parser against fixtures (same approach the spreadsheet parser uses with
its real-data fixture).

## Implementation steps (once samples exist)

1. Add `parserRegistry` + `brandDetect` + generic fallback to
   `stickerParser.js` (keep `parseStickerText` as the generic path).
2. Add one brand parser at a time, each with a fixture test built from a real
   sample (`__tests__/stickerParser.<brand>.test.js`).
3. Add `stickerMetrics` / `stickerRawText` / `stickerBrand` to the ski payload
   builder + a read-only "Sticker details" section on ski detail.
4. (Separate feature) Firebase Storage + rules for optional sticker photos.

## Done in this pass

- Renamed "base sticker" to "ski sticker" in marketing copy. Mobile already
  used "ski sticker".
- This plan. No speculative brand-parser code was added (no samples yet, to
  avoid overfitting).
