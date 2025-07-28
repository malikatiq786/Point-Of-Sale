import { ReactNode } from "react";

interface PosLayoutProps {
  children: ReactNode;
}

function PosLayout({ children }: PosLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default PosLayout;