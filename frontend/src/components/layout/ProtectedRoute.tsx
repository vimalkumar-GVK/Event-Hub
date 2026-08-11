import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import type { Role } from '../../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

const ROLE_HOME: Record<Role, string> = {
  super_admin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  sub_admin: '/subadmin/dashboard',
  student: '/student/overview',
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { token, role } = useAuthStore();
  const location = useLocation();

  // ── Hydration guard ───────────────────────────────────────────────────────
  // Zustand's persist middleware rehydrates from localStorage asynchronously.
  // On first render, token/role are null even for logged-in users.
  // We use the built-in hasHydrated() + onFinishHydration() to wait safely.
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  // Still loading from localStorage — render nothing (instant, no flash)
  if (!hydrated) return null;

  // Not logged in → go to login
  if (!token || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their correct home
  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] ?? '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
