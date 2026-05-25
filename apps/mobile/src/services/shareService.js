import RNShare from 'react-native-share';
import {captureRef} from 'react-native-view-shot';

/**
 * Snapshot a React Native View (by ref) into a PNG and hand the file
 * URI to the iOS share sheet.
 *
 * Cancellation by the user is treated as a no-op (success: false from
 * react-native-share). Other failures surface to the caller.
 *
 * @param {React.RefObject} ref - ref attached to a <View> via collapsable=false
 * @param {string} filename - filename for the share sheet (no extension)
 * @param {object} [options]
 * @param {string} [options.title]   - optional "subject" on the share sheet
 * @param {string} [options.message] - optional accompanying message
 * @returns {Promise<{success: boolean}>}
 */
export async function shareSnapshot(ref, filename, options = {}) {
  if (!ref?.current) {
    throw new Error('shareSnapshot: ref is not attached');
  }
  const uri = await captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
  try {
    const result = await RNShare.open({
      url: uri,
      filename: `${filename}.png`,
      type: 'image/png',
      title: options.title,
      subject: options.title,
      message: options.message,
      failOnCancel: false,
    });
    return {success: !!result?.success};
  } catch (err) {
    // react-native-share throws a synthetic "User did not share"
    // error when the user dismisses the sheet. Treat that as a no-op.
    if (err && /did not share|cancel/i.test(String(err.message || err))) {
      return {success: false};
    }
    throw err;
  }
}
