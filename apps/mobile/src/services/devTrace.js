// TEMPORARY on-device boot/freeze diagnostics - see PHONE_FREEZE_DEBUG_STEPS.md.
//
// Maps the boot/render lifecycle with elapsed-ms timestamps so a freeze on a
// real device can be pinned to the last stage that printed - and you can see
// WHERE the time went. __DEV__-only: never ships in a Release build, and
// silenced under Jest so test output stays clean.
//
// Filter device logs by the tag:  [NF_BOOT]
//   [NF_BOOT] 0000ms index loaded
//   [NF_BOOT] 0120ms auth resolved { signedIn: true }
//   [NF_BOOT] 0300ms navigator ready { route: 'Home' }
//
// Remove this file + its call sites once the freeze is understood.

const TAG = '[NF_BOOT]';
const t0 = Date.now();

// Active only in a __DEV__ runtime (Debug builds / Metro), never under Jest.
const SILENCED =
  typeof process !== 'undefined' &&
  !!process.env &&
  process.env.JEST_WORKER_ID !== undefined;

const stamp = () => `${String(Date.now() - t0).padStart(4, '0')}ms`;

export function trace(stage, extra) {
  if (!__DEV__ || SILENCED) {
    return;
  }
  if (extra !== undefined) {
    console.log(`${TAG} ${stamp()} ${stage}`, extra);
  } else {
    console.log(`${TAG} ${stamp()} ${stage}`);
  }
}

export default trace;
