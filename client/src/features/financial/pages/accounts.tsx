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
import { Search, Folder, Plus, DollarSign, TrendingUp, TrendingDown, Building2 } from "lucide-react";

export default function Accounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [accountData, setAccountData] = useState({
    name: "",
    accountType: "asset",
    accountCode: "",
    description: "",
    openingBalance: "0.00",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create account");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setShowCreateDialog(false);
      setAccountData({
        name: "",
        accountType: "asset",
        accountCode: "",
        description: "",
        openingBalance: "0.00",
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const filteredAccounts = accounts.filter((account: any) =>
    (account.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     account.accountCode?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!typeFilter || typeFilter === 'all' || account.accountType === typeFilter)
  );

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset':
        return 'bg-green-100 text-green-800';
      case 'liability':
        return 'bg-red-100 text-red-800';
      case 'equity':
        return 'bg-blue-100 text-blue-800';
      case 'revenue':
        return 'bg-purple-100 text-purple-800';
      case 'expense':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return <TrendingUp className="w-4 h-4" />;
      case 'liability':
        return <TrendingDown className="w-4 h-4" />;
      case 'equity':
        return <Building2 className="w-4 h-4" />;
      case 'revenue':
        return <DollarSign className="w-4 h-4" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const handleSubmitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountData.name || !accountData.accountCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createAccountMutation.mutate(accountData);
  };

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((groups: any, account: any) => {
    const type = account.accountType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {});

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <p className="text-gray-600">Manage your business accounting structure</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search accounts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="asset">Assets</SelectItem>
            <SelectItem value="liability">Liabilities</SelectItem>
            <SelectItem value="equity">Equity</SelectItem>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedAccounts).length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || typeFilter ? "Try adjusting your search criteria" : "Create your first account to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedAccounts).map(([type, accounts]: [string, any]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getAccountTypeIcon(type)}
                  <span className="ml-2 capitalize">{type}s</span>
                  <Badge className={`ml-2 ${getAccountTypeColor(type)}`}>
                    {(accounts as any[]).length} accounts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(accounts as any[]).map((account: any) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {account.accountCode} - {account.name}
                          </h3>
                          {!account.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Balance: ${parseFloat(account.currentBalance || account.openingBalance || '0').toFixed(2)}
                          </div>
                          <div className="flex items-center">
                            <Folder className="w-4 h-4 mr-2" />
                            Type: {account.accountType}
                          </div>
                          {account.description && (
                            <div className="col-span-2 md:col-span-1">
                              <span className="font-medium">Description:</span> {account.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          View Ledger
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  placeholder="e.g., Cash in Hand, Accounts Receivable"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Account Code *</Label>
                <Input
                  value={accountData.accountCode}
                  onChange={(e) => setAccountData({ ...accountData, accountCode: e.target.value })}
                  placeholder="e.g., 1001, 2001"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select value={accountData.accountType} onValueChange={(value) => setAccountData({ ...accountData, accountType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Opening Balance ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={accountData.openingBalance}
                  onChange={(e) => setAccountData({ ...accountData, openingBalance: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={accountData.description}
                onChange={(e) => setAccountData({ ...accountData, description: e.target.value })}
                placeholder="Account description or purpose"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}