import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showMessage = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(...permissions) 
      : hasAnyPermission(...permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showMessage) {
      return (
        <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
          You don't have permission to access this content.
        </div>
      );
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface ModuleGuardProps {
  children: ReactNode;
  module: string;
  fallback?: ReactNode;
}

export function ModuleGuard({ children, module, fallback = null }: ModuleGuardProps) {
  const { canAccessModule, isAuthenticated } = useAuth();

  if (!isAuthenticated || !canAccessModule(module)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface RouteGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
}

export function RouteGuard({
  children,
  permission,
  permissions,
  requireAll = false,
}: RouteGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to access this page.</p>
      </div>
    );
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(...permissions) 
      : hasAnyPermission(...permissions);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-2 text-destructive">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
