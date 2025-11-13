import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

export const useAuth = () => {
  // Initialize state with the current user synchronously to avoid flashing loading screens
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  // Loading is only true if the initial user state is null and auth is still initializing.
  const [loading, setLoading] = useState(user === null);

  useEffect(() => {
    console.log('[useAuth] Initializing with user:', auth.currentUser?.uid);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[useAuth] Auth state changed. New user:', user?.uid);
      setUser(user);
      setLoading(false);
    });

    // If the listener fires after the initial state is set,
    // and the user is still null, it means we are truly not logged in.
    if (auth.currentUser === null) {
        setLoading(false);
    }


    return () => unsubscribe();
  }, []);

  return { user, loading };
};
