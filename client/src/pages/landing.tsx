import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Universal POS System
          </CardTitle>
          <CardDescription className="text-gray-600">
            Modern point of sale solution for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Welcome to your comprehensive business management solution
            </p>
            <Button 
              onClick={handleLogin} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sign In with Replit
            </Button>
          </div>
          <div className="mt-6 text-center">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <strong>Features:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• POS Terminal</li>
                  <li>• Inventory Management</li>
                  <li>• Customer Management</li>
                  <li>• Sales Analytics</li>
                </ul>
              </div>
              <div>
                <strong>Business Tools:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Multi-branch Support</li>
                  <li>• Employee Management</li>
                  <li>• Financial Reports</li>
                  <li>• Expense Tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Landing;