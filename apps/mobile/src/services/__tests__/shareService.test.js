import RNShare from 'react-native-share';
import {captureRef} from 'react-native-view-shot';
import {shareSnapshot} from '../shareService';

beforeEach(() => {
  RNShare.__reset();
  captureRef.mockClear();
});

describe('shareSnapshot', () => {
  it('throws when ref is not attached', async () => {
    await expect(shareSnapshot(null, 'name')).rejects.toThrow(
      'ref is not attached',
    );
    await expect(shareSnapshot({current: null}, 'name')).rejects.toThrow(
      'ref is not attached',
    );
  });

  it('captures the ref and hands the URI to RNShare.open', async () => {
    const ref = {current: {/* fake View instance */}};
    await shareSnapshot(ref, 'my-ski');
    expect(captureRef).toHaveBeenCalledWith(
      ref,
      expect.objectContaining({format: 'png', quality: 1}),
    );
    expect(RNShare.open).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'file:///tmp/test-snapshot.png',
        filename: 'my-ski.png',
        type: 'image/png',
        failOnCancel: false,
      }),
    );
  });

  it('returns success:true on a real share', async () => {
    RNShare.open.mockResolvedValueOnce({success: true});
    const result = await shareSnapshot({current: {}}, 'x');
    expect(result.success).toBe(true);
  });

  it('treats user cancellation as a no-op (success:false)', async () => {
    const err = new Error('User did not share');
    RNShare.open.mockRejectedValueOnce(err);
    const result = await shareSnapshot({current: {}}, 'x');
    expect(result.success).toBe(false);
  });

  it('propagates non-cancellation errors', async () => {
    RNShare.open.mockRejectedValueOnce(new Error('something else'));
    await expect(shareSnapshot({current: {}}, 'x')).rejects.toThrow(
      'something else',
    );
  });

  it('forwards optional title + message to the share sheet', async () => {
    await shareSnapshot({current: {}}, 'x', {
      title: 'My ski',
      message: 'hi',
    });
    expect(RNShare.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My ski',
        subject: 'My ski',
        message: 'hi',
      }),
    );
  });
});
