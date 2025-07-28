import { Link, useLocation } from "wouter";
import { Users, Shield, Activity, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const userNavItems: UserNavItem[] = [
  {
    name: "Users",
    href: "/users",
    icon: Users,
    description: "Manage system users"
  },
  {
    name: "Roles & Permissions",
    href: "/roles",
    icon: Shield,
    description: "Configure user roles and permissions"
  },
  {
    name: "Activity Logs",
    href: "/activity-logs",
    icon: Activity,
    description: "View user activity logs"
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    description: "System notifications"
  }
];

export default function UserNav() {
  const [location] = useLocation();

  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="User Management">
          {userNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  isActive
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        {userNavItems.find(item => location === item.href)?.description}
      </div>
    </div>
  );
}