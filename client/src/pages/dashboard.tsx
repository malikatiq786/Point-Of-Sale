import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import RecentActivities from "@/components/recent-activities";
import QuickSaleModal from "@/components/quick-sale-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, ShoppingCart, UserPlus, FileText, Search, Bell } from "lucide-react";
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
  const { data: topProducts } = useQuery({
    queryKey: ["/api/dashboard/top-products"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  // Fetch recent transactions
  const { data: recentTransactions } = useQuery({
    queryKey: ["/api/dashboard/recent-transactions"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, manage your business efficiently</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <input 
                  type="text" 
                  placeholder="Search products, customers..." 
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              {/* Quick Sale Button */}
              <Button 
                onClick={() => setShowQuickSale(true)}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">Quick Sale</span>
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="p-2 text-gray-600 hover:text-gray-900 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* Stats Cards */}
          <DashboardStats />

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Sales Chart */}
            <div className="lg:col-span-2">
              <Card className="shadow-soft border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">Sales Overview</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="px-3 py-1 text-sm bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100">
                        7D
                      </Button>
                      <Button variant="outline" size="sm" className="px-3 py-1 text-sm">
                        30D
                      </Button>
                      <Button variant="outline" size="sm" className="px-3 py-1 text-sm">
                        90D
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-primary-600" />
                      </div>
                      <p className="text-gray-600">Sales chart visualization</p>
                      <p className="text-sm text-gray-500 mt-2">Integrated with Recharts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Activities */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <Card className="shadow-soft border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed border-gray-300 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 flex-col space-y-2"
                    >
                      <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary-500" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">Add Product</span>
                    </Button>
                    
                    <Button
                      onClick={() => setShowQuickSale(true)}
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed border-gray-300 hover:border-success-300 hover:bg-success-50 transition-colors duration-200 flex-col space-y-2"
                    >
                      <ShoppingCart className="w-6 h-6 text-gray-400 group-hover:text-success-500" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-success-600">New Sale</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed border-gray-300 hover:border-secondary-300 hover:bg-secondary-50 transition-colors duration-200 flex-col space-y-2"
                    >
                      <UserPlus className="w-6 h-6 text-gray-400 group-hover:text-secondary-500" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-secondary-600">Add Customer</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="p-4 h-auto border-2 border-dashed border-gray-300 hover:border-warning-300 hover:bg-warning-50 transition-colors duration-200 flex-col space-y-2"
                    >
                      <FileText className="w-6 h-6 text-gray-400 group-hover:text-warning-500" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-warning-600">Generate Report</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <RecentActivities />
            </div>
          </div>

          {/* Top Products & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Top Selling Products */}
            <Card className="shadow-soft border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Top Selling Products</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts?.length > 0 ? (
                    topProducts.map((product: any) => (
                      <div key={product.productId} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-600">
                            {product.productName?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                          <p className="text-sm text-gray-500">Product</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{product.totalSold} sold</p>
                          <p className="text-xs text-success-600">${product.totalRevenue}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No sales data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="shadow-soft border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions?.length > 0 ? (
                    recentTransactions.map((transaction: any) => (
                      <div key={transaction.id} className="border-l-4 border-success-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">#{transaction.id}</p>
                            <p className="text-sm text-gray-500">{transaction.customerName || 'Walk-in Customer'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-success-600">+${transaction.totalAmount}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.saleDate).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent transactions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Quick Sale Modal */}
      <QuickSaleModal 
        isOpen={showQuickSale} 
        onClose={() => setShowQuickSale(false)} 
      />
    </div>
  );
}
