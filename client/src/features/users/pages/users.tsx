import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import UserNav from "../components/user-nav";
import AddUserDialog from "../components/add-user-dialog";
import UserPermissionsDialog from "../components/user-permissions-dialog";
import EditUserDialog from "../components/edit-user-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Edit, Trash2, Users, Shield, UserPlus, Settings } from "lucide-react";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users with roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Fetch roles for dropdowns
  const { data: roles = [] } = useQuery({
    queryKey: ["/api/roles"],
    retry: false,
  });

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "Super Admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "Admin / Owner":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cashier":
        return "bg-green-100 text-green-800 border-green-200";
      case "Accountant":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Warehouse Staff":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage system users, roles, and permissions</p>
      </div>

      <UserNav />



      <div className="flex items-center justify-between mb-6">
        <div className="relative w-96">
          <Input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            <Shield className="w-4 h-4 mr-2" />
            Manage Roles
          </Button>
          <AddUserDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            System Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.firstName && user.lastName && (
                        <p className="text-xs text-gray-500">{user.firstName} {user.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getRoleBadgeColor(user.role?.name || '')} text-xs font-medium`}>
                      {user.role?.name || 'No Role'}
                    </Badge>
                    
                    <div className="flex space-x-2">
                      <EditUserDialog user={user} />
                      
                      <UserPermissionsDialog user={user} />
                      
                      {user.role?.name !== "Super Admin" && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first user'}
              </p>
              <AddUserDialog />
            </div>
          )}
        </CardContent>
      </Card>


    </AppLayout>
  );
}