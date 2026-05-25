import {useEffect, useState} from 'react';
import {subscribeSkis} from '../services/skiService';

/**
 * Subscribe to the current user's ski list. Returns `{ skis, loading }`.
 * Hides retired skis when `includeRetired` is false (the default).
 *
 * @param {string|undefined} uid
 * @param {{includeRetired?: boolean}} [options]
 * @returns {{skis: Array<object>, loading: boolean}}
 */
export default function useSkis(uid, options = {}) {
  const includeRetired = !!options.includeRetired;
  const [skis, setSkis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSkis([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeSkis(uid, list => {
      setSkis(includeRetired ? list : list.filter(s => !s.retired));
      setLoading(false);
    });
    return unsub;
  }, [uid, includeRetired]);

  return {skis, loading};
}
