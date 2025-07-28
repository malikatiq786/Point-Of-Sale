import { useState } from "react";
import { AppLayout } from "@/layouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Tags, Eye } from "lucide-react";

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const filteredCategories = categories.filter((category: any) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600">Organize your products with categories</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredCategories.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <Tags className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchQuery ? "Try adjusting your search terms" : "Get started by creating your first category"}
                </p>
                <Button className="bg-primary-500 text-white hover:bg-primary-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            ) : (
              filteredCategories.map((category: any) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-20 bg-gray-100 rounded-lg mb-4">
                      <Tags className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        ID: {category.id}
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
                  </CardContent>
                </Card>
              ))
            )}
      </div>
    </AppLayout>
  );
}