# Ski sticker example dataset

Photos + labels used to build and test the brand-aware sticker parser
(`@nordicfleet/core` `stickerMetrics` / `stickerRegistry`). Priority brands for
the next parsing pass: **Salomon, Fischer, Madshus**.

## Layout

```
data/sticker-examples/
  salomon/raw/        original sticker photos
  salomon/labeled/    matching <name>.json ground-truth labels
  fischer/raw/
  fischer/labeled/
  madshus/raw/
  madshus/labeled/
```

## How many

- **10-20 images per brand minimum.**
- **50 total minimum, 100+ ideal.**

## Photo guidelines

- JPG, PNG, or HEIC accepted; **JPG preferred**.
- **One sticker per image.**
- Good, even lighting; **avoid glare** (no direct flash on glossy stickers).
- **Full sticker in frame**, not cropped.
- Keep the **original resolution** (do not downscale).
- Fill the frame with the sticker where possible; minimal background.

## Labels

For each `raw/<name>.jpg`, add `labeled/<name>.json` with the ground-truth
fields you can read off the sticker. Use `null` for fields the sticker does not
show. This is what the parser output is scored against.

### Label schema (example)

```json
{
  "image": "salomon-rc-01.jpg",
  "brand": "Salomon",
  "model": "S/Lab Carbon",
  "technique": "skate",
  "type": "cold",
  "length": 192,
  "flex": 80,
  "flexCode": null,
  "grind": "C12",
  "serial": "1234567",
  "pairId": "A",
  "year": 2024,
  "rawText": ["SALOMON", "S/LAB CARBON", "SKATE COLD", "192 - 80", "1234567"],
  "notes": "length-dash-flex pair on one line"
}
```

Field notes:
- `length` in cm, `flex` in kg (skier weight) when the sticker prints a number.
- `flexCode` for brands that print a hardness CODE instead (e.g. Madshus
  `F1`-`F4`, Rossignol `C`/`S` codes); leave `flex` null if only a code shows.
- `rawText` is the lines roughly as printed (top to bottom), so we can replay
  OCR-style input through the parser in tests.

## Privacy / git

- `.gitkeep` keeps the folders in git. **Do not commit actual photos** unless
  you explicitly want a small sample set tracked (they are large and may carry
  serials). Keep the bulk dataset local or in storage outside the repo.
