import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, UserCheck, Eye, Phone, Mail, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function Employees() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  const filteredEmployees = employees.filter((employee: any) =>
    employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
              <p className="text-sm text-gray-500">Manage your team and HR records</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search employees..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              
              <Button className="bg-primary-500 text-white hover:bg-primary-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
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
              ))
            ) : filteredEmployees.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <UserCheck className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first employee"}
                </p>
                <Button className="bg-primary-500 text-white hover:bg-primary-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </div>
            ) : (
              filteredEmployees.map((employee: any) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {employee.position || 'No Position'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ID: {employee.id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {employee.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                      
                      {employee.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{employee.email}</span>
                        </div>
                      )}
                      
                      {employee.joinDate && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Joined: {format(new Date(employee.joinDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Status: Active
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}