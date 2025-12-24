import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  permissions?: string[];
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.user || data;
    },
  });

  const isCustomAuthUser = user && user.email && user.role;
  const currentUser = isCustomAuthUser ? user : null;
  const permissions = useMemo(() => currentUser?.permissions || [], [currentUser?.permissions]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentUser) return false;
    // Super Admin has all permissions
    if (currentUser.role === 'Super Admin') return true;
    return permissions.includes(permission);
  }, [currentUser, permissions]);

  // Check if user has ANY of the provided permissions
  const hasAnyPermission = useCallback((...requiredPermissions: string[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Super Admin') return true;
    return requiredPermissions.some(perm => permissions.includes(perm));
  }, [currentUser, permissions]);

  // Check if user has ALL of the provided permissions
  const hasAllPermissions = useCallback((...requiredPermissions: string[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Super Admin') return true;
    return requiredPermissions.every(perm => permissions.includes(perm));
  }, [currentUser, permissions]);

  // Check if user can access a module
  const canAccessModule = useCallback((module: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Super Admin') return true;
    // Check for any permission that starts with the module name
    return permissions.some(perm => perm.startsWith(`${module}.`));
  }, [currentUser, permissions]);

  return {
    user: currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
  };
}
