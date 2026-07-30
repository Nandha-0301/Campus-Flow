import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getMe, validateRoleSelection } from "../api/campusflow";
import { rolePathMap } from "../constants/rolePathMap";
import { auth, googleProvider } from "../firebase/config";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const getRoleHome = (role) => rolePathMap[role] || "/";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasTried, setHasTried] = useState(false);
  const hasTriedRef = useRef(false);

  const fetchMeWithRetry = async (attempts = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await getMe();
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        const shouldRetry = attempt < attempts && [429, 500].includes(status);
        if (!shouldRetry) {
          throw error;
        }
        await sleep(250 * attempt);
      }
    }
    throw lastError;
  };

  const syncUserFromBackend = async (prefetchedMe = null) => {
    const me = prefetchedMe || (await fetchMeWithRetry());
    if (!me?.user) {
      setUser(null);
      setRole(null);
      return null;
    }
    const backendUser = { ...me.user, uid: auth.currentUser?.uid };
    setUser(backendUser);
    setRole(backendUser.role || null);
    return backendUser;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setHasTried(false);
        hasTriedRef.current = false;
        setLoading(false);
        return;
      }

      if (hasTriedRef.current) {
        setLoading(false);
        return;
      }

      try {
        await syncUserFromBackend();
      } catch (err) {
        const status = err?.response?.status;
        console.error("getMe failed:", err);
        if (status !== 404) {
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error("Failed to sign out after auth error:", signOutError);
          }
        }
        setUser(null);
        setRole(null);
      } finally {
        hasTriedRef.current = true;
        setHasTried(true);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email, password, selectedRole) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const validation = await validateRoleSelection(selectedRole);
      const backendUser = await syncUserFromBackend();
      const roleFromDb = backendUser?.role;
      return validation?.redirectPath || getRoleHome(roleFromDb);
    } catch (error) {
      if (auth.currentUser) {
        await signOut(auth);
      }
      throw error;
    }
  };

  const signupWithEmail = async (email, password) => createUserWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = async (selectedRole) => {
    try {
      await signInWithPopup(auth, googleProvider);
      const validation = await validateRoleSelection(selectedRole);
      const backendUser = await syncUserFromBackend();
      const roleFromDb = backendUser?.role;
      return validation?.redirectPath || getRoleHome(roleFromDb);
    } catch (error) {
      if (auth.currentUser) {
        await signOut(auth);
      }
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setRole(null);
    setHasTried(false);
    hasTriedRef.current = false;
    setLoading(false);
  };

  const value = {
    user,
    role,
    loading,
    hasTried,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    getRoleHome,
    syncUserFromBackend,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};











