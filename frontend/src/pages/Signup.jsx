import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getMe, registerUser } from '../api/campusflow';
import { rolePathMap } from '../constants/rolePathMap';
import { auth } from '../firebase/config';
import { Mail, Lock, UserPlus, User } from 'lucide-react';
import Card, { CardBody } from '../components/Card';
import Loader from '../components/Loader';
import Navbar from '../components/Navbar';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signupWithEmail, user, loading: authLoading, syncUserFromBackend } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const navigate = useNavigate();

  const registrationDisabled = !settingsLoading && settings?.allowRegistration === false;

  useEffect(() => {
    if (authLoading) return;
    if (user?.role && rolePathMap[user.role]) {
      navigate(rolePathMap[user.role], { replace: true });
    }
  }, [user, authLoading, navigate]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchMeWithRetry = async (attempts = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await getMe(auth.currentUser);
      } catch (err) {
        lastError = err;
        const status = err?.response?.status;
        const shouldRetry = attempt < attempts && [429, 500].includes(status);
        if (!shouldRetry) {
          throw err;
        }
        await sleep(250 * attempt);
      }
    }
    throw lastError;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setIsSubmitting(true);
    try {
      await signupWithEmail(email, password, selectedRole, name);

      let me;
      try {
        me = await fetchMeWithRetry();
      } catch (fetchErr) {
        if (fetchErr?.response?.status !== 404) {
          throw fetchErr;
        }
        await registerUser({ name, email, role: selectedRole }, auth.currentUser);
        me = await fetchMeWithRetry();
      }

      if (!me?.user?.role) {
        await registerUser({ name, email, role: selectedRole }, auth.currentUser);
        me = await fetchMeWithRetry();
      }

      const backendUser = await syncUserFromBackend(me, auth.currentUser);
      if (backendUser?.role && rolePathMap[backendUser.role]) {
        navigate(rolePathMap[backendUser.role], { replace: true });
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else {
        setError(err?.response?.data?.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans w-full">
      <Navbar isPublic={true} />

      <main className="flex-1 flex justify-center items-center py-12 px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-lg bg-white border border-gray-100">
          <CardBody className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-indigo-600">Create Account</h1>
              <p className="text-gray-500 text-sm">Join the CampusFlow today.</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-medium border border-red-100">
                {error}
              </div>
            )}

            {settingsLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                <Loader size={24} className="text-indigo-600" />
                <span className="ml-3">Checking registration settings...</span>
              </div>
            ) : registrationDisabled ? (
              <div className="space-y-4 text-center">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Registrations are currently disabled by the administrator. Please contact support or sign in if you already have an account.
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Go to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 font-medium bg-gray-50 focus:bg-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 font-medium bg-gray-50 focus:bg-white"
                    placeholder="student@college.edu"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 font-medium bg-gray-50 focus:bg-white"
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="space-y-1 pb-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="role">
                  I am a...
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-700 font-medium bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="staff">Staff Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-transform active:scale-[0.98]"
              >
                {isSubmitting ? <Loader size={20} className="text-white" /> : (
                  <><UserPlus className="mr-2 h-5 w-5" /> Create Account</>
                )}
              </button>
            </form>
            )}

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                Sign In
              </Link>
            </p>
          </CardBody>
        </Card>
      </main>
    </div>
  );
};

export default Signup;



