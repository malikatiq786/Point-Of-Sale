import { ReactNode } from "react";
import LandingHeader from "./header";
import LandingFooter from "./footer";

interface LandingLayoutProps {
  children: ReactNode;
}

function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <LandingHeader />
      
      <main className="flex-1">
        {children}
      </main>
      
      <LandingFooter />
    </div>
  );
}

export default LandingLayout;