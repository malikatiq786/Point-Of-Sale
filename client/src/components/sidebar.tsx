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
      ]
    },
    {
      title: "BUSINESS",
      items: [
        { name: "Customers", href: "/customers", icon: Users },
        { name: "Suppliers", href: "/suppliers", icon: Truck },
        { name: "Purchases", href: "/purchases", icon: ShoppingBag },
      ]
    },
    {
      title: "FINANCIAL",
      items: [
        { name: "Payments", href: "/payments", icon: CreditCard },
        { name: "Expenses", href: "/expenses", icon: DollarSign },
        { name: "Reports", href: "/reports", icon: PieChart },
      ]
    },
    {
      title: "HUMAN RESOURCES",
      items: [
        { name: "Employees", href: "/employees", icon: UserCheck, roles: ["Super Admin", "Admin", "HR"] },
        { name: "Attendance", href: "/attendance", icon: Clock, roles: ["Super Admin", "Admin", "HR"] },
        { name: "Payroll", href: "/payroll", icon: Wallet, roles: ["Super Admin", "Admin", "HR"] },
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { name: "Users", href: "/users", icon: Shield, roles: ["Super Admin", "Admin / Owner"] },
        { name: "Settings", href: "/settings", icon: Settings },
      ]
    }
  ];

  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
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
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
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

        {/* Settings */}
        <div className="pt-4">
          <Link href="/settings">
            <Button
              variant={isActive("/settings") ? "default" : "ghost"}
              className={`w-full justify-start px-4 py-3 ${
                isActive("/settings") 
                  ? "bg-primary-500 text-white hover:bg-primary-600" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Button>
          </Link>
        </div>
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