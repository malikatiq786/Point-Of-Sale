import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Package, AlertTriangle, UserPlus, Activity } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

interface ActivityData {
  id: number;
  action: string;
  createdAt: string;
  user: {
    name: string;
  } | null;
}

export default function RecentActivities() {
  const { toast } = useToast();

  const { data: activities = [], isLoading } = useQuery<ActivityData[]>({
    queryKey: ["/api/dashboard/activities"],
    retry: false,
  });

  const getActivityIcon = (action: string) => {
    if (action?.includes('sale')) return ShoppingCart;
    if (action?.includes('product') || action?.includes('inventory')) return Package;
    if (action?.includes('customer')) return UserPlus;
    if (action?.includes('stock') || action?.includes('low')) return AlertTriangle;
    return Activity;
  };

  const getActivityColor = (action: string) => {
    if (action?.includes('sale')) return "bg-success-100 text-success-600";
    if (action?.includes('product') || action?.includes('inventory')) return "bg-primary-100 text-primary-600";
    if (action?.includes('customer')) return "bg-secondary-100 text-secondary-600";
    if (action?.includes('stock') || action?.includes('low')) return "bg-warning-100 text-warning-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <Card className="shadow-soft border-0">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Recent Activities</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm px-2 sm:px-3">
            <span className="hidden sm:inline">View All</span>
            <span className="sm:hidden">All</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg animate-pulse">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => {
              const IconComponent = getActivityIcon(activity.action);
              const colorClasses = getActivityColor(activity.action);
              
              return (
                <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                    <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                    <p className="text-xs sm:text-sm text-gray-500">By {activity.user?.name || 'System'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Activity className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
            <p className="text-sm sm:text-base">No recent activities</p>
            <p className="text-xs sm:text-sm">Activities will appear here as they occur</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}