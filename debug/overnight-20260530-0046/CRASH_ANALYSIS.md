# Crash / Freeze Evidence Analysis

_Phase 1 — overnight stabilization. Generated 2026-05-30._

## Bottom line

**There is no crash-report evidence that NordicFleet crashed or was
memory-killed.** Across every `.ips` on this Mac (all dates, the only synced
device "Jack's iPhone (2)"):

- **`NordicFleet-*.ips` native crash reports: 0** — none exist.
- **NordicFleet in any `JetsamEvent-*.ips`: 0 occurrences** — it is not the
  killed process, not the `largestProcess`, and not even listed.
- Newest device log of **any** kind synced to this Mac: **2026-05-25**. The
  current freeze is ~2026-05-30, so **there are NO device logs covering the
  current freeze** — the on-disk logs are 5+ days stale.

Evidence files: `jetsam/nordicfleet-crash-grep.txt` (empty match list),
`jetsam/all-jetsam-dates.txt`, and three parsed Jetsam events in `jetsam/`.

## What the existing Jetsam events actually show

The Jetsam events on disk are **routine system memory management of OTHER
apps**, days before the current freeze. `largestProcess` and top memory
consumers in the three most recent:

| Event (date) | largestProcess | Top consumers (MB) | NordicFleet present? |
|---|---|---|---|
| 2026-05-24 03:11 | Spotify | Spotify 419 · kernel_task 338 · Oura 333 · backboardd 228 · SpringBoard 210 | **No** |
| 2026-05-25 01:21 | kernel_task | kernel_task 339 · backboardd 247 · Oura 233 · SpringBoard 224 · Gmail 132 | **No** |
| 2026-05-25 01:48 | kernel_task | kernel_task 339 · backboardd 248 · Oura 232 · SpringBoard 224 · Gmail 132 | **No** |

`memoryPressure: None` on each — these are ordinary per-process-limit / idle
reclaims, not a system red-pressure panic. **None implicate NordicFleet.**

## Classification

| Candidate | Verdict | Why |
|---|---|---|
| Native crash (signal) | **Ruled out** | No `NordicFleet-*.ips`; a native crash would write one |
| JS exception crash | **Ruled out (as a crash)** | Same — no crash report; a fatal JS error red-boxes in dev or is caught by ErrorBoundary + global handler |
| Jetsam / memory kill of NordicFleet | **Ruled out** | NordicFleet absent from every Jetsam event |
| Watchdog kill (0x8badf00d) | **No evidence** | No NordicFleet `.ips` of any kind |
| **Hang (JS thread blocked / waiting forever)** | **Most consistent** | A foreground app that's unresponsive but NOT killed produces no `.ips`. Matches "fully frozen." |
| **Stale/disconnected Debug bundle (Metro)** | **Equally consistent** | A Debug build that loses its Metro bundle shows a frozen last-frame with no crash log |

## Why this matters for the rest of the session

- Because there is **no native crash**, the JS test suite **is** relevant
  (it isn't being invalidated by a native fault). Static analysis + tests are
  legitimate evidence here.
- The actual freeze left **no diagnostic trail**, so the single most valuable
  next action is to **capture fresh on-device logs** during a reproduction —
  which is exactly what the `[NF_BOOT]` boot trace (Phase 5) and the
  device-log steps in `PHONE_FREEZE_DEBUG_STEPS.md` are for.
- The most probable, cheapest fix remains a **clean reinstall** (stale Debug
  bundle is the #1 cause of an RN "freeze" with no crash log).

## Honest gaps

- I cannot prove the root cause from logs because **the relevant logs do not
  exist on this machine** (device hasn't offloaded post-05-25 logs).
- To get real evidence: connect the iPhone, reproduce the freeze with Metro +
  Xcode attached, and capture the `[NF_BOOT]` trace + `idevicesyslog`. The
  **last `[NF_BOOT]` line printed pins the hang stage.**
