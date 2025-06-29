import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { batchesApi, productsApi, locationsApi } from "@/lib/supabase/services";
import { Batch, Product, Location } from "@/lib/types/schema";
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
import { downloadJsonAsFile, formatDate } from "@/lib/utils";
import BatchForm from "./BatchForm";

export default function BatchesList() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { toast } = useToast();

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesData, productsData, locationsData] = await Promise.all([
        batchesApi.getAll(),
        productsApi.getAll(),
        locationsApi.getAll()
      ]);
      
      setBatches(batchesData);
      
      // Convert products and locations arrays to lookup objects
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
    } catch (error) {
      toast({
        title: "Failed to load batches",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      try {
        await batchesApi.delete(id);
        setBatches(batches.filter(batch => batch.id !== id));
        toast({
          title: "Batch deleted",
          description: "The batch has been deleted successfully.",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Failed to delete batch",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setSelectedBatch(null);
    loadBatches();
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedBatch(null);
  };

  const handleAddNew = () => {
    setSelectedBatch(null);
    setIsFormVisible(true);
  };

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    downloadJsonAsFile(batches, `batches-export-${date}.json`);
    toast({
      title: "Export successful",
      description: "Batches data has been exported to JSON file.",
      variant: "success",
    });
  };

  const isExpiring = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const filteredBatches = batches.filter((batch) => {
    const product = products[batch.product_id];
    const location = locations[batch.location_id];
    
    const searchString = [
      batch.batch_number,
      product?.name,
      product?.sku,
      location?.name,
      location?.code,
    ].join(' ').toLowerCase();
    
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (isFormVisible) {
    return (
      <BatchForm 
        batch={selectedBatch || undefined} 
        onSuccess={handleFormSuccess} 
        onCancel={handleFormCancel} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Batches</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
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
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="ghost" 
          onClick={loadBatches} 
          className="ml-2"
          title="Refresh batches list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading batches...</div>
      ) : filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-4">No batches found</p>
          <Button onClick={handleAddNew}>Add Your First Batch</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => {
                const product = products[batch.product_id];
                const location = locations[batch.location_id];
                
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-sm">{batch.batch_number}</TableCell>
                    <TableCell>
                      {product ? (
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.sku}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown product</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {location ? (
                        <div>
                          <div>{location.name}</div>
                          <div className="text-xs text-muted-foreground">{location.code}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown location</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={batch.quantity > 0 ? "success" : "default"}>
                        {batch.quantity} {product?.unit || "units"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {batch.expiry_date ? (
                        <div>
                          <div>{formatDate(batch.expiry_date)}</div>
                          {isExpired(batch.expiry_date) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : isExpiring(batch.expiry_date) ? (
                            <Badge variant="warning">Expiring soon</Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No expiry date</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(batch)}
                          title="Edit batch"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(batch.id)}
                          title="Delete batch"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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