import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function LandingHeader() {
  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">UP</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Universal POS
            </h1>
            <Badge variant="secondary" className="text-xs">
              Business Solution
            </Badge>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
            Pricing
          </a>
          <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
            About
          </a>
          <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    </header>
  );
}

export default LandingHeader;