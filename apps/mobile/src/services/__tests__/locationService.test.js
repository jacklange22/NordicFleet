import Geolocation from '@react-native-community/geolocation';
import {getCurrentLocation} from '../locationService';

beforeEach(() => {
  Geolocation.getCurrentPosition.mockReset();
});

describe('getCurrentLocation', () => {
  test('returns null on permission denial / error', async () => {
    Geolocation.getCurrentPosition.mockImplementation((_succ, err) => {
      err({code: 1, message: 'Permission denied'});
    });
    const result = await getCurrentLocation();
    expect(result).toBeNull();
  });

  test('returns lat/lng/accuracy from a successful fix', async () => {
    Geolocation.getCurrentPosition.mockImplementation(succ => {
      succ({coords: {latitude: 43.7, longitude: -72.3, accuracy: 12}});
    });
    const result = await getCurrentLocation();
    expect(result).toEqual({latitude: 43.7, longitude: -72.3, accuracy: 12});
  });

  test('returns null if accuracy is missing (degraded gracefully)', async () => {
    Geolocation.getCurrentPosition.mockImplementation(succ => {
      succ({coords: {latitude: 1, longitude: 2}});
    });
    const result = await getCurrentLocation();
    expect(result).toEqual({latitude: 1, longitude: 2, accuracy: null});
  });

  test('returns null when position has no coords', async () => {
    Geolocation.getCurrentPosition.mockImplementation(succ => {
      succ({});
    });
    const result = await getCurrentLocation();
    expect(result).toBeNull();
  });
});
