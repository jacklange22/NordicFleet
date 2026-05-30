import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {auth} from '../services/firebase';
import {createProfile} from '../services/userService';
import {trace} from '../services/devTrace';

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  sendPasswordResetEmail: async () => {},
});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trace('auth listener attached');
    const unsub = auth().onAuthStateChanged(u => {
      trace('auth resolved', {signedIn: !!u});
      setUser(u || null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email, password) => {
    await auth().signInWithEmailAndPassword(email, password);
  }, []);

  const signUp = useCallback(async (email, password) => {
    const cred = await auth().createUserWithEmailAndPassword(email, password);
    // Best-effort profile creation. If it fails (e.g. offline), Firestore queues
    // the write and the profile shows up after the user reconnects.
    try {
      await createProfile(cred.user.uid, {email: cred.user.email});
    } catch {
      // Swallow — surfaceable via subscribeProfile on next mount.
    }
  }, []);

  const signOutFn = useCallback(async () => {
    await auth().signOut();
  }, []);

  const sendPasswordResetEmail = useCallback(async email => {
    await auth().sendPasswordResetEmail(email);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut: signOutFn,
      sendPasswordResetEmail,
    }),
    [user, loading, signIn, signUp, signOutFn, sendPasswordResetEmail],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
