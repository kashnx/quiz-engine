
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
// Loader2 is no longer used for a global spinner in this file.
// Pages or components that need a loader should import it directly or use Skeleton components.

interface AuthContextType {
  user: User | null;
  loading: boolean; // This loading state indicates if the initial auth check is ongoing
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // True until the first auth state is received

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set to false once the initial auth state is known
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Removed the global spinner.
  // Children will now render immediately.
  // Components consuming useAuth() will get loading:true initially and must handle it
  // to show their own loading UIs (spinners, skeletons, etc.).

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // The 'loading' state here now reflects the initial auth check.
  // Components should use this to conditionally render their specific loading UIs.
  return context;
};
