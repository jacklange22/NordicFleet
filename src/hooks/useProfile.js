import {useEffect, useState} from 'react';
import {subscribeProfile} from '../services/userService';

/**
 * Subscribe to the current user's profile doc. Returns `{ profile, loading }`.
 *
 * @param {string|undefined} uid
 * @returns {{profile: object|null, loading: boolean}}
 */
export default function useProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeProfile(uid, p => {
      setProfile(p);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return {profile, loading};
}
