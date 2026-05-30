import {useCallback, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {listAllWaxLogs} from '../services/waxLogService';
import {listAllTestLogs} from '../services/testLogService';

// Wax/test logs are written with serverTimestamp(), which arrives as a
// Firestore Timestamp. The Firestore mock stamps a string instead. Normalize
// both shapes (plus actual Date) into a JS Date.
const toDate = v => {
  if (!v) {
    return null;
  }
  if (typeof v.toDate === 'function') {
    return v.toDate();
  }
  if (v instanceof Date) {
    return v;
  }
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/**
 * Dashboard stats - counts and the most-recent wax timestamp.
 *
 * Refetches whenever the screen using it gains focus (so logging a wax
 * from the WaxLog screen and returning to Home shows the new value).
 *
 * @param {string|undefined} uid
 * @returns {{
 *   lastWaxAt: Date|null,
 *   totalTests: number,
 *   totalWaxes: number,
 *   loading: boolean,
 *   refresh: () => Promise<void>,
 * }}
 */
export default function useDashboardStats(uid) {
  const [lastWaxAt, setLastWaxAt] = useState(null);
  const [totalWaxes, setTotalWaxes] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) {
      setLastWaxAt(null);
      setTotalWaxes(0);
      setTotalTests(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [waxLogs, testLogs] = await Promise.all([
        listAllWaxLogs(uid),
        listAllTestLogs(uid),
      ]);
      setTotalWaxes(waxLogs.length);
      setTotalTests(testLogs.length);
      setLastWaxAt(toDate(waxLogs[0]?.date));
    } catch {
      // Swallow - Firestore rules or network failures shouldn't crash Home.
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return {lastWaxAt, totalWaxes, totalTests, loading, refresh};
}
