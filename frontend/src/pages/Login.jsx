import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import Navbar from "../components/Navbar";
import RoleCard from "../components/auth/RoleCard";
import Loader from "../components/Loader";
import { getMe, registerUser, validateRoleSelection } from "../api/campusflow";
import { useAuth } from "../context/AuthContext";
import { rolePathMap } from "../constants/rolePathMap";
import { auth, googleProvider } from "../firebase/config";

const roleLabelMap = {
  admin: "Admin",
  staff: "Staff",
  student: "Student",
  parent: "Parent",
};

const Login = () => {
  const [activeRole, setActiveRole] = useState(null);
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [roleErrors, setRoleErrors] = useState({});

  const { user, loading: authLoading, syncUserFromBackend } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (user?.role && rolePathMap[user.role]) {
      const target = rolePathMap[user.role];
      console.info("Login redirect: authenticated session", { role: user.role, target });
      navigate(target, { replace: true });
    }
  }, [user, authLoading, navigate]);

  const setRoleError = (selectedRole, message) => {
    setRoleErrors((current) => ({ ...current, [selectedRole]: message }));
  };

  const clearRoleError = (selectedRole) => {
    setRoleErrors((current) => ({ ...current, [selectedRole]: "" }));
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchMeWithRetry = async (firebaseUser, attempts = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await getMe(firebaseUser, { forceRefresh: attempt === 1 });
      } catch (error) {
        lastError = error;
        const status = error?.response?.status;
        const shouldRetry = attempt < attempts && [429, 500, 502, 503].includes(status);
        if (!shouldRetry) {
          throw error;
        }
        await sleep(250 * attempt);
      }
    }
    throw lastError;
  };

  const resolveAndHydrateBackendUser = async ({ selectedRole, name, email, branch, semester }, firebaseUser) => {
    let me = await fetchMeWithRetry(firebaseUser);

    if (!me?.user?.role) {
      await registerUser({ role: selectedRole, name, email, branch, semester }, firebaseUser);
      me = await fetchMeWithRetry(firebaseUser);
    }

    if (!me?.user?.role) {
      throw new Error("Could not load your account role. Please try again or contact support.");
    }

    await syncUserFromBackend(me, firebaseUser);
    return me;
  };

  const navigateAfterLogin = (accountRole) => {
    const target = rolePathMap[accountRole];
    if (!target) {
      setRoleError("general", `Unknown role "${accountRole}". Contact your administrator.`);
      return;
    }
    console.info("Login success: navigating to dashboard", { role: accountRole, target });
    navigate(target, { replace: true });
  };

  const handleLogin = async (selectedRole, payload) => {
    if (!selectedRole) {
      setRoleError("general", "Please select a role");
      return;
    }
    clearRoleError(selectedRole);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, payload.email, payload.password);
      const firebaseUser = credential.user;

      const me = await resolveAndHydrateBackendUser(
        {
          selectedRole,
          email: payload.email,
        },
        firebaseUser
      );

      await validateRoleSelection(selectedRole, firebaseUser);
      navigateAfterLogin(me.user.role);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Login failed";
      setRoleError(selectedRole, message);
      console.warn("Login failed:", message);
      if (auth.currentUser) {
        await signOut(auth);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (selectedRole, payload) => {
    if (!selectedRole) {
      setRoleError("general", "Please select a role");
      return;
    }
    clearRoleError(selectedRole);
    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      const firebaseUser = credential.user;

      const me = await resolveAndHydrateBackendUser(
        {
          selectedRole,
          name: payload.name,
          email: payload.email,
          branch: payload.branch,
          semester: payload.semester,
        },
        firebaseUser
      );

      navigateAfterLogin(me.user.role);
    } catch (err) {
      setRoleError(selectedRole, err?.response?.data?.message || err?.message || "Signup failed");
      if (auth.currentUser) {
        await signOut(auth);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (selectedRole) => {
    if (!selectedRole) {
      setRoleError("general", "Please select a role");
      return;
    }
    clearRoleError(selectedRole);
    setLoading(true);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = credential.user;

      const me = await resolveAndHydrateBackendUser(
        {
          selectedRole,
          email: credential.user.email,
          name: credential.user.displayName || "CampusFlow User",
        },
        firebaseUser
      );

      if (mode === "login") {
        await validateRoleSelection(selectedRole, firebaseUser);
      }

      navigateAfterLogin(me.user.role);
    } catch (err) {
      setRoleError(selectedRole, err?.response?.data?.message || err?.message || "Google login failed");
      if (auth.currentUser) {
        await signOut(auth);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-indigo-600">
        <Loader size={32} className="text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-700 font-sans">
      <Navbar isPublic={true} />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full items-center justify-center px-4 py-8">
        {!activeRole ? (
          <div className="w-full max-w-md mx-auto transition-opacity duration-300">
            <div className="mb-8 text-center text-white">
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Choose Your Role</h1>
              <p className="mt-2 text-sm text-indigo-100">Select a role to continue securely.</p>
            </div>

            {loading ? <Loader size={20} className="mb-4 text-white" /> : null}

            {roleErrors.general ? <p className="mb-4 text-center text-sm text-red-100">{roleErrors.general}</p> : null}

            <div className="space-y-4">
              {Object.keys(rolePathMap).map((roleKey) => (
                <RoleCard
                  key={roleKey}
                  role={roleKey}
                  activeRole={activeRole}
                  setActiveRole={setActiveRole}
                  mode={mode}
                  setMode={setMode}
                  loading={loading}
                  error=""
                  onLogin={() => {}}
                  onSignup={() => {}}
                  onGoogleLogin={() => {}}
                  selectionOnly={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto transition-opacity duration-300">
            <div className="mb-4 text-center text-white">
              <h1 className="text-3xl font-black tracking-tight">Welcome {roleLabelMap[activeRole]}</h1>
              <p className="mt-2 text-sm text-indigo-100">Access your dashboard securely</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveRole(null);
                setMode("login");
              }}
              className="mb-4 text-sm font-semibold text-indigo-100 hover:text-white transition-colors"
            >
              &larr; Change role
            </button>

            <div className="bg-white rounded-3xl shadow-xl p-8">
              <RoleCard
                role={activeRole}
                activeRole={activeRole}
                setActiveRole={setActiveRole}
                mode={mode}
                setMode={setMode}
                loading={loading}
                error={roleErrors[activeRole]}
                onLogin={(payload) => handleLogin(activeRole, payload)}
                onSignup={(payload) => handleSignup(activeRole, payload)}
                onGoogleLogin={() => handleGoogleLogin(activeRole)}
                showSelector={false}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Login;
