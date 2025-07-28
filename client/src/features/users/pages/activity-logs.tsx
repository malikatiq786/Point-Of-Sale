import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import UserNav from "../components/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Activity, Search, Filter, Download, Calendar, User, Eye } from "lucide-react";

interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  action: string;
  ipAddress: string;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Mock data for demonstration
  const mockLogs: ActivityLog[] = [
    {
      id: 1,
      userId: 1,
      userName: "Malik Atiq",
      action: "User logged in",
      ipAddress: "192.168.1.100",
      createdAt: "2025-01-28T10:30:00Z"
    },
    {
      id: 2,
      userId: 1,
      userName: "Malik Atiq",
      action: "Created new user: Sarah Johnson",
      ipAddress: "192.168.1.100",
      createdAt: "2025-01-28T10:25:00Z"
    },
    {
      id: 3,
      userId: 2,
      userName: "Sarah Johnson",
      action: "Updated product: Nike Air Max",
      ipAddress: "192.168.1.105",
      createdAt: "2025-01-28T09:45:00Z"
    },
    {
      id: 4,
      userId: 3,
      userName: "Mike Wilson",
      action: "Processed sale transaction #1001",
      ipAddress: "192.168.1.110",
      createdAt: "2025-01-28T09:30:00Z"
    },
    {
      id: 5,
      userId: 1,
      userName: "Malik Atiq",
      action: "Accessed user management",
      ipAddress: "192.168.1.100",
      createdAt: "2025-01-28T09:15:00Z"
    }
  ];

  const getActionBadgeColor = (action: string) => {
    if (action.includes("login") || action.includes("logout")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else if (action.includes("Created") || action.includes("Added")) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (action.includes("Updated") || action.includes("Modified")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (action.includes("Deleted") || action.includes("Removed")) {
      return "bg-red-100 text-red-800 border-red-200";
    } else if (action.includes("Accessed") || action.includes("Viewed")) {
      return "bg-gray-100 text-gray-800 border-gray-200";
    } else {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);
    
    if (filterType === "all") return matchesSearch;
    
    const actionType = filterType.toLowerCase();
    return matchesSearch && log.action.toLowerCase().includes(actionType);
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage system users, roles, and permissions</p>
      </div>

      <UserNav />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
            <p className="text-sm text-gray-600">Monitor user activities and system access</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{mockLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Activities</p>
                <p className="text-2xl font-bold text-gray-900">{mockLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Login Sessions</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Activities</option>
                <option value="login">Login/Logout</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="accessed">Accessed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-white">
                    <Activity className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{log.userName}</p>
                      <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                        {log.action.split(':')[0]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{log.action}</p>
                    <p className="text-xs text-gray-500">IP: {log.ipAddress}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{formatDateTime(log.createdAt)}</p>
                  <p className="text-xs text-gray-500">#{log.id}</p>
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activity logs found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}