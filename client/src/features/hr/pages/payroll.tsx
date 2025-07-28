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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, Calendar, User, Plus, Eye, CheckCircle, Clock, CreditCard } from "lucide-react";

export default function Payroll() {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [payrollData, setPayrollData] = useState({
    employeeId: "",
    baseSalary: "",
    overtime: "0",
    bonuses: "0",
    deductions: "0",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payroll records
  const { data: payrollRecords = [], isLoading } = useQuery({
    queryKey: ["/api/payroll"],
    retry: false,
  });

  // Fetch employees for dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    retry: false,
  });

  const createPayrollMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create payroll record");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll record created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setShowCreateDialog(false);
      setPayrollData({
        employeeId: "",
        baseSalary: "",
        overtime: "0",
        bonuses: "0",
        deductions: "0",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payroll record",
        variant: "destructive",
      });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (payrollId: number) => {
      const response = await fetch(`/api/payroll/${payrollId}/process`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to process payment");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const filteredRecords = payrollRecords.filter((record: any) => {
    const matchesSearch = record.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.employeePosition?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = !monthFilter || `${record.year}-${record.month.toString().padStart(2, '0')}` === monthFilter;
    const matchesEmployee = !employeeFilter || employeeFilter === 'all' || record.employeeId === parseInt(employeeFilter);
    const matchesStatus = !statusFilter || statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesMonth && matchesEmployee && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const handleSubmitPayroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollData.employeeId || !payrollData.baseSalary) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createPayrollMutation.mutate(payrollData);
  };

  // Calculate summary statistics
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthRecords = filteredRecords.filter((r: any) => r.month === currentMonth && r.year === currentYear);
  const totalPayroll = currentMonthRecords.reduce((sum: number, r: any) => sum + parseFloat(r.netSalary || '0'), 0);
  const paidCount = currentMonthRecords.filter((r: any) => r.status === 'paid').length;
  const pendingCount = currentMonthRecords.filter((r: any) => r.status === 'pending').length;

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employee Payroll</h1>
        <p className="text-gray-600">Manage employee salaries and payment processing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-green-600">${totalPayroll.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid This Month</p>
                <p className="text-2xl font-bold text-blue-600">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-purple-600">{filteredRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search payroll records..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full sm:w-48"
        />

        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((employee: any) => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Generate Payroll
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Payroll Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payroll records found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || monthFilter || employeeFilter !== 'all' || statusFilter !== 'all' 
                  ? "Try adjusting your search criteria" 
                  : "No payroll records found for the selected period"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {record.employeeName}
                      </h3>
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusIcon(record.status)}
                        <span className="ml-1">{record.status.toUpperCase()}</span>
                      </Badge>
                      <div className="text-lg font-bold text-green-600">
                        ${parseFloat(record.netSalary || '0').toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {record.employeePosition || 'No Position'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {months.find(m => m.value === record.month)?.label} {record.year}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Base: ${parseFloat(record.baseSalary || '0').toFixed(2)}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Deductions:</span> ${parseFloat(record.deductions || '0').toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {record.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => processPaymentMutation.mutate(record.id)}
                        disabled={processPaymentMutation.isPending}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Process Payment
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payroll Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Employee Payroll</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPayroll} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={payrollData.employeeId} onValueChange={(value) => setPayrollData({ ...payrollData, employeeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Base Salary ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payrollData.baseSalary}
                  onChange={(e) => setPayrollData({ ...payrollData, baseSalary: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Overtime ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payrollData.overtime}
                  onChange={(e) => setPayrollData({ ...payrollData, overtime: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Bonuses ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payrollData.bonuses}
                  onChange={(e) => setPayrollData({ ...payrollData, bonuses: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Deductions ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payrollData.deductions}
                  onChange={(e) => setPayrollData({ ...payrollData, deductions: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={payrollData.month.toString()} onValueChange={(value) => setPayrollData({ ...payrollData, month: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={payrollData.year}
                  onChange={(e) => setPayrollData({ ...payrollData, year: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or comments"
                value={payrollData.notes}
                onChange={(e) => setPayrollData({ ...payrollData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPayrollMutation.isPending}>
                {createPayrollMutation.isPending ? "Generating..." : "Generate Payroll"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}