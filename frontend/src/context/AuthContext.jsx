import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState(null);
  const bootstrapGenerationRef = useRef(0);

  const syncUserFromBackend = useCallback(async (prefetchedMe = null, firebaseUser = auth.currentUser, options = {}) => {
    if (!firebaseUser) {
      setUser(null);
      setRole(null);
      return null;
    }

    const forceRefresh = Boolean(options.forceRefresh);
    let me = prefetchedMe;
    if (!me) {
      me = await getMe(firebaseUser, { forceRefresh });
    }
    if (!me?.user) {
      setUser(null);
      setRole(null);
      console.info("Auth sync: no backend profile yet", { uid: firebaseUser.uid });
      return null;
    }

    const backendUser = { ...me.user, uid: firebaseUser.uid };
    setUser(backendUser);
    setRole(backendUser.role || null);
    console.info("Auth sync: backend user loaded", {
      uid: firebaseUser.uid,
      role: backendUser.role,
    });
    return backendUser;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const generation = bootstrapGenerationRef.current + 1;
      bootstrapGenerationRef.current = generation;

      if (!firebaseUser) {
        setFirebaseUid(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        console.info("Auth bootstrap: signed out");
        return;
      }

      setFirebaseUid(firebaseUser.uid);
      setLoading(true);
      console.info("Auth bootstrap: Firebase user detected", {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
      });

      try {
        await firebaseUser.getIdToken(true);
        await syncUserFromBackend(null, firebaseUser, { forceRefresh: true });
      } catch (err) {
        let authError = err;
        const status = err?.response?.status;

        if (status === 401 || status === 403) {
          try {
            await syncUserFromBackend(null, firebaseUser, { forceRefresh: true });
            authError = null;
          } catch (retryError) {
            authError = retryError;
          }
        }

        if (authError) {
          console.error("Auth bootstrap getMe failed:", {
            status: authError?.response?.status || "network",
            message: authError?.response?.data?.message || authError.message,
            errors: authError?.response?.data?.errors || null,
          });

          const finalStatus = authError?.response?.status;
          if (finalStatus === 401 || finalStatus === 403) {
            try {
              await signOut(auth);
            } catch (signOutError) {
              console.error("Failed to sign out after auth error:", signOutError);
            }
            if (bootstrapGenerationRef.current === generation) {
              setUser(null);
              setRole(null);
              setFirebaseUid(null);
            }
          }
        }
      } finally {
        if (bootstrapGenerationRef.current === generation) {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [syncUserFromBackend]);

  const loginWithEmail = async (email, password, selectedRole) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;
      const backendUser = await syncUserFromBackend(null, firebaseUser);
      if (!backendUser?.role) {
        throw new Error("Account is not registered in CampusFlow. Please sign up first.");
      }
      await validateRoleSelection(selectedRole, firebaseUser);
      return getRoleHome(backendUser.role);
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
      const credential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = credential.user;
      const backendUser = await syncUserFromBackend(null, firebaseUser);
      if (!backendUser?.role) {
        throw new Error("Account is not registered in CampusFlow. Please complete registration.");
      }
      await validateRoleSelection(selectedRole, firebaseUser);
      return getRoleHome(backendUser.role);
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
    setFirebaseUid(null);
    setLoading(false);
  };

  const value = {
    user,
    role,
    loading,
    firebaseUid,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    getRoleHome,
    syncUserFromBackend,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
