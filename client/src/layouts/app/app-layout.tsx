import { ReactNode } from "react";
import AppHeader from "./header";
import AppFooter from "./footer";
import Sidebar from "@/components/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
      
      <AppFooter />
    </div>
  );
}

export default AppLayout;