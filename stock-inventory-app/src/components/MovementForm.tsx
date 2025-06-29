import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { movementsApi, batchesApi, locationsApi, productsApi } from "@/lib/supabase/services";
import { Batch, Product, Location } from "@/lib/types/schema";

type MovementFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
  batchId?: string;
};

export default function MovementForm({ onSuccess, onCancel, batchId }: MovementFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState(batchId || "");
  const [selectedSourceLocationId, setSelectedSourceLocationId] = useState("");
  const [selectedDestinationLocationId, setSelectedDestinationLocationId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [maxQuantity, setMaxQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [productsData, batchesData, locationsData] = await Promise.all([
          productsApi.getAll(),
          batchesApi.getAll(),
          locationsApi.getAll(),
        ]);
        
        setProducts(productsData);
        setBatches(batchesData);
        setLocations(locationsData);
        
        // If batchId is provided, set the related fields
        if (batchId) {
          const selectedBatch = batchesData.find(batch => batch.id === batchId);
          if (selectedBatch) {
            setSelectedBatchId(selectedBatch.id);
            setSelectedProductId(selectedBatch.product_id);
            setSelectedSourceLocationId(selectedBatch.location_id);
            setMaxQuantity(selectedBatch.quantity);
          }
        }
      } catch (error) {
        toast({
          title: "Failed to load data",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadFormData();
  }, [batchId, toast]);

  // Filter batches when product changes
  const filteredBatches = batches.filter(batch => 
    !selectedProductId || batch.product_id === selectedProductId
  );

  // Update batch selection when product changes
  useEffect(() => {
    if (selectedProductId && !batchId) {
      setSelectedBatchId("");
    }
  }, [selectedProductId, batchId]);

  // Update source location and max quantity when batch changes
  useEffect(() => {
    if (selectedBatchId) {
      const selectedBatch = batches.find(batch => batch.id === selectedBatchId);
      if (selectedBatch) {
        setSelectedSourceLocationId(selectedBatch.location_id);
        setMaxQuantity(selectedBatch.quantity);
        setQuantity(1); // Reset quantity
      }
    } else {
      setSelectedSourceLocationId("");
      setMaxQuantity(0);
      setQuantity(0);
    }
  }, [selectedBatchId, batches]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProductId(e.target.value);
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBatchId(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be greater than zero.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (quantity > maxQuantity) {
      toast({
        title: "Invalid quantity",
        description: `Cannot move more than available quantity (${maxQuantity}).`,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (selectedSourceLocationId === selectedDestinationLocationId) {
      toast({
        title: "Invalid locations",
        description: "Source and destination locations cannot be the same.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Create the movement
      await movementsApi.create({
        batch_id: selectedBatchId,
        source_location_id: selectedSourceLocationId,
        destination_location_id: selectedDestinationLocationId,
        quantity,
        notes,
      });
      
      toast({
        title: "Movement recorded",
        description: "The stock movement has been recorded successfully.",
        variant: "success",
      });

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

  if (initialLoading) {
    return <div className="flex items-center justify-center h-64">Loading form data...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Record Stock Movement</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="product" className="text-sm font-medium">
              Product*
            </label>
            <select
              id="product"
              value={selectedProductId}
              onChange={handleProductChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
              disabled={!!batchId}
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
            <label htmlFor="batch" className="text-sm font-medium">
              Batch*
            </label>
            <select
              id="batch"
              value={selectedBatchId}
              onChange={handleBatchChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
              disabled={!!batchId}
            >
              <option value="">Select a batch</option>
              {filteredBatches.map((batch) => {
                const product = products.find(p => p.id === batch.product_id);
                return (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_number} - {product?.name} ({batch.quantity} available)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="sourceLocation" className="text-sm font-medium">
                Source Location
              </label>
              <select
                id="sourceLocation"
                value={selectedSourceLocationId}
                disabled={true} // Always disabled as it's determined by the batch
                className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
              >
                <option value="">-</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="destinationLocation" className="text-sm font-medium">
                Destination Location*
              </label>
              <select
                id="destinationLocation"
                value={selectedDestinationLocationId}
                onChange={(e) => setSelectedDestinationLocationId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select a destination</option>
                {locations.map((location) => (
                  <option
                    key={location.id}
                    value={location.id}
                    disabled={location.id === selectedSourceLocationId}
                  >
                    {location.name} ({location.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              Quantity* (Max: {maxQuantity})
            </label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Input
              id="notes"
              placeholder="Additional information about this movement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedBatchId || !selectedDestinationLocationId || quantity <= 0 || quantity > maxQuantity}>
            {loading ? "Processing..." : "Record Movement"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}