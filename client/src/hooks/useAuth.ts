import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
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
