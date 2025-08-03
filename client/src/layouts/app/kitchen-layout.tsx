import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface KitchenLayoutProps {
  children: ReactNode;
}

function KitchenLayout({ children }: KitchenLayoutProps) {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      // Reload to trigger auth redirect
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Kitchen-specific header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Kitchen Terminal</h1>
            <p className="text-sm text-gray-500">Real-time order management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="h-4 w-4" />
              <span>{user.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-blue-600 font-medium">{user.role}</span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>
      
      {/* Main content without sidebar */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default KitchenLayout;