import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: 'user',
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...newProfile,
              createdAt: serverTimestamp(),
            });
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        // Check if we have a mocked session from a previous failed anonymous login
        const mockedUid = localStorage.getItem('integra-pro-mocked-uid');
        if (mockedUid) {
          setUser({ uid: mockedUid, isAnonymous: true } as User);
        } else {
          setUser(null);
        }

        // Provide a default guest profile with persistence
        const savedGuest = localStorage.getItem('integra-pro-guest-profile');
        if (savedGuest) {
          setProfile(JSON.parse(savedGuest));
        } else {
          setProfile({
            uid: mockedUid || 'guest',
            email: 'guest@example.com',
            displayName: 'Visitante',
            photoURL: '',
            role: 'guest',
            createdAt: new Date().toISOString(),
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginAnonymously = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      if (err.code === 'auth/admin-restricted-operation') {
        // Fallback to a mocked UID if anonymous login is disabled in Firebase Console
        console.warn('Anonymous Auth is disabled. Using persistent local session.');
        let mockedUid = localStorage.getItem('integra-pro-mocked-uid');
        if (!mockedUid) {
          mockedUid = `local_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('integra-pro-mocked-uid', mockedUid);
        }
        setUser({ uid: mockedUid, isAnonymous: true } as User);
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, data, { merge: true });
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } else if (profile?.role === 'guest') {
      const newProfile = { ...profile, ...data };
      setProfile(newProfile);
      localStorage.setItem('integra-pro-guest-profile', JSON.stringify(newProfile));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      loginWithEmail,
      loginAnonymously,
      logout, 
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
