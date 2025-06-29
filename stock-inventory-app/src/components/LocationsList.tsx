import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { locationsApi } from "@/lib/supabase/services";
import { Location } from "@/lib/types/schema";
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
import { downloadJsonAsFile } from "@/lib/utils";
import LocationForm from "./LocationForm";

export default function LocationsList() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { toast } = useToast();

  const loadLocations = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await locationsApi.getAll();
      setLocations(data);
    } catch (error) {
      toast({
        title: "Failed to load locations",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this location? This may affect batches stored at this location.")) {
      try {
        await locationsApi.delete(id);
        setLocations(locations.filter(location => location.id !== id));
        toast({
          title: "Location deleted",
          description: "The location has been deleted successfully.",
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "Failed to delete location",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setSelectedLocation(null);
    loadLocations();
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedLocation(null);
  };

  const handleAddNew = () => {
    setSelectedLocation(null);
    setIsFormVisible(true);
  };

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    downloadJsonAsFile(locations, `locations-export-${date}.json`);
    toast({
      title: "Export successful",
      description: "Locations data has been exported to JSON file.",
      variant: "success",
    });
  };

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isFormVisible) {
    return (
      <LocationForm 
        location={selectedLocation || undefined} 
        onSuccess={handleFormSuccess} 
        onCancel={handleFormCancel} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Locations</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Location
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
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="ghost" 
          onClick={loadLocations} 
          className="ml-2"
          title="Refresh locations list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading locations...</div>
      ) : filteredLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-4">No locations found</p>
          <Button onClick={handleAddNew}>Add Your First Location</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-mono font-medium">{location.code}</TableCell>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>{location.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(location)}
                        title="Edit location"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(location.id)}
                        title="Delete location"
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