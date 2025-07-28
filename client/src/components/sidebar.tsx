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
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  user: any;
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

export default function Sidebar({ user }: SidebarProps) {
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
        { name: "POS Terminal", href: "/pos", icon: ShoppingCart },
        { name: "Sales History", href: "/sales", icon: Receipt },
        { name: "Returns", href: "/returns", icon: RotateCcw },
      ]
    },
    {
      title: "INVENTORY",
      items: [
        { name: "Products", href: "/products", icon: Package },
        { name: "Categories", href: "/categories", icon: Tags },
        { name: "Stock Management", href: "/stock", icon: Warehouse },
        { name: "Stock Transfers", href: "/stock-transfers", icon: Truck },
        { name: "Stock Adjustments", href: "/stock-adjustments", icon: Package },
        { name: "Warehouses", href: "/warehouses", icon: Warehouse },
      ]
    },
    {
      title: "BUSINESS",
      items: [
        { name: "Customers", href: "/customers", icon: Users },
        { name: "Suppliers", href: "/suppliers", icon: Truck },
        { name: "Purchases", href: "/purchases", icon: ShoppingBag },
        { name: "Customer Ledgers", href: "/customer-ledgers", icon: CreditCard },
        { name: "Supplier Ledgers", href: "/supplier-ledgers", icon: CreditCard },
      ]
    },
    {
      title: "FINANCIAL",
      items: [
        { name: "Payments", href: "/payments", icon: CreditCard },
        { name: "Expenses", href: "/expenses", icon: DollarSign },
        { name: "Accounts", href: "/accounts", icon: CreditCard },
        { name: "Transactions", href: "/transactions", icon: Receipt },
        { name: "Reports", href: "/reports", icon: PieChart },
      ]
    },
    {
      title: "HUMAN RESOURCES",
      items: [
        { name: "Employees", href: "/employees", icon: UserCheck },
        { name: "Attendance", href: "/attendance", icon: Clock },
        { name: "Payroll", href: "/payroll", icon: Wallet },
      ]
    },
    {
      title: "BUSINESS SETUP",
      items: [
        { name: "Business Profile", href: "/business-profile", icon: Store },
        { name: "Branches", href: "/branches", icon: Store },
        { name: "Registers", href: "/registers", icon: ShoppingCart },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Users", href: "/users", icon: Shield },
        { name: "Roles & Permissions", href: "/roles", icon: Shield },
        { name: "Activity Logs", href: "/activity-logs", icon: Receipt },
        { name: "Notifications", href: "/notifications", icon: Receipt },
        { name: "Backups", href: "/backups", icon: Settings },
        { name: "Settings", href: "/settings", icon: Settings },
      ]
    }
  ];

  const isItemVisible = (item: NavItem) => {
    // Super Admin can see all modules
    if (user?.role?.name === "Super Admin") return true;
    
    // If no role restrictions, show to everyone
    if (!item.roles) return true;
    
    // Check if user's role is in the allowed roles
    return item.roles.includes(user?.role?.name || "");
  };

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0">
      {/* Logo & Brand */}
      <div className="flex items-center justify-center h-16 px-6 bg-gradient-to-r from-primary-500 to-secondary-500">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-500" />
          </div>
          <span className="text-xl font-bold text-white">Universal POS</span>
        </Link>
      </div>

      {/* User Role Badge */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-600">
              {user?.name?.charAt(0) || user?.firstName?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
            </p>
            <Badge variant="outline" className="text-xs bg-primary-50 text-primary-600 border-primary-200">
              {user?.role?.name || 'User'}
            </Badge>
          </div>
        </div>
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
                  {visibleItems.map((item) => (
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
                  ))}
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
          onClick={() => window.location.href = "/api/logout"}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}