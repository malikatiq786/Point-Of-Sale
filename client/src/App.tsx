import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/features/dashboard";
import { POSTerminal, Sales } from "@/features/sales";
import { Products, Stock } from "@/features/products";
import Customers from "@/features/customers";
import Suppliers from "@/features/suppliers";
import Expenses from "@/features/expenses";
import { Employees } from "@/features/hr";
import Users from "@/features/users/pages/users";
import Roles from "@/features/users/pages/roles";
import ActivityLogs from "@/features/users/pages/activity-logs";
import Notifications from "@/features/users/pages/notifications";
import Settings from "@/features/settings";
import Categories from "@/features/categories";
import Purchases from "@/features/purchases";
import { Warehouses, StockManagement, StockTransfers, StockAdjustments } from "@/features/inventory";
import AddProduct from "@/features/products/pages/add-product";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/pos" component={POSTerminal} />
          <Route path="/products" component={Products} />
          <Route path="/products/add" component={AddProduct} />
          <Route path="/categories" component={Categories} />
          <Route path="/stock" component={Stock} />
          <Route path="/customers" component={Customers} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/sales" component={Sales} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/employees" component={Employees} />
          <Route path="/users" component={Users} />
          <Route path="/roles" component={Roles} />
          <Route path="/activity-logs" component={ActivityLogs} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/stock-management" component={StockManagement} />
          <Route path="/stock-transfers" component={StockTransfers} />
          <Route path="/stock-adjustments" component={StockAdjustments} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
