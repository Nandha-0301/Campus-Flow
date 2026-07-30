import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User } from "lucide-react";
import { rolePathMap } from "../constants/rolePathMap";

const Navbar = ({ isPublic = false }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const dashboardLink = rolePathMap[role] || "/";

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-end border-b border-slate-200 bg-white px-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] lg:px-6">
      <div className="flex items-center gap-4 lg:gap-6">
        {isPublic && !user && (
          <nav className="hidden items-center space-x-5 text-sm font-semibold text-slate-600 md:flex lg:space-x-8">
            <Link to="/" className="transition-colors duration-200 hover:text-indigo-600">Home</Link>
            <Link to="/features" className="transition-colors duration-200 hover:text-indigo-600">Features</Link>
            <Link to="/how-it-works" className="transition-colors duration-200 hover:text-indigo-600">How It Works</Link>
            <Link to="/team" className="transition-colors duration-200 hover:text-indigo-600">Team</Link>
            <Link to="/about" className="transition-colors duration-200 hover:text-indigo-600">About Us</Link>
            <Link to="/contact" className="transition-colors duration-200 hover:text-indigo-600">Contact</Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!user ? (
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
            >
              Login
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              {isPublic && (
                <Link
                  to={dashboardLink}
                  className="hidden text-sm font-bold text-indigo-600 transition-colors duration-200 hover:text-indigo-700 sm:block"
                >
                  Go to Dashboard
                </Link>
              )}

              <div className="hidden min-w-0 flex-col items-end md:flex">
                <span className="max-w-[220px] truncate text-sm font-semibold leading-tight text-slate-900">
                  {user.email || "User"}
                </span>
                <span className="mt-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                  {role || "Role"}
                </span>
              </div>

              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm transition-all duration-200 hover:bg-indigo-100 hover:shadow">
                <User size={20} />
              </div>

              <div className="hidden h-6 w-px bg-slate-200 md:block" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
                title="Logout"
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span className="hidden md:block">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
