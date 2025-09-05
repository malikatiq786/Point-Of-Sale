import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // Redirect to login page after logout
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to login page redirect
      window.location.href = "/login";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="flex items-center space-x-2 text-white hover:bg-white/10"
    >
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
    </Button>
  );
}