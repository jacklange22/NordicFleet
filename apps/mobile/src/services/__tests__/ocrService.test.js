/**
 * @jest-environment node
 */

// Mock react-native's NativeModules + Platform before importing the
// service. Each test resets the mock state through getMockNFOCR().

let mockNFOCR;
let mockPlatformOS = 'ios';

jest.mock('react-native', () => ({
  NativeModules: {
    get NFOCR() {
      return mockNFOCR;
    },
  },
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
  },
}));

const ocrService = require('../ocrService');

beforeEach(() => {
  mockPlatformOS = 'ios';
  mockNFOCR = {
    recognizeText: jest.fn().mockResolvedValue({
      lines: [
        {text: 'Fischer', confidence: 0.99, bbox: {x: 0, y: 0.9, w: 0.3, h: 0.05}},
        {text: 'Speedmax', confidence: 0.97, bbox: {x: 0, y: 0.85, w: 0.4, h: 0.05}},
        {text: '', confidence: 0.5, bbox: {x: 0, y: 0, w: 0, h: 0}},
        {text: '  ', confidence: 0.5, bbox: {x: 0, y: 0, w: 0, h: 0}},
      ],
    }),
  };
});

describe('isOCRAvailable', () => {
  test('true when iOS + module linked', () => {
    expect(ocrService.isOCRAvailable()).toBe(true);
  });

  test('false on Android', () => {
    mockPlatformOS = 'android';
    expect(ocrService.isOCRAvailable()).toBe(false);
  });

  test('false when native module is missing', () => {
    mockNFOCR = undefined;
    expect(ocrService.isOCRAvailable()).toBe(false);
  });
});

describe('recognizeText', () => {
  test('passes URI to the native module + returns the result', async () => {
    const out = await ocrService.recognizeText('file:///tmp/sticker.jpg');
    expect(mockNFOCR.recognizeText).toHaveBeenCalledWith('file:///tmp/sticker.jpg');
    expect(out.lines).toHaveLength(4);
    expect(out.lines[0].text).toBe('Fischer');
  });

  test('rejects on Android with NFOCR_UNAVAILABLE', async () => {
    mockPlatformOS = 'android';
    await expect(ocrService.recognizeText('file:///x.jpg')).rejects.toMatchObject({
      code: 'NFOCR_UNAVAILABLE',
    });
  });

  test('rejects when native module is not linked', async () => {
    mockNFOCR = undefined;
    await expect(ocrService.recognizeText('file:///x.jpg')).rejects.toMatchObject({
      code: 'NFOCR_UNAVAILABLE',
    });
  });

  test('rejects when URI is empty / wrong type', async () => {
    await expect(ocrService.recognizeText('')).rejects.toMatchObject({
      code: 'NFOCR_BAD_URI',
    });
    await expect(ocrService.recognizeText(undefined)).rejects.toMatchObject({
      code: 'NFOCR_BAD_URI',
    });
    await expect(ocrService.recognizeText(null)).rejects.toMatchObject({
      code: 'NFOCR_BAD_URI',
    });
  });

  test('propagates native errors (with original code) through rejection', async () => {
    const visionErr = new Error('Vision failed');
    visionErr.code = 'NFOCR_VISION_ERROR';
    mockNFOCR.recognizeText = jest.fn().mockRejectedValue(visionErr);
    await expect(ocrService.recognizeText('file:///x.jpg')).rejects.toMatchObject({
      message: 'Vision failed',
      code: 'NFOCR_VISION_ERROR',
    });
  });
});

describe('recognizeTextLines', () => {
  test('returns only non-empty text strings', async () => {
    const lines = await ocrService.recognizeTextLines('file:///x.jpg');
    expect(lines).toEqual(['Fischer', 'Speedmax']);
  });
});
