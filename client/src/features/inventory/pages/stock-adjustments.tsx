import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings, User, Calendar, FileText, Warehouse } from "lucide-react";

export default function StockAdjustments() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch stock adjustments
  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ["/api/stock/adjustments"],
    retry: false,
  });

  const filteredAdjustments = adjustments.filter((adjustment: any) =>
    adjustment.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adjustment.warehouseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    adjustment.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAdjustmentTypeFromReason = (reason: string) => {
    if (!reason) return { type: 'Other', color: 'bg-gray-100 text-gray-800' };
    
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('damage') || lowerReason.includes('broken')) {
      return { type: 'Damaged', color: 'bg-red-100 text-red-800' };
    }
    if (lowerReason.includes('recount') || lowerReason.includes('audit') || lowerReason.includes('count')) {
      return { type: 'Recount', color: 'bg-blue-100 text-blue-800' };
    }
    if (lowerReason.includes('theft') || lowerReason.includes('missing') || lowerReason.includes('lost')) {
      return { type: 'Loss', color: 'bg-red-100 text-red-800' };
    }
    if (lowerReason.includes('expire') || lowerReason.includes('expiry')) {
      return { type: 'Expired', color: 'bg-orange-100 text-orange-800' };
    }
    if (lowerReason.includes('return') || lowerReason.includes('refund')) {
      return { type: 'Return', color: 'bg-green-100 text-green-800' };
    }
    return { type: 'Manual', color: 'bg-purple-100 text-purple-800' };
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
        <p className="text-gray-600">View history of all stock level adjustments and modifications</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-96">
          <Input 
            type="text" 
            placeholder="Search adjustments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Adjustments</p>
                <p className="text-2xl font-bold text-gray-900">{adjustments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {adjustments.filter((adj: any) => {
                    const adjDate = new Date(adj.createdAt);
                    const now = new Date();
                    return adjDate.getMonth() === now.getMonth() && adjDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(adjustments.map((adj: any) => adj.userId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Warehouse className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(adjustments.map((adj: any) => adj.warehouseId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Adjustment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredAdjustments.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No adjustments found</h3>
              <p className="text-gray-500">
                {searchQuery ? "Try adjusting your search terms" : "Stock adjustment history will appear here once stock levels are modified"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdjustments.map((adjustment: any) => {
                const adjustmentType = getAdjustmentTypeFromReason(adjustment.reason);
                
                return (
                  <div key={adjustment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Settings className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <Badge className={adjustmentType.color}>
                            {adjustmentType.type}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Adjustment #{adjustment.id}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {adjustment.reason || 'No reason provided'}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {adjustment.warehouseName && (
                            <span className="flex items-center">
                              <Warehouse className="w-3 h-3 mr-1" />
                              {adjustment.warehouseName}
                            </span>
                          )}
                          {adjustment.userName && (
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {adjustment.userName}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(adjustment.createdAt).toLocaleDateString()} {new Date(adjustment.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}