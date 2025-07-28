import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/features/auth/pages/login";
import Dashboard from "@/features/dashboard";
import { POSTerminal, Sales, Returns } from "@/features/sales";
import { Products, Stock } from "@/features/products";
import Customers from "@/features/customers";
import Suppliers from "@/features/suppliers";
import Expenses from "@/features/expenses";
import Employees from "@/features/hr/pages/employees";
import Attendance from "@/features/hr/pages/attendance";
import Payroll from "@/features/hr/pages/payroll";
import Users from "@/features/users/pages/users";
import Roles from "@/features/users/pages/roles";
import ActivityLogs from "@/features/users/pages/activity-logs";
import Notifications from "@/features/users/pages/notifications";
import Settings from "@/features/settings";
import Categories, { Brands, Units } from "@/features/categories";
import Purchases from "@/features/purchases";
import AddPurchase from "@/features/purchases/pages/add-purchase";
import { Warehouses, StockManagement, StockTransfers, StockAdjustments } from "@/features/inventory";
import AddProduct from "@/features/products/pages/add-product";
import { BusinessProfile, Branches, Registers } from "@/features/business";
import { Payments, Accounts, Transactions, Reports } from "@/features/financial";
import CustomerLedgers from "@/features/customers/pages/customer-ledgers";
import SupplierLedgers from "@/features/suppliers/pages/supplier-ledgers";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      ) : !isAuthenticated ? (
        <>
          <Route path="/login" component={Login} />
          <Route path="/" component={Login} />
        </>
      ) : (
        <>
          {/* Allow access to login page even when authenticated for testing */}
          <Route path="/login" component={Login} />
          <Route path="/" component={Dashboard} />
          <Route path="/pos" component={POSTerminal} />
          <Route path="/products" component={Products} />
          <Route path="/products/add" component={AddProduct} />
          <Route path="/categories" component={Categories} />
          <Route path="/brands" component={Brands} />
          <Route path="/units" component={Units} />
          <Route path="/stock" component={Stock} />
          <Route path="/customers" component={Customers} />
          <Route path="/customer-ledgers" component={CustomerLedgers} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/supplier-ledgers" component={SupplierLedgers} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/purchases/add" component={AddPurchase} />
          <Route path="/sales" component={Sales} />
          <Route path="/returns" component={Returns} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/payments" component={Payments} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/reports" component={Reports} />
          <Route path="/employees" component={Employees} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/payroll" component={Payroll} />
          <Route path="/users" component={Users} />
          <Route path="/roles" component={Roles} />
          <Route path="/activity-logs" component={ActivityLogs} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/stock-management" component={StockManagement} />
          <Route path="/stock-transfers" component={StockTransfers} />
          <Route path="/stock-adjustments" component={StockAdjustments} />
          <Route path="/business-profile" component={BusinessProfile} />
          <Route path="/branches" component={Branches} />
          <Route path="/registers" component={Registers} />
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
