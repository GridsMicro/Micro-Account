"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { checkPermission, getUserPermissions, type PermissionAction, type ModuleName } from "@/lib/permissions";

// Permission context
interface PermissionContextType {
  permissions: Record<string, Record<PermissionAction, boolean>>;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
  check: (module: ModuleName | string, action: PermissionAction) => boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: {},
  loading: true,
  refreshPermissions: async () => {},
  check: () => false,
});

// Hook to use permissions
export function usePermissions() {
  return useContext(PermissionContext);
}

// Permission Provider component
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Record<string, Record<PermissionAction, boolean>>>({});
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      // Fetch permissions from API
      const response = await fetch("/api/user/permissions");
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || {});
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const check = (module: ModuleName | string, action: PermissionAction): boolean => {
    return permissions[module]?.[action] || false;
  };

  return (
    <PermissionContext.Provider value={{ permissions, loading, refreshPermissions: fetchPermissions, check }}>
      {children}
    </PermissionContext.Provider>
  );
}

// Permission Gate component - renders children only if permission is granted
interface PermissionGateProps {
  module: ModuleName | string;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ module, action, children, fallback = null }: PermissionGateProps) {
  const { check, loading } = usePermissions();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      </div>
    );
  }

  const hasPermission = check(module, action);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Permission Check component for buttons/links - disables element if no permission
interface PermissionCheckProps {
  module: ModuleName | string;
  action: PermissionAction;
  children: React.ReactElement;
}

export function PermissionCheck({ module, action, children }: PermissionCheckProps) {
  const { check, loading } = usePermissions();

  const hasPermission = check(module, action);

  if (loading || !hasPermission) {
    return (
      <span className="opacity-50 cursor-not-allowed" onClick={(e) => e.preventDefault()}>
        {children}
      </span>
    );
  }

  return children;
}

// Permission Denied component
export function PermissionDenied() {
  return (
    <div className="min-h-screen bg-[#fcfaff] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] p-12 max-w-md w-full shadow-2xl shadow-slate-100 border border-slate-100 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบหากคุณคิดว่านี่เป็นข้อผิดพลาด
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
        >
          กลับไปหน้าหลัก
        </a>
      </div>
    </div>
  );
}

// Helper hooks for common permission checks
export function useCanCreate(module: ModuleName | string) {
  const { check } = usePermissions();
  return check(module, "create");
}

export function useCanRead(module: ModuleName | string) {
  const { check } = usePermissions();
  return check(module, "read");
}

export function useCanUpdate(module: ModuleName | string) {
  const { check } = usePermissions();
  return check(module, "update");
}

export function useCanDelete(module: ModuleName | string) {
  const { check } = usePermissions();
  return check(module, "delete");
}

export function useCanExport(module: ModuleName | string) {
  const { check } = usePermissions();
  return check(module, "export");
}

export function useCanManage(module: ModuleName | string) {
  const { check } = usePermissions();
  return check(module, "manage");
}
