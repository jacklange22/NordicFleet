import {useEffect} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';

// Warn before leaving a screen that has unsaved edits. Standard React
// Navigation `beforeRemove` pattern (fires when the screen is popped, e.g. a
// bottom-tab tap that returns to a screen already in the stack). Made
// defensive: if the navigation object has no addListener (mocked in tests),
// it simply no-ops instead of crashing.
//
// The screen sets `isDirty` true on the first edit and back to false right
// before it saves and pops, so a normal save never triggers the prompt.
export default function useUnsavedGuard(isDirty, options = {}) {
  const navigation = useNavigation();
  const message = options.message;

  useEffect(() => {
    if (!navigation || typeof navigation.addListener !== 'function') {
      return undefined;
    }
    const sub = navigation.addListener('beforeRemove', e => {
      if (!isDirty) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        message || 'You have unsaved changes. Leave without saving them?',
        [
          {text: 'Keep editing', style: 'cancel'},
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return sub;
  }, [navigation, isDirty, message]);
}
