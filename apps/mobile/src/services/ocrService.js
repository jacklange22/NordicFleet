// On-device OCR via the local NFOCR native module (Apple Vision).
//
// The native side (apps/mobile/ios/NFOCR/NFOCR.m) wraps
// VNRecognizeTextRequest. JS callers see one method:
//
//   recognizeText(imageUri) → Promise<{lines: Array<TextLine>}>
//
// where TextLine = { text, confidence, bbox? }. The native module is
// iOS-only — calling it on Android currently returns an empty result
// rather than throwing, so the screen layer can render a "not
// supported here" empty state without a try/catch.

import {NativeModules, Platform} from 'react-native';

// NativeModules is read lazily inside each function so tests can swap
// the mock between calls without re-importing the service.
function nativeModule() {
  return NativeModules && NativeModules.NFOCR;
}

/**
 * @typedef {Object} TextLine
 * @property {string} text                          recognized string
 * @property {number} confidence                    0..1, from Vision
 * @property {{x: number, y: number, w: number, h: number}} [bbox]
 *           normalized bounding box (0..1, origin = bottom-left)
 *
 * @typedef {Object} OCRResult
 * @property {Array<TextLine>} lines               in reading order
 */

/**
 * Recognize text in an image. The URI accepts either a `file://` URL
 * (what react-native-image-picker hands back) or a bare path. Failures
 * (file missing, unsupported image, Vision pipeline error) reject with
 * an Error whose `.code` is one of:
 *   NFOCR_BAD_URI | NFOCR_LOAD_FAILED | NFOCR_NO_CGIMAGE |
 *   NFOCR_VISION_ERROR | NFOCR_VISION_HANDLER_FAILED |
 *   NFOCR_UNAVAILABLE (non-iOS / module not linked)
 *
 * @param {string} imageUri
 * @returns {Promise<OCRResult>}
 */
export async function recognizeText(imageUri) {
  if (!imageUri || typeof imageUri !== 'string') {
    const err = new Error('recognizeText requires an image URI');
    err.code = 'NFOCR_BAD_URI';
    throw err;
  }
  if (Platform.OS !== 'ios') {
    const err = new Error('OCR is only supported on iOS');
    err.code = 'NFOCR_UNAVAILABLE';
    throw err;
  }
  const mod = nativeModule();
  if (!mod || typeof mod.recognizeText !== 'function') {
    const err = new Error(
      'OCR native module not linked — rebuild the iOS app',
    );
    err.code = 'NFOCR_UNAVAILABLE';
    throw err;
  }
  return await mod.recognizeText(imageUri);
}

/**
 * Convenience: return just the recognized strings, in reading order.
 * Useful for the sticker parser, which only needs lines and not the
 * confidence / bbox metadata.
 *
 * @param {string} imageUri
 * @returns {Promise<string[]>}
 */
export async function recognizeTextLines(imageUri) {
  const {lines} = await recognizeText(imageUri);
  return lines
    .map(l => (l && typeof l.text === 'string' ? l.text : ''))
    .filter(t => t && t.trim().length > 0);
}

/**
 * Returns true if OCR is callable on this device — used by screens to
 * gate the "Scan sticker" button at boot.
 *
 * @returns {boolean}
 */
export function isOCRAvailable() {
  if (Platform.OS !== 'ios') {
    return false;
  }
  const mod = nativeModule();
  return !!mod && typeof mod.recognizeText === 'function';
}
