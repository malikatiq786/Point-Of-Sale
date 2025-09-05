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
}

export default function Sidebar({ user, isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
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
        { name: "Sales POS", href: "/pos", icon: ShoppingCart, roles: ["Super Admin", "Admin/Owner", "Manager", "Cashier"] },
        { name: "Kitchen POS", href: "/kitchen-pos", icon: ChefHat, roles: ["Super Admin", "Admin/Owner", "Manager", "Kitchen Staff"] },
        { name: "Sales History", href: "/sales", icon: Receipt, roles: ["Super Admin", "Admin/Owner", "Manager", "Cashier"] },
        { name: "Returns", href: "/returns", icon: RotateCcw, roles: ["Super Admin", "Admin/Owner", "Manager"] },
      ]
    },
    {
      title: "INVENTORY",
      items: [
        { name: "Products", href: "/products", icon: Package, roles: ["Super Admin", "Admin/Owner", "Manager", "Warehouse Staff"] },
        { name: "Categories", href: "/categories", icon: Tags, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Brands", href: "/brands", icon: Package, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Units", href: "/units", icon: Package, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Stock Management", href: "/stock", icon: Warehouse, roles: ["Super Admin", "Admin/Owner", "Manager", "Warehouse Staff"] },
        { name: "Stock Transfers", href: "/stock-transfers", icon: Truck, roles: ["Super Admin", "Admin/Owner", "Manager", "Warehouse Staff"] },
        { name: "Stock Adjustments", href: "/stock-adjustments", icon: Package, roles: ["Super Admin", "Admin/Owner", "Manager", "Warehouse Staff"] },
        { name: "Barcode Management", href: "/barcodes", icon: QrCode, roles: ["Super Admin", "Admin/Owner", "Manager", "Warehouse Staff"] },
        { name: "Inventory Valuation", href: "/inventory/valuation", icon: TrendingUp, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Warehouses", href: "/warehouses", icon: Warehouse, roles: ["Super Admin", "Admin/Owner", "Manager", "Warehouse Staff"] },
      ]
    },
    {
      title: "BUSINESS",
      items: [
        { name: "Customers", href: "/customers", icon: Users, roles: ["Super Admin", "Admin/Owner", "Manager", "Cashier"] },
        { name: "Suppliers", href: "/suppliers", icon: Truck, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Purchases", href: "/purchases", icon: ShoppingBag, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Customer Ledgers", href: "/customer-ledgers", icon: CreditCard, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Supplier Ledgers", href: "/supplier-ledgers", icon: CreditCard, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
      ]
    },
    {
      title: "RESTAURANT MANAGEMENT",
      items: [
        { name: "Restaurant Management", href: "/restaurant-management", icon: Globe, roles: ["Super Admin", "Admin/Owner", "Manager"] },
      ]
    },
    {
      title: "FINANCIAL",
      items: [
        { name: "Payments", href: "/payments", icon: CreditCard, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Expenses", href: "/expenses", icon: DollarSign, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Accounts", href: "/accounts", icon: CreditCard, roles: ["Super Admin", "Admin/Owner", "Accountant"] },
        { name: "Transactions", href: "/transactions", icon: Receipt, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Reports", href: "/reports", icon: PieChart, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
        { name: "Profit & Loss Reports", href: "/reports/profit-loss", icon: TrendingUp, roles: ["Super Admin", "Admin/Owner", "Manager", "Accountant"] },
      ]
    },
    {
      title: "APPROVAL MANAGEMENT",
      items: [
        { name: "Pending Approvals", href: "/expenses?approvalStatus=pending", icon: AlertCircle, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Approval History", href: "/expenses?approvalStatus=approved", icon: CheckCircle, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Rejected Expenses", href: "/expenses?approvalStatus=rejected", icon: X, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Approval Workflows", href: "/expense-workflows", icon: FileText, roles: ["Super Admin", "Admin/Owner"] },
      ]
    },
    {
      title: "HUMAN RESOURCES",
      items: [
        { name: "Employees", href: "/employees", icon: UserCheck, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Attendance", href: "/attendance", icon: Clock, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Payroll", href: "/payroll", icon: Wallet, roles: ["Super Admin", "Admin/Owner", "Accountant"] },
      ]
    },
    {
      title: "BUSINESS SETUP",
      items: [
        { name: "Business Profile", href: "/business-profile", icon: Store, roles: ["Super Admin", "Admin/Owner"] },
        { name: "Branches", href: "/branches", icon: Store, roles: ["Super Admin", "Admin/Owner"] },
        { name: "Registers", href: "/registers", icon: ShoppingCart, roles: ["Super Admin", "Admin/Owner", "Manager"] },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Users", href: "/users", icon: Shield, roles: ["Super Admin"] },
        { name: "Roles & Permissions", href: "/roles", icon: Shield, roles: ["Super Admin"] },
        { name: "Activity Logs", href: "/activity-logs", icon: Receipt, roles: ["Super Admin", "Admin/Owner"] },
        { name: "Notifications", href: "/notifications", icon: Receipt, roles: ["Super Admin", "Admin/Owner", "Manager"] },
        { name: "Backups", href: "/backups", icon: Settings, roles: ["Super Admin"] },
        { name: "Settings", href: "/settings", icon: Settings, roles: ["Super Admin", "Admin/Owner"] },
      ]
    }
  ];

  const isItemVisible = (item: NavItem) => {
    // Get the user's role - it could be a string or an object with name property
    const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name;
    
    // Super Admin can see all modules
    if (userRole === "Super Admin") return true;
    
    // If no role restrictions, show to everyone
    if (!item.roles) return true;
    
    // Check if user's role is in the allowed roles
    return item.roles.includes(userRole || "");
  };

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>
      {/* Logo & Brand */}
      <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-primary-500 to-secondary-500">
        {/* Close button for mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden p-1 text-white hover:bg-white hover:bg-opacity-10 rounded"
        >
          <X className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center space-x-3 flex-1 lg:justify-center">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-500" />
          </div>
          <span className="text-lg lg:text-xl font-bold text-white">Universal POS</span>
        </Link>
      </div>


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
                    // Special handling for Sales POS to open in new tab
                    if (item.name === "Sales POS") {
                      return (
                        <Button
                          key={item.name}
                          variant={isActive(item.href) ? "default" : "ghost"}
                          className={`w-full justify-start px-4 py-3 ${
                            isActive(item.href) 
                              ? "bg-primary-500 text-white hover:bg-primary-600" 
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => window.open(item.href, '_blank')}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </Button>
                      );
                    }
                    
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