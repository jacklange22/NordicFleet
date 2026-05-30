// TEMPORARY on-device freeze diagnostics — see PHONE_FREEZE_DEBUG_STEPS.md.
//
// These traces map the boot/render lifecycle so a freeze on a real device
// can be pinned to the last stage that printed. They are __DEV__-only, so
// they never ship in a Release build and add zero overhead in production.
//
// Filter device logs by the tag below (Console.app, `idevicesyslog`, or the
// Metro/Xcode console):
//
//     [freeze-trace]
//
// Remove this file + its call sites once the freeze is understood.

const TAG = '[freeze-trace]';

// Active only in a __DEV__ runtime (Debug builds / Metro), and never under
// Jest — keeps test output clean while still printing on a real device.
const SILENCED =
  typeof process !== 'undefined' &&
  !!process.env &&
  process.env.JEST_WORKER_ID !== undefined;

export function trace(stage, extra) {
  if (!__DEV__ || SILENCED) {
    return;
  }
  if (extra !== undefined) {
    console.log(`${TAG} ${stage}`, extra);
  } else {
    console.log(`${TAG} ${stage}`);
  }
}

export default trace;
