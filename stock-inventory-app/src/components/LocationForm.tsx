import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { locationsApi } from "@/lib/supabase/services";
import { Location } from "@/lib/types/schema";

type LocationFormProps = {
  location?: Location;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function LocationForm({ location, onSuccess, onCancel }: LocationFormProps) {
  const [name, setName] = useState(location?.name || "");
  const [code, setCode] = useState(location?.code || "");
  const [description, setDescription] = useState(location?.description || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (location) {
      setName(location.name);
      setCode(location.code);
      setDescription(location.description || "");
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const locationData = {
        name,
        code,
        description,
      };

      if (location?.id) {
        // Update existing location
        await locationsApi.update(location.id, locationData);
        toast({
          title: "Location updated",
          description: `The location ${name} has been updated successfully.`,
          variant: "success",
        });
      } else {
        // Create new location
        await locationsApi.create(locationData);
        toast({
          title: "Location created",
          description: `The location ${name} has been created successfully.`,
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

  const generateLocationCode = () => {
    const locationPrefix = name.substring(0, 3).toUpperCase();
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setCode(`${locationPrefix}-${randomPart}`);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{location ? "Edit Location" : "Add New Location"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Location Name*
            </label>
            <Input
              id="name"
              placeholder="Enter location name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Location Code*
            </label>
            <div className="flex gap-2">
              <Input
                id="code"
                placeholder="Enter location code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={generateLocationCode}
                disabled={!name}
                title={!name ? "Enter a location name first" : "Generate code based on name"}
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              placeholder="Enter location description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : location ? "Update Location" : "Create Location"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}