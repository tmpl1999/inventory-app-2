import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { movementsApi, productsApi, locationsApi, batchesApi } from "@/lib/supabase/services";
import { Movement, Product, Location, Batch } from "@/lib/types/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Search,
  RefreshCw, 
  FileDown,
  ArrowRightCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { downloadJsonAsFile, formatDateTime } from "@/lib/utils";
import MovementForm from "./MovementForm";

export default function MovementsList() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [batches, setBatches] = useState<Record<string, Batch>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { toast } = useToast();

  const loadMovements = React.useCallback(async () => {
    setLoading(true);
    try {
      const [movementsData, productsData, locationsData, batchesData] = await Promise.all([
        movementsApi.getAll(),
        productsApi.getAll(),
        locationsApi.getAll(),
        batchesApi.getAll()
      ]);
      
      setMovements(movementsData);
      
      // Convert arrays to lookup objects
      const productsLookup: Record<string, Product> = {};
      productsData.forEach(product => {
        productsLookup[product.id] = product;
      });
      setProducts(productsLookup);
      
      const locationsLookup: Record<string, Location> = {};
      locationsData.forEach(location => {
        locationsLookup[location.id] = location;
      });
      setLocations(locationsLookup);
      
      const batchesLookup: Record<string, Batch> = {};
      batchesData.forEach(batch => {
        batchesLookup[batch.id] = batch;
      });
      setBatches(batchesLookup);
    } catch (error) {
      toast({
        title: "Failed to load movements",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    loadMovements();
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
  };

  const handleAddNew = () => {
    setIsFormVisible(true);
  };

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    downloadJsonAsFile(movements, `movements-export-${date}.json`);
    toast({
      title: "Export successful",
      description: "Movements data has been exported to JSON file.",
      variant: "success",
    });
  };

  const filteredMovements = movements.filter((movement) => {
    const batch = batches[movement.batch_id];
    if (!batch) return false;
    
    const product = products[batch.product_id];
    const sourceLocation = locations[movement.source_location_id];
    const destinationLocation = locations[movement.destination_location_id];
    
    const searchString = [
      batch?.batch_number,
      product?.name,
      product?.sku,
      sourceLocation?.name,
      sourceLocation?.code,
      destinationLocation?.name,
      destinationLocation?.code,
      movement.notes
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (isFormVisible) {
    return (
      <MovementForm 
        onSuccess={handleFormSuccess} 
        onCancel={handleFormCancel} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Stock Movements</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Record Movement
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
            placeholder="Search movements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="ghost" 
          onClick={loadMovements} 
          className="ml-2"
          title="Refresh movements list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading movements...</div>
      ) : filteredMovements.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-4">No movements found</p>
          <Button onClick={handleAddNew}>Record Your First Movement</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Product & Batch</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement) => {
                const batch = batches[movement.batch_id];
                // If batch not found, skip
                if (!batch) return null;
                
                const product = products[batch.product_id];
                const sourceLocation = locations[movement.source_location_id];
                const destLocation = locations[movement.destination_location_id];
                
                return (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(movement.created_at)}
                    </TableCell>
                    <TableCell>
                      {product && (
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Batch: {batch.batch_number}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {sourceLocation ? (
                        sourceLocation.name
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <ArrowRightCircle className="h-4 w-4 text-muted-foreground" />
                      {destLocation ? (
                        destLocation.name
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge>
                        {movement.quantity} {product?.unit || "units"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movement.notes || (
                        <span className="text-muted-foreground">No notes</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}