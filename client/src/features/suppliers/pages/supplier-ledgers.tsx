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
import { Search, Truck, Calendar, DollarSign, Plus, TrendingUp, TrendingDown, FileText, Eye, Printer } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function SupplierLedgers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [ledgerData, setLedgerData] = useState({
    supplierId: "",
    amount: "",
    type: "debit",
    reference: "",
    description: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrencyValue } = useCurrency();

  // Fetch supplier ledgers
  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-ledgers"],
    retry: false,
  });

  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    retry: false,
  });

  const createLedgerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/supplier-ledgers", {
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
        description: "Supplier ledger entry created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-ledgers"] });
      setShowCreateDialog(false);
      setLedgerData({
        supplierId: "",
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
    const matchesSearch = ledger.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ledger.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ledger.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = (!dateFilter || ledger.date?.startsWith(dateFilter)) &&
                        (!fromDate || new Date(ledger.date) >= new Date(fromDate)) &&
                        (!toDate || new Date(ledger.date) <= new Date(toDate));
    const matchesSupplier = !supplierFilter || supplierFilter === 'all' || ledger.supplierId === parseInt(supplierFilter);
    const matchesType = !typeFilter || typeFilter === 'all' || ledger.type === typeFilter;
    
    return matchesSearch && matchesDate && matchesSupplier && matchesType;
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
    return type === 'debit' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const handleSubmitLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerData.supplierId || !ledgerData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createLedgerMutation.mutate(ledgerData);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Generate the table content with proper formatting
      const tableRows = filteredLedgers.map((ledger: any) => `
        <tr>
          <td>${ledger.date ? new Date(ledger.date).toLocaleDateString() : 'N/A'}</td>
          <td><span style="margin-right: 8px;">🚛</span>${ledger.supplierName || 'Unknown Supplier'}</td>
          <td>${ledger.reference || 'No reference'}</td>
          <td>${ledger.description || 'No description'}</td>
          <td style="text-align: right; color: ${ledger.type === 'debit' ? '#dc2626' : '#666'}; font-weight: ${ledger.type === 'debit' ? 'bold' : 'normal'};">
            ${ledger.type === 'debit' ? `Rs${parseFloat(ledger.amount || '0').toFixed(2)}` : '-'}
          </td>
          <td style="text-align: right; color: ${ledger.type === 'credit' ? '#16a34a' : '#666'}; font-weight: ${ledger.type === 'credit' ? 'bold' : 'normal'};">
            ${ledger.type === 'credit' ? `Rs${parseFloat(ledger.amount || '0').toFixed(2)}` : '-'}
          </td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Supplier Ledger History</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 20px; 
                color: #374151;
                line-height: 1.4;
              }
              .header {
                display: flex;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e5e7eb;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
                color: #111827;
              }
              .header-icon {
                margin-right: 12px;
                font-size: 20px;
              }
              .summary {
                display: flex;
                gap: 30px;
                margin-bottom: 30px;
                flex-wrap: wrap;
              }
              .summary-card {
                padding: 16px 20px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                background-color: #f9fafb;
                min-width: 180px;
              }
              .summary-card .label {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 4px;
              }
              .summary-card .value {
                font-size: 20px;
                font-weight: bold;
              }
              .debit-value { color: #dc2626; }
              .credit-value { color: #16a34a; }
              .balance-value { color: ${balance >= 0 ? '#dc2626' : '#16a34a'}; }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                font-size: 14px;
              }
              th {
                background-color: #f3f4f6;
                color: #374151;
                font-weight: 600;
                padding: 12px 8px;
                text-align: left;
                border: 1px solid #d1d5db;
              }
              td {
                padding: 10px 8px;
                border: 1px solid #e5e7eb;
                vertical-align: middle;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              tr:hover {
                background-color: #f3f4f6;
              }
              .text-right { text-align: right; }
              @media print {
                body { margin: 0; }
                .summary { page-break-inside: avoid; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <span class="header-icon">🚛</span>
              <h1>Supplier Ledger History</h1>
            </div>
            
            <div class="summary">
              <div class="summary-card">
                <div class="label">Total Debit (We Owe)</div>
                <div class="value debit-value">${formatCurrencyValue(totalDebit)}</div>
              </div>
              <div class="summary-card">
                <div class="label">Total Credit (We Paid)</div>
                <div class="value credit-value">${formatCurrencyValue(totalCredit)}</div>
              </div>
              <div class="summary-card">
                <div class="label">Outstanding Balance</div>
                <div class="value balance-value">
                  ${formatCurrencyValue(Math.abs(balance))} ${balance >= 0 ? '(Overpaid)' : '(Underpaid)'}
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th style="text-align: right;">Debit</th>
                  <th style="text-align: right;">Credit</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            
            <script>
              window.onload = function() {
                window.print();
              };
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Calculate summary statistics
  const totalDebit = filteredLedgers
    .filter((l: any) => l.type === 'debit')
    .reduce((sum: number, l: any) => sum + parseFloat(l.amount || '0'), 0);

  const totalCredit = filteredLedgers
    .filter((l: any) => l.type === 'credit')
    .reduce((sum: number, l: any) => sum + parseFloat(l.amount || '0'), 0);

  const balance = totalDebit - totalCredit; // For suppliers, debit means we owe them

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Ledgers</h1>
        <p className="text-gray-600">Track supplier account activities and outstanding payables</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Debit (We Owe)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrencyValue(totalDebit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Credit (We Paid)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrencyValue(totalCredit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className={`w-8 h-8 ${balance >= 0 ? 'text-red-500' : 'text-green-500'}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrencyValue(Math.abs(balance))} {balance >= 0 ? '(Payable)' : '(Overpaid)'}
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
          placeholder="From Date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full sm:w-40"
        />

        <Input
          type="date"
          placeholder="To Date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full sm:w-40"
        />

        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((supplier: any) => (
              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                {supplier.name}
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
            <SelectItem value="debit">Debit (We Owe)</SelectItem>
            <SelectItem value="credit">Credit (We Paid)</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Supplier Ledger History
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
          ) : filteredLedgers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ledger entries found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter || supplierFilter !== 'all' || typeFilter !== 'all' 
                  ? "Try adjusting your search criteria" 
                  : "No ledger entries recorded yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLedgers.map((ledger: any) => (
                <div key={ledger.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Entry #{ledger.id}
                      </h3>
                      <Badge className={getTypeColor(ledger.type)}>
                        {getTypeIcon(ledger.type)}
                        <span className="ml-1">{ledger.type.toUpperCase()}</span>
                      </Badge>
                      <div className={`text-lg font-bold ${ledger.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                        Rs{parseFloat(ledger.amount || '0').toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        {ledger.supplierName || 'Unknown Supplier'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {ledger.date ? new Date(ledger.date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {ledger.reference || 'No reference'}
                      </div>
                      {ledger.description && (
                        <div className="flex items-center">
                          <span className="font-medium">Note:</span> {ledger.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ledger Entry Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Supplier Ledger Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLedger} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={ledgerData.supplierId} onValueChange={(value) => setLedgerData({ ...ledgerData, supplierId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name} - {supplier.phone}
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
                    <SelectItem value="debit">Debit (We Owe Supplier)</SelectItem>
                    <SelectItem value="credit">Credit (We Paid Supplier)</SelectItem>
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