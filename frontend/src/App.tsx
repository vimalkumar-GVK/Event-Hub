import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Login from './pages/Login';
import VerifyCertificate from './pages/public/VerifyCertificate';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentCheckIn from './pages/student/CheckIn';

// Sub Admin pages (shell — contains its own nested routes)
import SubAdminDashboard from './pages/subadmin/Dashboard';

// Admin pages (shell — contains its own nested routes)
import AdminDashboard from './pages/admin/Dashboard';

// Super Admin pages (shell — contains its own nested routes)
import SuperAdminDashboard from './pages/superadmin/Dashboard';

// Shared layout guard
import ProtectedRoute from './components/layout/ProtectedRoute';

import { useTheme } from './hooks/useTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  useTheme(); // Initialize theme

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:certificateId?" element={<VerifyCertificate />} />
          
          {/* Check-in route (handles its own auth redirection) */}
          <Route path="/student/checkin/:eventId" element={<StudentCheckIn />} />

          {/* Student routes — student only */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                {/* StudentDashboard is the full shell with its own nested <Routes> */}
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Sub Admin routes — sub_admin, admin, super_admin */}
          <Route
            path="/subadmin/*"
            element={
              <ProtectedRoute allowedRoles={['sub_admin', 'admin', 'super_admin']}>
                {/* SubAdminDashboard handles its own nested <Routes> */}
                <SubAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin routes — admin, super_admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                {/* AdminDashboard handles its own nested <Routes> */}
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super Admin routes — super_admin only */}
          <Route
            path="/superadmin/*"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                {/* SuperAdminDashboard handles its own nested <Routes> */}
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
