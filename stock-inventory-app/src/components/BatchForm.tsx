import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { batchesApi, locationsApi, productsApi } from "@/lib/supabase/services";
import { Batch, Product, Location } from "@/lib/types/schema";

type BatchFormProps = {
  batch?: Batch;
  productId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function BatchForm({ batch, productId, onSuccess, onCancel }: BatchFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [batchNumber, setBatchNumber] = useState(batch?.batch_number || "");
  const [selectedProductId, setSelectedProductId] = useState(batch?.product_id || productId || "");
  const [selectedLocationId, setSelectedLocationId] = useState(batch?.location_id || "");
  const [quantity, setQuantity] = useState(batch?.quantity || 0);
  const [expiryDate, setExpiryDate] = useState(batch?.expiry_date ? new Date(batch.expiry_date).toISOString().split('T')[0] : "");
  const [notes, setNotes] = useState(batch?.notes || "");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();

  const loadFormData = useCallback(async () => {
    try {
      const [productsData, locationsData] = await Promise.all([
        productsApi.getAll(),
        locationsApi.getAll(),
      ]);
      
      setProducts(productsData);
      setLocations(locationsData);
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  useEffect(() => {
    if (batch) {
      setBatchNumber(batch.batch_number);
      setSelectedProductId(batch.product_id);
      setSelectedLocationId(batch.location_id);
      setQuantity(batch.quantity);
      if (batch.expiry_date) {
        setExpiryDate(new Date(batch.expiry_date).toISOString().split('T')[0]);
      }
      setNotes(batch.notes || "");
    }
  }, [batch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedProductId || !selectedLocationId) {
        throw new Error("Please select both a product and location");
      }
      
      const batchData = {
        product_id: selectedProductId,
        location_id: selectedLocationId,
        batch_number: batchNumber,
        quantity,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        notes,
      };

      if (batch?.id) {
        // Update existing batch
        await batchesApi.update(batch.id, batchData);
        toast({
          title: "Batch updated",
          description: `Batch #${batchNumber} has been updated successfully.`,
          variant: "success",
        });
      } else {
        // Create new batch
        await batchesApi.create(batchData);
        toast({
          title: "Batch created",
          description: `Batch #${batchNumber} has been created successfully.`,
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

  const generateBatchNumber = () => {
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    setBatchNumber(`B${datePart}-${randomPart}`);
  };

  if (initialLoading) {
    return <div className="flex items-center justify-center h-64">Loading form data...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{batch ? "Edit Batch" : "Add New Batch"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="batchNumber" className="text-sm font-medium">
              Batch Number*
            </label>
            <div className="flex gap-2">
              <Input
                id="batchNumber"
                placeholder="Enter batch number"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateBatchNumber}
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="product" className="text-sm font-medium">
              Product*
            </label>
            <select
              id="product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
              disabled={!!productId}
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Storage Location*
            </label>
            <select
              id="location"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity*
            </label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="expiryDate" className="text-sm font-medium">
              Expiry Date
            </label>
            <Input
              id="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Input
              id="notes"
              placeholder="Additional information about this batch"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : batch ? "Update Batch" : "Create Batch"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}