import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import POSTerminal from "@/pages/pos-terminal";
import Products from "@/pages/products";
import Customers from "@/pages/customers";
import Sales from "@/pages/sales";
import Suppliers from "@/pages/suppliers";
import Expenses from "@/pages/expenses";
import Employees from "@/pages/employees";
import Settings from "@/pages/settings";
import Categories from "@/pages/categories";
import Stock from "@/pages/stock";
import Purchases from "@/pages/purchases";

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
          <Route path="/categories" component={Categories} />
          <Route path="/stock" component={Stock} />
          <Route path="/customers" component={Customers} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/purchases" component={Purchases} />
          <Route path="/sales" component={Sales} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/employees" component={Employees} />
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
