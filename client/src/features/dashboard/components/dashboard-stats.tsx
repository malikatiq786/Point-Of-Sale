import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, AlertTriangle, Users, TrendingUp, TrendingDown } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

interface DashboardStatsData {
  todaySales: string;
  totalProducts: number;
  lowStock: number;
  activeCustomers: number;
}

export default function DashboardStats() {
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<DashboardStatsData>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const statCards = [
    {
      title: "Today's Sales",
      value: stats?.todaySales || "$0",
      change: "+12.5%",
      changeType: "increase" as const,
      icon: DollarSign,
      bgColor: "bg-success-100",
      iconColor: "text-success-600",
      description: "vs yesterday"
    },
    {
      title: "Total Products",
      value: stats?.totalProducts?.toLocaleString() || "0",
      change: "+8.2%",
      changeType: "increase" as const,
      icon: Package,
      bgColor: "bg-primary-100",
      iconColor: "text-primary-600",
      description: "this month"
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStock?.toString() || "0",
      change: "Attention",
      changeType: "warning" as const,
      icon: AlertTriangle,
      bgColor: "bg-warning-100",
      iconColor: "text-warning-600",
      description: "needs restock"
    },
    {
      title: "Active Customers",
      value: stats?.activeCustomers?.toLocaleString() || "0",
      change: "+15.3%",
      changeType: "increase" as const,
      icon: Users,
      bgColor: "bg-secondary-100",
      iconColor: "text-secondary-600",
      description: "this month"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={stat.title} className="shadow-soft border-0 hover:shadow-md transition-shadow duration-200 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {isLoading ? (
                    <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stat.value
                  )}
                </p>
                <div className="mt-2 flex items-center text-sm">
                  <span className={`px-2 py-1 rounded-full flex items-center ${
                    stat.changeType === "increase" 
                      ? "text-success-600 bg-success-50" 
                      : stat.changeType === "warning"
                      ? "text-warning-600 bg-warning-50"
                      : "text-error-600 bg-error-50"
                  }`}>
                    {stat.changeType === "increase" && <TrendingUp className="w-3 h-3 mr-1" />}
                    {stat.changeType === "decrease" && <TrendingDown className="w-3 h-3 mr-1" />}
                    {stat.changeType === "warning" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {stat.change}
                  </span>
                  <span className="text-gray-500 ml-2">{stat.description}</span>
                </div>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}