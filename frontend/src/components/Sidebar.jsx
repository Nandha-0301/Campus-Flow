import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Users,
  BookOpen,
  CheckSquare,
  BarChart2,
  Calendar,
  LayoutGrid,
  Settings,
  Bell,
  Menu,
} from "lucide-react";

const roleLinks = {
  admin: [
    { name: "Dashboard", path: "/admin", icon: Home },
    { name: "Staff", path: "/admin/staff", icon: Users },
    { name: "Academics", path: "/admin/academics", icon: BookOpen },
    { name: "Announcements", path: "/admin/announcements", icon: BookOpen },
    { name: "Classes", path: "/admin/classes", icon: LayoutGrid },
    { name: "Timetable", path: "/admin/timetable", icon: Calendar },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ],
  staff: [
    { name: "Dashboard", path: "/staff", icon: Home },
    { name: "My Classes", path: "/staff/classes", icon: LayoutGrid },
    { name: "Timetable", path: "/staff/timetable", icon: Calendar },
    { name: "Students", path: "/staff/students", icon: Users },
    { name: "Attendance", path: "/staff/attendance", icon: CheckSquare },
    { name: "Marks", path: "/staff/marks", icon: BookOpen },
    { name: "Assignments", path: "/staff/assignments", icon: BookOpen },
    { name: "Announcements", path: "/staff/announcements", icon: Bell },
  ],
  student: [
    { name: "Dashboard", path: "/student", icon: Home },
    { name: "My Attendance", path: "/student/attendance", icon: CheckSquare },
    { name: "My Marks", path: "/student/marks", icon: BarChart2 },
  ],
  parent: [
    { name: "Dashboard", path: "/parent", icon: Home },
    { name: "Child Performance", path: "/parent/performance", icon: BarChart2 },
  ],
};

const Sidebar = ({ collapsed = false, toggleSidebar }) => {
  const { role } = useAuth();
  const links = roleLinks[role] || roleLinks.admin;

  return (
    <>
      <aside
        className={`relative z-30 flex h-full w-[220px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[70px]" : "w-[220px]"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              CF
            </div>
            {!collapsed && <span className="truncate text-base font-semibold text-slate-900">CampusFlow</span>}
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto py-6 transition-all duration-300 ${collapsed ? "px-2" : "px-3"}`}>
          <div className={`mb-4 px-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400 ${collapsed ? "sr-only" : ""}`}>
            Navigation
          </div>
          <nav className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={["/admin", "/staff", "/student", "/parent"].includes(link.path)}
                  title={collapsed ? link.name : undefined}
                  className={({ isActive }) =>
                    `group flex items-center border-l-[3px] py-3 text-sm font-semibold transition-all duration-200 ${
                      collapsed ? "justify-center rounded-r-2xl px-2" : "gap-3 rounded-r-2xl pl-3 pr-3"
                    } ${
                      isActive
                        ? "border-l-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-l-transparent text-slate-600 hover:border-l-slate-300 hover:bg-white hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={isActive ? "text-indigo-600" : "text-slate-400 transition-colors duration-200 group-hover:text-slate-700"}
                      />
                      {!collapsed && <span className="truncate">{link.name}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          {collapsed ? (
            <div className="flex items-center justify-center py-2" title="Online">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.28)]" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-500">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.28)]" />
              <span>Online</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
