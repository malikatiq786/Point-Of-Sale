import { Badge } from "@/components/ui/badge";

function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4 mt-auto">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>© {currentYear} Universal POS System</span>
          <Badge variant="outline" className="text-xs">
            Build: 1.0.{Math.floor(Date.now() / 1000)}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Status: <span className="text-green-600 font-medium">Online</span></span>
          <span>|</span>
          <a href="#" className="hover:text-gray-900 transition-colors">
            Support
          </a>
          <span>|</span>
          <a href="#" className="hover:text-gray-900 transition-colors">
            Documentation
          </a>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;