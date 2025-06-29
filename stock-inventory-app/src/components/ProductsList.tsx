import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { productsApi, checkStockLevel } from "@/lib/supabase/services";
import { Product } from "@/lib/types/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  RefreshCw, 
  FileDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { downloadJsonAsFile } from "@/lib/utils";
import ProductForm from "./ProductForm";

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const { toast } = useToast();

  const loadProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Failed to load products",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productsApi.delete(id);
        setProducts(products.filter(product => product.id !== id));
        toast({
          title: "Product deleted",
          description: "The product has been deleted successfully.",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Failed to delete product",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setSelectedProduct(null);
    loadProducts();
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedProduct(null);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsFormVisible(true);
  };

  const handleCheckStock = async (productId: string) => {
    setIsCheckingStock(true);
    try {
      await checkStockLevel(productId);
      toast({
        title: "Stock check completed",
        description: "Stock levels have been checked for this product.",
        variant: "info",
      });
    } catch (error) {
      toast({
        title: "Failed to check stock",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStock(false);
    }
  };

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    downloadJsonAsFile(products, `products-export-${date}.json`);
    toast({
      title: "Export successful",
      description: "Products data has been exported to JSON file.",
      variant: "success",
    });
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isFormVisible) {
    return (
      <ProductForm 
        product={selectedProduct || undefined} 
        onSuccess={handleFormSuccess} 
        onCancel={handleFormCancel} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Products</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="ghost" 
          onClick={loadProducts} 
          className="ml-2"
          title="Refresh products list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-4">No products found</p>
          <Button onClick={handleAddNew}>Add Your First Product</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Stock Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category || "-"}</TableCell>
                  <TableCell>
                    {product.price ? `$${product.price.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.total_stock !== undefined && (
                      product.total_stock <= (product.reorder_point || 10) ? (
                        <Badge variant="warning">Low Stock ({product.total_stock} {product.unit || "units"})</Badge>
                      ) : (
                        <Badge variant="success">{product.total_stock} {product.unit || "units"}</Badge>
                      )
                    )}
                    {(product.total_stock === undefined || product.total_stock === null) && (
                      <Badge>No Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCheckStock(product.id)}
                        disabled={isCheckingStock}
                        title="Check stock levels"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        title="Edit product"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}