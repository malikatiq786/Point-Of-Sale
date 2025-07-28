import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, UserCheck, Eye, Phone, Mail, Briefcase, Calendar, User } from "lucide-react";

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [employeeData, setEmployeeData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    salary: "",
    hireDate: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create employee");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowCreateDialog(false);
      setEmployeeData({
        name: "",
        email: "",
        phone: "",
        position: "",
        salary: "",
        hireDate: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const filteredEmployees = employees.filter((employee: any) => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = !positionFilter || positionFilter === 'all' || employee.position === positionFilter;
    
    return matchesSearch && matchesPosition;
  });

  const handleSubmitEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeData.name || !employeeData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createEmployeeMutation.mutate(employeeData);
  };

  // Get unique positions for filter
  const positions = [...new Set(employees.map((emp: any) => emp.position).filter(Boolean))];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <p className="text-gray-600">Manage your team and HR records</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search employees..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Positions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {positions.map((position: string) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Employee Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || positionFilter !== 'all' 
                  ? "Try adjusting your search criteria" 
                  : "No employees registered yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee: any) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{employee.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {employee.position || 'No Position'}
                        </Badge>
                      </div>
                      <UserCheck className="w-8 h-8 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-gray-600">
                      {employee.email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {employee.email}
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {employee.phone}
                        </div>
                      )}
                      {employee.hireDate && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          Joined: {new Date(employee.hireDate).toLocaleDateString()}
                        </div>
                      )}
                      {employee.salary && (
                        <div className="flex items-center">
                          <span className="font-medium text-green-600">
                            ${parseFloat(employee.salary).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  type="text"
                  placeholder="Enter full name"
                  value={employeeData.name}
                  onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={employeeData.phone}
                  onChange={(e) => setEmployeeData({ ...employeeData, phone: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  type="text"
                  placeholder="Enter job position"
                  value={employeeData.position}
                  onChange={(e) => setEmployeeData({ ...employeeData, position: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Salary ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={employeeData.salary}
                  onChange={(e) => setEmployeeData({ ...employeeData, salary: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Hire Date</Label>
                <Input
                  type="date"
                  value={employeeData.hireDate}
                  onChange={(e) => setEmployeeData({ ...employeeData, hireDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEmployeeMutation.isPending}>
                {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}