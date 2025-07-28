import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/layouts";
import UserNav from "../components/user-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users, Search, Plus, Edit, Trash2 } from "lucide-react";

export default function RolesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch roles and permissions
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
    retry: false,
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["/api/permissions"],
    retry: false,
  });

  const getRoleUserCount = (roleId: number) => {
    // This would typically come from the API
    const counts: { [key: number]: number } = {
      1: 1, // Super Admin
      2: 1, // Admin/Owner
      3: 1, // Manager
      4: 1, // Cashier
      5: 0, // Accountant
      6: 0, // Warehouse Staff
    };
    return counts[roleId] || 0;
  };

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

  const filteredRoles = roles.filter((role: any) =>
    role.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage system users, roles, and permissions</p>
      </div>

      <UserNav />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roles Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Roles</h2>
              <p className="text-sm text-gray-600">Configure user roles and their access levels</p>
            </div>
            <Button className="bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {rolesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading roles...</p>
              </div>
            ) : (
              filteredRoles.map((role: any) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-primary-100">
                          <Shield className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                            <Badge
                              variant="outline"
                              className={getRoleBadgeColor(role.name)}
                            >
                              {role.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Users className="w-4 h-4 mr-1" />
                            {getRoleUserCount(role.id)} users assigned
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {role.name !== "Super Admin" && (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Permissions Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Permissions</h2>
              <p className="text-sm text-gray-600">Available permissions across the system</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading permissions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group permissions by category */}
                  {[
                    "Dashboard",
                    "Users",
                    "Products",
                    "Sales",
                    "Purchases",
                    "Customers",
                    "Suppliers",
                    "Accounting",
                    "Warehouse",
                    "Settings",
                    "Reports"
                  ].map((category) => {
                    const categoryPermissions = permissions.filter((perm: any) =>
                      perm.name.toLowerCase().startsWith(category.toLowerCase())
                    );
                    
                    if (categoryPermissions.length === 0) return null;
                    
                    return (
                      <div key={category} className="border-l-4 border-primary-200 pl-4">
                        <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                        <div className="space-y-1">
                          {categoryPermissions.map((permission: any) => (
                            <div key={permission.id} className="flex items-center justify-between py-1">
                              <span className="text-sm text-gray-600">{permission.name}</span>
                              <Badge variant="outline" className="text-xs">
                                ID: {permission.id}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {permissions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No permissions available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}