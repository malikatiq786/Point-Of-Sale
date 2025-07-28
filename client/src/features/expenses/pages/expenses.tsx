import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, DollarSign, Eye, Calendar, FileText, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Expenses() {
  const { user } = useAuth();
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
              <p className="text-sm text-gray-500">Track and manage business expenses</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search expenses..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />

              <Button className="bg-primary-500 text-white hover:bg-primary-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || dateFilter ? "Try adjusting your search criteria" : "No expense records yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense: any) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            ${parseFloat(expense.amount || '0').toFixed(2)}
                          </h3>
                          <Badge variant="secondary" className="px-2 py-1 text-xs">
                            Expense #{expense.id}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {expense.expenseDate ? format(new Date(expense.expenseDate), 'MMM dd, yyyy') : 'No date'}
                            </span>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <FileText className="w-4 h-4 mt-0.5" />
                            <span className="line-clamp-1">{expense.note || 'No description'}</span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Created by: {expense.createdBy || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}