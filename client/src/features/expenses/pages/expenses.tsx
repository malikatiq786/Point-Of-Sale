import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from "@/layouts";
import { Plus, Filter, Download, Calendar, DollarSign, Users, TrendingUp, CheckCircle, XCircle, Eye, FileText, CreditCard, User, Clock, Hash, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ExpenseForm } from '../components/ExpenseForm';

interface Expense {
  id: number;
  expenseNumber: string;
  categoryId?: number;
  vendorId?: number;
  branchId?: number;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  description?: string;
  expenseDate: string;
  status: string;
  approvalStatus: string;
  paymentMethod: string;
  createdBy: string;
  createdAt: string;
  category?: { id: number; name: string };
  vendor?: { id: number; name: string };
  branch?: { id: number; name: string };
  creator?: { id: number; name: string };
}

interface ExpenseFilters {
  categoryId?: number;
  vendorId?: number;
  branchId?: number;
  status?: string;
  approvalStatus?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}

export default function ExpensesPage() {
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([]);
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: ExpenseFilters = {};
    
    if (urlParams.get('categoryId')) {
      initialFilters.categoryId = parseInt(urlParams.get('categoryId')!);
    }
    if (urlParams.get('vendorId')) {
      initialFilters.vendorId = parseInt(urlParams.get('vendorId')!);
    }
    if (urlParams.get('branchId')) {
      initialFilters.branchId = parseInt(urlParams.get('branchId')!);
    }
    if (urlParams.get('status')) {
      initialFilters.status = urlParams.get('status')!;
    }
    if (urlParams.get('approvalStatus')) {
      initialFilters.approvalStatus = urlParams.get('approvalStatus')!;
    }
    if (urlParams.get('paymentMethod')) {
      initialFilters.paymentMethod = urlParams.get('paymentMethod')!;
    }
    if (urlParams.get('startDate')) {
      initialFilters.startDate = urlParams.get('startDate')!;
    }
    if (urlParams.get('endDate')) {
      initialFilters.endDate = urlParams.get('endDate')!;
    }

    // Set filters if any URL parameters were found
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
      setShowFilters(true); // Show filters when they are applied via URL
    }
  }, []);

  // Fetch expenses
  const { data: expensesData, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['/api/expenses', filters],
    queryFn: async () => {
      // Convert filters to query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.categoryId) queryParams.set('categoryId', filters.categoryId.toString());
      if (filters.vendorId) queryParams.set('vendorId', filters.vendorId.toString());
      if (filters.branchId) queryParams.set('branchId', filters.branchId.toString());
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.approvalStatus) queryParams.set('approvalStatus', filters.approvalStatus);
      if (filters.paymentMethod) queryParams.set('paymentMethod', filters.paymentMethod);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      
      const url = queryParams.toString() ? `/api/expenses?${queryParams.toString()}` : '/api/expenses';
      
      const res = await fetch(url, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  // Fetch categories for filters
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/expense-categories'],
  });

  // Fetch vendors for filters
  const { data: vendors = [] } = useQuery({
    queryKey: ['/api/expense-vendors'],
  });

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/expense-dashboard/stats'],
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (expenseIds: number[]) =>
      apiRequest('POST', '/api/expenses/bulk-delete', { expenseIds }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Successfully deleted ${selectedExpenses.length} expense(s)`,
      });
      setSelectedExpenses([]);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expense-dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete expenses',
        variant: 'destructive',
      });
    },
  });

  // Approve expense mutation
  const approveExpenseMutation = useMutation({
    mutationFn: (expenseId: number) =>
      apiRequest('POST', `/api/expenses/${expenseId}/approve`, {}),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Expense approved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expense-dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to approve expense',
        variant: 'destructive',
      });
    },
  });

  // Reject expense mutation
  const rejectExpenseMutation = useMutation({
    mutationFn: (expenseId: number) =>
      apiRequest('POST', `/api/expenses/${expenseId}/reject`, {}),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Expense rejected successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expense-dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reject expense',
        variant: 'destructive',
      });
    },
  });

  const expenses = expensesData?.data || [];
  const expenseList = Array.isArray(expenses) ? expenses : [];
  const summary = expensesData?.summary || {};

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(expenseList.map((expenseItem: any) => {
        const expense = expenseItem.expense || expenseItem;
        return expense.id;
      }));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleSelectExpense = (expenseId: number, checked: boolean) => {
    if (checked) {
      setSelectedExpenses([...selectedExpenses, expenseId]);
    } else {
      setSelectedExpenses(selectedExpenses.filter(id => id !== expenseId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0) return;
    bulkDeleteMutation.mutate(selectedExpenses);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  };

  if (isLoadingExpenses) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading expenses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
            <p className="text-muted-foreground">
              Manage and track all business expenses
            </p>
          </div>
          <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateExpenseOpen} onOpenChange={setIsCreateExpenseOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-expense">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>
                  Create a new expense record for your business
                </DialogDescription>
              </DialogHeader>
              <div>
                <ExpenseForm
                  onSuccess={() => setIsCreateExpenseOpen(false)}
                  onCancel={() => setIsCreateExpenseOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardStats?.summary?.totalExpenses || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.summary?.totalCount || 0} expenses this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats?.statusBreakdown?.find((s: any) => s.status === 'pending')?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats?.topCategories?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardStats?.summary?.totalExpenses || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                vs last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.categoryId?.toString() || 'all'}
                  onValueChange={(value) => 
                    setFilters({...filters, categoryId: value === 'all' ? undefined : parseInt(value)})
                  }
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor</label>
                <Select
                  value={filters.vendorId?.toString() || 'all'}
                  onValueChange={(value) => 
                    setFilters({...filters, vendorId: value === 'all' ? undefined : parseInt(value)})
                  }
                >
                  <SelectTrigger data-testid="select-vendor">
                    <SelectValue placeholder="All vendors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All vendors</SelectItem>
                    {vendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.approvalStatus || 'all'}
                  onValueChange={(value) => 
                    setFilters({...filters, approvalStatus: value === 'all' ? undefined : value})
                  }
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select
                  value={filters.paymentMethod || 'all'}
                  onValueChange={(value) => 
                    setFilters({...filters, paymentMethod: value === 'all' ? undefined : value})
                  }
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                {summary.count || 0} total expenses, {formatCurrency(summary.total || 0)} total amount
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Expense #</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Vendor</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenseList.map((expenseItem: any) => {
                  const expense = expenseItem.expense || expenseItem;
                  const category = expenseItem.category || expense.category;
                  const vendor = expenseItem.vendor || expense.vendor;
                  return (
                  <tr key={expense.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium text-sm" data-testid={`text-expense-number-${expense.id}`}>
                      {expense.expenseNumber}
                    </td>
                    <td className="p-3 text-sm" data-testid={`text-expense-date-${expense.id}`}>
                      {formatDate(expense.expenseDate)}
                    </td>
                    <td className="p-3 text-sm" data-testid={`text-description-${expense.id}`}>
                      <div className="max-w-xs">
                        <div className="font-medium">{expense.description || '-'}</div>
                        {expense.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{expense.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm" data-testid={`text-category-${expense.id}`}>
                      {category?.name || '-'}
                    </td>
                    <td className="p-3 text-sm" data-testid={`text-vendor-${expense.id}`}>
                      {vendor?.name || '-'}
                    </td>
                    <td className="p-3 font-semibold text-sm" data-testid={`text-amount-${expense.id}`}>
                      {formatCurrency(expense.totalAmount)}
                    </td>
                    <td className="p-3" data-testid={`status-${expense.id}`}>
                      <Badge variant={getStatusBadgeVariant(expense.approvalStatus)} className="text-xs">
                        {expense.approvalStatus.charAt(0).toUpperCase() + expense.approvalStatus.slice(1)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingExpense({ ...expenseItem, expense, category, vendor })}
                          data-testid={`button-view-${expense.id}`}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs px-2 py-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {filters.approvalStatus === 'pending' && expense.approvalStatus === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveExpenseMutation.mutate(expense.id)}
                              disabled={approveExpenseMutation.isPending}
                              data-testid={`button-approve-${expense.id}`}
                              className="text-green-600 border-green-600 hover:bg-green-50 text-xs px-2 py-1"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectExpenseMutation.mutate(expense.id)}
                              disabled={rejectExpenseMutation.isPending}
                              data-testid={`button-reject-${expense.id}`}
                              className="text-red-600 border-red-600 hover:bg-red-50 text-xs px-2 py-1"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>

            {expenseList.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No expenses found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first expense to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Expense Dialog */}
      <Dialog open={!!viewingExpense} onOpenChange={() => setViewingExpense(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  Expense Details
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600 mt-2">
                  {viewingExpense?.expense?.expenseNumber}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={getStatusBadgeVariant(viewingExpense?.expense?.approvalStatus)} 
                  className="text-sm px-3 py-1"
                >
                  {viewingExpense?.expense?.approvalStatus?.charAt(0).toUpperCase() + viewingExpense?.expense?.approvalStatus?.slice(1)}
                </Badge>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(viewingExpense?.expense?.totalAmount || 0)}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {viewingExpense && (
            <div className="space-y-6">
              {/* Basic Information Card */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Hash className="h-4 w-4" />
                        Expense Number
                      </div>
                      <p className="font-semibold text-gray-900">{viewingExpense.expense.expenseNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Calendar className="h-4 w-4" />
                        Date
                      </div>
                      <p className="font-semibold text-gray-900">{formatDate(viewingExpense.expense.expenseDate)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Building2 className="h-4 w-4" />
                        Category
                      </div>
                      <p className="font-semibold text-gray-900">{viewingExpense.category?.name || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Building2 className="h-4 w-4" />
                        Vendor
                      </div>
                      <p className="font-semibold text-gray-900">{viewingExpense.vendor?.name || '-'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <DollarSign className="h-4 w-4" />
                        Amount
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(viewingExpense.expense.totalAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description Card */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Description & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Description</label>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{viewingExpense.expense.description || 'No description provided'}</p>
                    </div>
                  </div>
                  {viewingExpense.expense.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">Additional Notes</label>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-900">{viewingExpense.expense.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Information Card */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <CreditCard className="h-4 w-4" />
                        Payment Method
                      </div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {viewingExpense.expense.paymentMethod}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Hash className="h-4 w-4" />
                        Payment Reference
                      </div>
                      <p className="font-semibold text-gray-900">{viewingExpense.expense.paymentReference || '-'}</p>
                    </div>
                    {viewingExpense.expense.receiptNumber && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                          <FileText className="h-4 w-4" />
                          Receipt Number
                        </div>
                        <p className="font-semibold text-gray-900">{viewingExpense.expense.receiptNumber}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Audit Trail Card */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Created</h4>
                          <span className="text-sm text-gray-500">{formatDate(viewingExpense.expense.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Created by {viewingExpense.creator?.name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    
                    {viewingExpense.expense.approvedBy && (
                      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-green-900">Approved</h4>
                            <span className="text-sm text-green-600">{formatDate(viewingExpense.expense.approvedAt)}</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            Approved by Admin User
                          </p>
                        </div>
                      </div>
                    )}

                    {viewingExpense.expense.approvalStatus === 'rejected' && (
                      <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
                        <div className="p-2 bg-red-100 rounded-full">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-red-900">Rejected</h4>
                            <span className="text-sm text-red-600">{formatDate(viewingExpense.expense.approvedAt)}</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">
                            Rejected by Admin User
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}