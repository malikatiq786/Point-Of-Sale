import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/layouts";
import DashboardStats from "../components/dashboard-stats";
import RecentActivities from "@/components/recent-activities";
import QuickSaleModal from "@/components/quick-sale-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, ShoppingCart, Package } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showQuickSale, setShowQuickSale] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch top products
  const { data: topProducts, error: topProductsError } = useQuery({
    queryKey: ["/api/dashboard/top-products"],
    retry: false,
  });

  // Fetch recent transactions
  const { data: recentTransactions, error: transactionsError } = useQuery({
    queryKey: ["/api/dashboard/recent-transactions"],
    retry: false,
  });

  // Handle errors
  useEffect(() => {
    if (topProductsError && isUnauthorizedError(topProductsError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
    if (transactionsError && isUnauthorizedError(transactionsError as Error)) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [topProductsError, transactionsError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name || 'User'}! Here's your business overview.</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <RecentActivities />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowQuickSale(true)}
                className="w-full justify-start"
                variant="outline"
              >
                <Package className="mr-2 h-4 w-4" />
                Quick Sale
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/sample-data', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    if (response.ok) {
                      const result = await response.json();
                      toast({
                        title: "Sample data added successfully!",
                        description: `Added ${result.products} products, ${result.categories} categories, and ${result.brands} brands.`,
                      });
                      window.location.reload();
                    } else {
                      throw new Error('Failed to add sample data');
                    }
                  } catch (error) {
                    toast({
                      title: "Error adding sample data",
                      description: "Please try again later.",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Sample Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <QuickSaleModal 
        isOpen={showQuickSale} 
        onClose={() => setShowQuickSale(false)} 
      />
    </AppLayout>
  );
}