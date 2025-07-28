import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogIn, User, Lock, AlertCircle, Copy } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { toast } = useToast();

  // Test credentials for different user roles
  const testCredentials = [
    {
      role: "Super Admin",
      email: "malikatiq@gmail.com",
      password: "admin123",
      description: "Full system access - All modules and permissions",
      color: "bg-red-100 text-red-800"
    },
    {
      role: "Admin/Owner",
      email: "owner@company.com",
      password: "owner123",
      description: "Business owner - Full access except role management",
      color: "bg-purple-100 text-purple-800"
    },
    {
      role: "Manager",
      email: "manager@company.com",
      password: "manager123",
      description: "Store manager - Operations, sales, inventory, reports",
      color: "bg-blue-100 text-blue-800"
    },
    {
      role: "Cashier",
      email: "cashier@company.com",
      password: "cashier123",
      description: "POS operator - Limited to sales and basic customer management",
      color: "bg-green-100 text-green-800"
    },
    {
      role: "Accountant",
      email: "accountant@company.com",
      password: "accountant123",
      description: "Financial staff - Expenses, purchases, accounting, reports",
      color: "bg-yellow-100 text-yellow-800"
    },
    {
      role: "Warehouse Staff",
      email: "warehouse@company.com",
      password: "warehouse123",
      description: "Inventory staff - Stock management, transfers, inventory reports",
      color: "bg-orange-100 text-orange-800"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Login successful! Redirecting to dashboard...",
        });
        
        // Redirect to dashboard after successful login
        window.location.href = "/";
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = (credentials: any) => {
    setFormData({
      email: credentials.email,
      password: credentials.password
    });
  };

  const copyCredentials = (email: string, password: string) => {
    navigator.clipboard.writeText(`${email} / ${password}`);
    toast({
      title: "Copied",
      description: "Credentials copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center">
                <LogIn className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your Universal POS System account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Test Credentials */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Test User Credentials
              </CardTitle>
              <CardDescription>
                Click on any credentials below to auto-fill the login form
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testCredentials.map((cred, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleTestLogin(cred)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge className={cred.color}>
                          {cred.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCredentials(cred.email, cred.password);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Email:</span>
                        <p className="font-mono text-gray-900">{cred.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Password:</span>
                        <p className="font-mono text-gray-900">{cred.password}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-2">{cred.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Quick Access Instructions:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click any credential card to auto-fill the login form</li>
                  <li>• Use the copy button to copy credentials to clipboard</li>
                  <li>• Super Admin has access to all system features</li>
                  <li>• Other roles have limited access based on their permissions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}