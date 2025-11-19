import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

export const useAuth = () => {
  // Initialize state with the current user synchronously to avoid flashing loading screens
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  // Loading is only true if the initial user state is null and auth is still initializing.
  const [loading, setLoading] = useState(user === null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // If the listener fires after the initial state is set,
    // and the user is still null, it means we are truly not logged in.
    // Removed premature check for auth.currentUser === null to allow onAuthStateChanged to handle initial state restoration correctly.


    return () => unsubscribe();
  }, []);

  return { user, loading };
};
