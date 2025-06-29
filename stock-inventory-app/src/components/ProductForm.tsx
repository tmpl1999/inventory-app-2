import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { productsApi } from "@/lib/supabase/services";
import { Product } from "@/lib/types/schema";

type ProductFormProps = {
  product?: Product;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState(product?.category || "");
  const [unit, setUnit] = useState(product?.unit || "");
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [reorderPoint, setReorderPoint] = useState<number>(product?.reorder_point || 10);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setDescription(product.description || "");
      setCategory(product.category || "");
      setUnit(product.unit || "");
      setPrice(product.price || 0);
      setReorderPoint(product.reorder_point || 10);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name,
        sku,
        description,
        category,
        unit,
        price,
        reorder_point: reorderPoint,
      };

      if (product?.id) {
        // Update existing product
        await productsApi.update(product.id, productData);
        toast({
          title: "Product updated",
          description: `The product ${name} has been updated successfully.`,
          variant: "success",
        });
      } else {
        // Create new product
        await productsApi.create(productData);
        toast({
          title: "Product created",
          description: `The product ${name} has been created successfully.`,
          variant: "success",
        });
      }

      onSuccess();
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Add New Product"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Product Name*
            </label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sku" className="text-sm font-medium">
              SKU*
            </label>
            <Input
              id="sku"
              placeholder="Enter product SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              placeholder="Enter product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Input
                id="category"
                placeholder="Enter product category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="unit" className="text-sm font-medium">
                Unit
              </label>
              <Input
                id="unit"
                placeholder="e.g., pcs, kg, box"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">
                Price
              </label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reorderPoint" className="text-sm font-medium">
                Reorder Point
              </label>
              <Input
                id="reorderPoint"
                type="number"
                placeholder="10"
                min="0"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : product ? "Update Product" : "Create Product"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}