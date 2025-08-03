import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Don't throw on 401/403 errors, just return undefined user
    throwOnError: false,
  });

  // Check if we have our custom login user or if we need to force login
  const isCustomAuthUser = user && user.email && user.role;
  
  return {
    user: isCustomAuthUser ? user : null,
    isLoading,
    isAuthenticated: !!isCustomAuthUser,
  };
}
