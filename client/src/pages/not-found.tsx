import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-red-600">404</span>
          </div>
          <CardTitle className="text-xl text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              asChild 
              variant="outline" 
              className="flex-1"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button 
              onClick={() => window.history.back()} 
              variant="default"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            If you believe this is an error, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default NotFound;