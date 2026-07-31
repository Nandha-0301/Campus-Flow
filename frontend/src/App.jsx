import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleProtectedRoute from './routes/RoleProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Team from './pages/Team';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnnouncements from './pages/admin/Announcements';
import ManageStaff from './pages/admin/ManageStaff';
import Academics from './pages/admin/Academics';
import Classes from './pages/admin/Classes';
import Timetable from './pages/admin/Timetable';
import Settings from './pages/admin/Settings';
import StaffLayout from './pages/staff/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffClasses from './pages/staff/MyClasses';
import StaffTimetable from './pages/staff/Timetable';
import StaffStudents from './pages/staff/Students';
import StaffAttendance from './pages/staff/Attendance';
import StaffMarks from './pages/staff/Marks';
import StaffAssignments from './pages/staff/Assignments';
import StaffAnnouncements from './pages/staff/Announcements';
import StudentDashboard from './pages/student/StudentDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Team />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="admin">
                    <AdminLayout />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="staff" element={<ManageStaff />} />
              <Route path="academics" element={<Academics />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="classes" element={<Classes />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="staff">
                    <StaffLayout />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="classes" element={<StaffClasses />} />
              <Route path="timetable" element={<StaffTimetable />} />
              <Route path="students" element={<StaffStudents />} />
              <Route path="attendance" element={<StaffAttendance />} />
              <Route path="marks" element={<StaffMarks />} />
              <Route path="assignments" element={<StaffAssignments />} />
              <Route path="announcements" element={<StaffAnnouncements />} />
            </Route>

            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="student">
                    <StudentDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="student">
                    <StudentDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/*"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="student">
                    <StudentDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/parent"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="parent">
                    <ParentDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="parent">
                    <ParentDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/*"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute role="parent">
                    <ParentDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            {/* Catch all unmatched routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
