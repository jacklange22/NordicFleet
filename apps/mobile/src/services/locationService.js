// Geolocation wrapper for test-log location tagging.
//
// Uses @react-native-community/geolocation under the hood. The
// service:
//   - tolerates the native module being unavailable (returns null)
//   - never throws - callers can null-check
//   - handles "denied" and "timeout" the same way: return null
//
// The Info.plist key NSLocationWhenInUseUsageDescription is required
// for iOS to surface the permission prompt.

import Geolocation from '@react-native-community/geolocation';

/**
 * Request the current location, single-shot.
 *
 * @param {Object} [opts]
 * @param {number} [opts.timeout=15000]   ms before giving up
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number} | null>}
 */
export function getCurrentLocation(opts = {}) {
  return new Promise(resolve => {
    if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
      // Native module not linked yet - degrade gracefully.
      resolve(null);
      return;
    }
    try {
      Geolocation.getCurrentPosition(
        position => {
          const c = position?.coords;
          if (!c) {
            resolve(null);
            return;
          }
          resolve({
            latitude: c.latitude,
            longitude: c.longitude,
            accuracy: c.accuracy ?? null,
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: opts.timeout ?? 15000,
          maximumAge: 60 * 1000,
        },
      );
    } catch {
      resolve(null);
    }
  });
}
