import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { alertsApi, productsApi } from "@/lib/supabase/services";
import { Alert, Product } from "@/lib/types/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search,
  RefreshCw, 
  FileDown,
  CheckCircle,
  Bell,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { downloadJsonAsFile, formatDateTime } from "@/lib/utils";

export default function AlertsList() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const { toast } = useToast();

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsData, productsData] = await Promise.all([
        alertsApi.getAll(),
        productsApi.getAll()
      ]);
      
      setAlerts(alertsData);
      
      // Convert products array to lookup object
      const productsLookup: Record<string, Product> = {};
      productsData.forEach(product => {
        productsLookup[product.id] = product;
      });
      setProducts(productsLookup);
    } catch (error) {
      toast({
        title: "Failed to load alerts",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await alertsApi.update(alertId, { resolved: true, resolved_at: new Date().toISOString() });
      
      // Update the local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolved_at: new Date().toISOString() } 
          : alert
      ));
      
      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to resolve alert",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    downloadJsonAsFile(alerts, `alerts-export-${date}.json`);
    toast({
      title: "Export successful",
      description: "Alerts data has been exported to JSON file.",
      variant: "success",
    });
  };

  // Filter alerts based on search term and active filter
  const filteredAlerts = alerts.filter((alert) => {
    const product = alert.product_id ? products[alert.product_id] : undefined;
    
    // First filter by search term
    const searchString = [
      product?.name,
      product?.sku,
      alert.message,
      alert.alert_type
    ].filter(Boolean).join(' ').toLowerCase();
    
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    // Then filter by resolved status
    if (activeFilter === 'resolved') {
      return matchesSearch && alert.resolved === true;
    } else if (activeFilter === 'unresolved') {
      return matchesSearch && alert.resolved !== true;
    }
    
    return matchesSearch;
  });
  
  // Calculate counts for summary
  const totalAlerts = alerts.length;
  const unresolvedAlerts = alerts.filter(alert => !alert.resolved).length;
  const resolvedAlerts = totalAlerts - unresolvedAlerts;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Alerts</h2>
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card onClick={() => setActiveFilter('all')} className={`cursor-pointer transition-colors ${activeFilter === 'all' ? 'border-primary bg-primary/5' : ''}`}>
          <CardHeader className="py-4">
            <CardTitle className="flex justify-between">
              <span>All Alerts</span>
              <Badge variant="default">{totalAlerts}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card onClick={() => setActiveFilter('unresolved')} className={`cursor-pointer transition-colors ${activeFilter === 'unresolved' ? 'border-primary bg-primary/5' : ''}`}>
          <CardHeader className="py-4">
            <CardTitle className="flex justify-between">
              <span>Pending</span>
              <Badge variant="destructive">{unresolvedAlerts}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card onClick={() => setActiveFilter('resolved')} className={`cursor-pointer transition-colors ${activeFilter === 'resolved' ? 'border-primary bg-primary/5' : ''}`}>
          <CardHeader className="py-4">
            <CardTitle className="flex justify-between">
              <span>Resolved</span>
              <Badge variant="success">{resolvedAlerts}</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="ghost" 
          onClick={loadAlerts} 
          className="ml-2"
          title="Refresh alerts list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading alerts...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-2">No alerts found</p>
          <p className="text-sm text-muted-foreground">
            {activeFilter === 'all' 
              ? "You don't have any alerts yet." 
              : activeFilter === 'unresolved' 
                ? "All alerts have been resolved!" 
                : "No resolved alerts yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => {
                const product = products[alert.product_id];
                
                return (
                  <TableRow key={alert.id} className={alert.resolved ? 'opacity-70' : ''}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(alert.created_at)}
                    </TableCell>
                    <TableCell>
                      {alert.alert_type === 'low_stock' && (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Low Stock</span>
                        </Badge>
                      )}
                      {alert.alert_type === 'expiry' && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Expiry</span>
                        </Badge>
                      )}
                      {alert.alert_type !== 'low_stock' && alert.alert_type !== 'expiry' && (
                        <Badge className="capitalize">
                          {alert.alert_type || 'System'}
                        </Badge>
                      )}
                    </TableCell>
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
                    <TableCell className="max-w-xs text-wrap">
                      {alert.message}
                    </TableCell>
                    <TableCell>
                      {alert.resolved ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{alert.resolved_at ? `Resolved ${formatDateTime(alert.resolved_at)}` : 'Resolved'}</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 bg-amber-50">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          <span>Pending</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="h-8"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
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
