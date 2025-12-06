import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User } from '@/types/crm';

export const [AuthContext, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('[AuthContext] Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              id: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: userData.role || 'user',
            });
          } else {
            // Fallback if no firestore doc exists yet
            setCurrentUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'user',
            });
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error('[AuthContext] Error fetching user data:', error);
          // Still allow login but with basic info
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: 'user',
          });
          setIsAuthenticated(true);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AuthContext] Login attempt:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[AuthContext] Login successful');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Login failed:', error.message);
      let errorMessage = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') errorMessage = 'User not found';
      if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password';
      if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: 'admin' | 'user' = 'user'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AuthContext] Signup attempt:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile display name
      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      });
      
      console.log('[AuthContext] Signup successful');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Signup failed:', error.message);
      let errorMessage = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email already in use';
      if (error.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters';
      if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out');
      await signOut(auth);
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!auth.currentUser) return;
    
    try {
      console.log('[AuthContext] Updating user profile');
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Update Firestore
      await setDoc(userRef, updates, { merge: true });
      
      // Update local state
      if (currentUser) {
        setCurrentUser({ ...currentUser, ...updates });
      }
      
      // Update Auth profile if name changed
      if (updates.name) {
        await updateProfile(auth.currentUser, { displayName: updates.name });
      }
    } catch (error) {
      console.error('[AuthContext] Failed to update profile:', error);
    }
  };

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUserProfile,
  };
});
