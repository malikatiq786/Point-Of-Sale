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
import { Search, User, Calendar, DollarSign, Plus, TrendingUp, TrendingDown, FileText, Eye } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function CustomerLedgers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    customerId: "",
    amount: "",
    type: "debit",
    reference: "",
    description: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrencyValue } = useCurrency();

  // Fetch customer ledgers
  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ["/api/customer-ledgers"],
    retry: false,
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    retry: false,
  });

  const createLedgerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/customer-ledgers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create ledger entry");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer ledger entry created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-ledgers"] });
      setShowCreateDialog(false);
      setLedgerData({
        customerId: "",
        amount: "",
        type: "debit",
        reference: "",
        description: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ledger entry",
        variant: "destructive",
      });
    },
  });

  const filteredLedgers = ledgers.filter((ledger: any) => {
    const matchesSearch = ledger.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ledger.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ledger.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || ledger.date?.startsWith(dateFilter);
    const matchesCustomer = !customerFilter || customerFilter === 'all' || ledger.customerId === parseInt(customerFilter);
    const matchesType = !typeFilter || typeFilter === 'all' || ledger.type === typeFilter;
    
    return matchesSearch && matchesDate && matchesCustomer && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'debit':
        return 'bg-red-100 text-red-800';
      case 'credit':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'debit' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />;
  };

  const handleSubmitLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerData.customerId || !ledgerData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createLedgerMutation.mutate(ledgerData);
  };

  // Calculate running balances for each ledger entry
  const ledgersWithBalance = filteredLedgers
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((ledger: any, index: number, sortedLedgers: any[]) => {
      // Calculate running balance up to this point
      let runningBalance = 0;
      for (let i = 0; i <= index; i++) {
        const entry = sortedLedgers[i];
        const amount = parseFloat(entry.amount || '0');
        if (entry.type === 'debit') {
          runningBalance += amount; // Debit increases what customer owes
        } else {
          runningBalance -= amount; // Credit reduces what customer owes
        }
      }
      
      return {
        ...ledger,
        runningBalance: runningBalance
      };
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Show newest first

  // Calculate summary statistics
  const totalDebit = filteredLedgers
    .filter((l: any) => l.type === 'debit')
    .reduce((sum: number, l: any) => sum + parseFloat(l.amount || '0'), 0);

  const totalCredit = filteredLedgers
    .filter((l: any) => l.type === 'credit')
    .reduce((sum: number, l: any) => sum + parseFloat(l.amount || '0'), 0);

  const balance = totalDebit - totalCredit; // Positive = customer owes, Negative = customer credit

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Ledgers</h1>
        <p className="text-gray-600">Track customer account activities and outstanding balances</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Debit</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrencyValue(totalDebit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Credit</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrencyValue(totalCredit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className={`w-8 h-8 ${balance <= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${balance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyValue(Math.abs(balance))} {balance > 0 ? '(DR)' : balance < 0 ? '(CR)' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search ledger entries..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-48"
        />

        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="debit">Debit</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Customer Ledger History
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
          ) : ledgersWithBalance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ledger entries found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter || customerFilter !== 'all' || typeFilter !== 'all' 
                  ? "Try adjusting your search criteria" 
                  : "No ledger entries recorded yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reference</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Debit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Credit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgersWithBalance.map((ledger: any) => (
                    <tr key={ledger.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {ledger.date ? new Date(ledger.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {ledger.customerName || 'Unknown Customer'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {ledger.reference || 'No reference'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {ledger.description || 'No description'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {ledger.type === 'debit' ? (
                          <span className="font-medium text-red-600">
                            ${parseFloat(ledger.amount || '0').toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {ledger.type === 'credit' ? (
                          <span className="font-medium text-green-600">
                            ${parseFloat(ledger.amount || '0').toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end">
                          <span className={`font-medium ${ledger.runningBalance > 0 ? 'text-red-600' : ledger.runningBalance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            ${Math.abs(ledger.runningBalance).toFixed(2)}
                          </span>
                          {ledger.runningBalance > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-600 border-red-200">DR</Badge>
                          )}
                          {ledger.runningBalance < 0 && (
                            <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-600 border-green-200">CR</Badge>
                          )}
                          {ledger.runningBalance === 0 && (
                            <Badge variant="outline" className="ml-2 text-xs bg-gray-50 text-gray-600 border-gray-200">Balanced</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ledger Entry Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Customer Ledger Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLedger} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={ledgerData.customerId} onValueChange={(value) => setLedgerData({ ...ledgerData, customerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={ledgerData.amount}
                  onChange={(e) => setLedgerData({ ...ledgerData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entry Type</Label>
                <Select value={ledgerData.type} onValueChange={(value) => setLedgerData({ ...ledgerData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit (Customer Owes)</SelectItem>
                    <SelectItem value="credit">Credit (Customer Paid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  type="text"
                  placeholder="Transaction reference"
                  value={ledgerData.reference}
                  onChange={(e) => setLedgerData({ ...ledgerData, reference: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter description for this ledger entry"
                value={ledgerData.description}
                onChange={(e) => setLedgerData({ ...ledgerData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLedgerMutation.isPending}>
                {createLedgerMutation.isPending ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}