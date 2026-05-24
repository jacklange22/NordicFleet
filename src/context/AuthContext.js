import React, {createContext, useContext, useEffect, useState, useCallback} from 'react';
import {auth} from '../services/firebase';
import {createProfile} from '../services/userService';

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(u => {
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
    } catch (err) {
      // Swallow — surfaceable via subscribeProfile on next mount.
      void err;
    }
  }, []);

  const signOutFn = useCallback(async () => {
    await auth().signOut();
  }, []);

  const value = {user, loading, signIn, signUp, signOut: signOutFn};
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
