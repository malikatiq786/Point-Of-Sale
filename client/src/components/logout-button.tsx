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
      
      // Reload the page to trigger re-authentication
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to direct redirect
      window.location.href = "/api/auth/logout";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="flex items-center space-x-2"
    >
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
    </Button>
  );
}