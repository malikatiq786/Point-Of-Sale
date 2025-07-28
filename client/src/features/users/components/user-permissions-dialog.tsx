import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserPermissionsDialogProps {
  user: any;
  trigger?: React.ReactNode;
}

export default function UserPermissionsDialog({ user, trigger }: UserPermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ["/api/permissions"],
    retry: false,
  });

  // Fetch user's current permissions
  const { data: userPermissions = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "permissions"],
    enabled: !!user?.id && open,
    retry: false,
  });

  useEffect(() => {
    if (userPermissions.length > 0) {
      setSelectedPermissions(userPermissions.map((p: any) => p.id));
    }
  }, [userPermissions]);

  const updatePermissionsMutation = useMutation({
    mutationFn: (permissionIds: number[]) => apiRequest(`/api/users/${user.id}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissionIds }),
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePermissionsMutation.mutate(selectedPermissions);
  };

  const filteredPermissions = permissions.filter((permission: any) =>
    permission.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group permissions by category
  const groupedPermissions = filteredPermissions.reduce((acc: any, permission: any) => {
    const category = permission.name.split('.')[0];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'dashboard': 'bg-blue-100 text-blue-800',
      'users': 'bg-purple-100 text-purple-800',
      'products': 'bg-green-100 text-green-800',
      'sales': 'bg-orange-100 text-orange-800',
      'purchases': 'bg-pink-100 text-pink-800',
      'customers': 'bg-cyan-100 text-cyan-800',
      'accounting': 'bg-yellow-100 text-yellow-800',
      'warehouse': 'bg-gray-100 text-gray-800',
      'reports': 'bg-indigo-100 text-indigo-800',
      'settings': 'bg-red-100 text-red-800',
      'system': 'bg-slate-100 text-slate-800',
      'business_setup': 'bg-emerald-100 text-emerald-800',
      'inventory': 'bg-teal-100 text-teal-800',
      'financial': 'bg-amber-100 text-amber-800',
      'hr': 'bg-rose-100 text-rose-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Permissions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Manage Permissions for {user?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1">
              {user?.role?.name}
            </Badge>
            <span className="text-sm text-gray-500">
              {selectedPermissions.length} of {permissions.length} permissions selected
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]: [string, any]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(category)}>
                        {category.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({categoryPermissions.length} permissions)
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-gray-100">
                      {categoryPermissions.map((permission: any) => (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-medium text-gray-900 cursor-pointer"
                            >
                              {permission.name}
                            </label>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {permission.name.split('.').slice(1).join(' ').replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updatePermissionsMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {updatePermissionsMutation.isPending ? "Updating..." : "Update Permissions"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}