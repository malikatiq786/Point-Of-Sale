import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, DollarSign, Plus, Calendar, FileText, Eye } from "lucide-react";
import { format } from "date-fns";

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Fetch expenses
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const filteredExpenses = expenses.filter((expense: any) => {
    const matchesSearch = expense.note?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || 
      (expense.expenseDate && format(new Date(expense.expenseDate), 'yyyy-MM-dd') === dateFilter);
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <p className="text-gray-600">Track and manage business expenses</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder="Search expenses..." 
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

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Expense History
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
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter ? "Try adjusting your search criteria" : "No expenses recorded yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Expense #{expense.id}
                      </h3>
                      <Badge className={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                      <div className="text-lg font-bold text-red-600">
                        ${parseFloat(expense.amount || '0').toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {expense.category || 'Uncategorized'}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        {expense.paymentMethod || 'Cash'}
                      </div>
                      {expense.vendor && (
                        <div className="flex items-center">
                          <span className="font-medium">Vendor:</span> {expense.vendor}
                        </div>
                      )}
                    </div>
                    
                    {expense.note && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Note:</span> {expense.note}
                      </div>
                    )}
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
    </AppLayout>
  );
}