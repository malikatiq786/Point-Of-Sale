import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  BarChart3, 
  ShoppingCart, 
  Receipt, 
  RotateCcw, 
  Package, 
  Tags, 
  Warehouse, 
  Users, 
  Truck, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  PieChart, 
  UserCheck, 
  Clock, 
  Wallet, 
  Shield,
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  ChefHat,
  Globe,
  Car,
  CheckCircle,
  FileText,
  AlertCircle,
  TrendingUp,
  QrCode
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  user: any;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
  permissions?: string[];
}

export default function Sidebar({ user, isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { hasAnyPermission, canAccessModule } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "POINT OF SALE", 
    "INVENTORY", 
    "BUSINESS"
  ]);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const navSections: NavSection[] = [
    {
      title: "POINT OF SALE",
      items: [
        { name: "Sales POS", href: "/pos", icon: ShoppingCart, permissions: ["sales.create", "pos.access"] },
        { name: "Kitchen POS", href: "/kitchen-pos", icon: ChefHat, permissions: ["kitchen.access"] },
        { name: "Sales History", href: "/sales", icon: Receipt, permissions: ["sales.view"] },
        { name: "Returns", href: "/returns", icon: RotateCcw, permissions: ["returns.view", "returns.create"] },
      ]
    },
    {
      title: "INVENTORY",
      items: [
        { name: "Products", href: "/products", icon: Package, permissions: ["products.view"] },
        { name: "Categories", href: "/categories", icon: Tags, permissions: ["categories.view", "categories.manage"] },
        { name: "Brands", href: "/brands", icon: Package, permissions: ["brands.view", "brands.manage"] },
        { name: "Units", href: "/units", icon: Package, permissions: ["units.view", "units.manage"] },
        { name: "Stock Management", href: "/stock", icon: Warehouse, permissions: ["products.manage_stock"] },
        { name: "Stock Transfers", href: "/stock-transfers", icon: Truck, permissions: ["inventory.manage_stock_transfers"] },
        { name: "Stock Adjustments", href: "/stock-adjustments", icon: Package, permissions: ["inventory.manage_stock_adjustments"] },
        { name: "Barcode Management", href: "/barcodes", icon: QrCode, permissions: ["products.view"] },
        { name: "Inventory Valuation", href: "/inventory/valuation", icon: TrendingUp, permissions: ["reports.view_inventory"] },
        { name: "Warehouses", href: "/warehouses", icon: Warehouse, permissions: ["inventory.manage_warehouses"] },
      ]
    },
    {
      title: "BUSINESS",
      items: [
        { name: "Customers", href: "/customers", icon: Users, permissions: ["customers.view"] },
        { name: "Suppliers", href: "/suppliers", icon: Truck, permissions: ["suppliers.view"] },
        { name: "Purchases", href: "/purchases", icon: ShoppingBag, permissions: ["purchases.view"] },
        { name: "Customer Ledgers", href: "/customer-ledgers", icon: CreditCard, permissions: ["customers.view_ledger"] },
        { name: "Supplier Ledgers", href: "/supplier-ledgers", icon: CreditCard, permissions: ["suppliers.view_ledger"] },
      ]
    },
    {
      title: "RESTAURANT MANAGEMENT",
      items: [
        { name: "Restaurant Management", href: "/restaurant-management", icon: Globe, permissions: ["kitchen.access"] },
      ]
    },
    {
      title: "FINANCIAL",
      items: [
        { name: "Payments", href: "/payments", icon: CreditCard, permissions: ["accounting.manage_payments"] },
        { name: "Expenses", href: "/expenses", icon: DollarSign, permissions: ["expenses.view"] },
        { name: "Accounts", href: "/accounts", icon: CreditCard, permissions: ["accounting.manage_accounts", "financial.manage_accounts"] },
        { name: "Transactions", href: "/transactions", icon: Receipt, permissions: ["financial.manage_transactions"] },
        { name: "Reports", href: "/reports", icon: PieChart, permissions: ["accounting.view_reports", "reports.view_sales", "reports.view_financial"] },
        { name: "Profit & Loss Reports", href: "/reports/profit-loss", icon: TrendingUp, permissions: ["accounting.view_reports", "reports.view_financial"] },
      ]
    },
    {
      title: "APPROVAL MANAGEMENT",
      items: [
        { name: "Pending Approvals", href: "/expenses?approvalStatus=pending", icon: AlertCircle, permissions: ["expenses.approve"] },
        { name: "Approval History", href: "/expenses?approvalStatus=approved", icon: CheckCircle, permissions: ["expenses.approve"] },
        { name: "Rejected Expenses", href: "/expenses?approvalStatus=rejected", icon: X, permissions: ["expenses.approve"] },
        { name: "Approval Workflows", href: "/expense-workflows", icon: FileText, permissions: ["expenses.approve"] },
      ]
    },
    {
      title: "HUMAN RESOURCES",
      items: [
        { name: "Employees", href: "/employees", icon: UserCheck, permissions: ["hr.manage_employees"] },
        { name: "Attendance", href: "/attendance", icon: Clock, permissions: ["hr.manage_attendance"] },
        { name: "Payroll", href: "/payroll", icon: Wallet, permissions: ["hr.manage_payroll"] },
      ]
    },
    {
      title: "BUSINESS SETUP",
      items: [
        { name: "Business Profile", href: "/business-profile", icon: Store, permissions: ["business_setup.manage_profile"] },
        { name: "Branches", href: "/branches", icon: Store, permissions: ["business_setup.manage_branches"] },
        { name: "Registers", href: "/registers", icon: ShoppingCart, permissions: ["business_setup.manage_registers"] },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Users", href: "/users", icon: Shield, permissions: ["users.view", "users.manage_roles"] },
        { name: "Roles & Permissions", href: "/roles", icon: Shield, permissions: ["users.manage_roles", "users.manage_permissions"] },
        { name: "Activity Logs", href: "/activity-logs", icon: Receipt, permissions: ["users.view"] },
        { name: "Notifications", href: "/notifications", icon: Receipt, permissions: ["dashboard.view"] },
        { name: "Backups", href: "/backups", icon: Settings, permissions: ["settings.edit"] },
        { name: "Settings", href: "/settings", icon: Settings, permissions: ["settings.view", "settings.edit"] },
      ]
    }
  ];

  const isItemVisible = (item: NavItem) => {
    // Get the user's role - it could be a string or an object with name property
    const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
    
    // Super Admin can see all modules
    if (userRole === "Super Admin") return true;
    
    // Check permissions first (newer system)
    if (item.permissions && item.permissions.length > 0) {
      return hasAnyPermission(...item.permissions);
    }
    
    // Fallback to role-based visibility (legacy)
    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(userRole || "");
    }
    
    // If no restrictions, show to everyone
    return true;
  };

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>


      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Dashboard */}
        <Link href="/">
          <Button
            variant={isActive("/") && location === "/" ? "default" : "ghost"}
            className={`w-full justify-start px-4 py-3 ${
              isActive("/") && location === "/" 
                ? "bg-primary-500 text-white hover:bg-primary-600" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Button>
        </Link>

        {/* Navigation Sections */}
        {navSections.map((section) => {
          const visibleItems = section.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          const isExpanded = expandedSections.includes(section.title);

          return (
            <div key={section.title} className="pt-4">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                <span>{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
              
              {isExpanded && (
                <div className="mt-2 space-y-1">
                  {visibleItems.map((item) => {
                    
                    // Regular navigation for other items
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive(item.href) ? "default" : "ghost"}
                          className={`w-full justify-start px-4 py-3 ${
                            isActive(item.href) 
                              ? "bg-primary-500 text-white hover:bg-primary-600" 
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}


      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-3 text-gray-700 hover:bg-gray-100"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              });
              window.location.reload();
            } catch (error) {
              window.location.href = "/api/auth/logout";
            }
          }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}