import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  MapPin, 
  BarChart3, 
  Bell,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  productsApi, 
  locationsApi, 
  batchesApi, 
  alertsApi,
  generateAlerts,
  checkStockLevel
} from "@/lib/supabase/services";
import { Product, Alert } from "@/lib/types/schema";

export default function Dashboard() {
  const [stats, setStats] = useState({
    productCount: 0,
    locationCount: 0,
    batchCount: 0,
    alertCount: 0,
    lowStockCount: 0,
    expiringCount: 0
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all necessary data
      const [products, locations, batches, alerts] = await Promise.all([
        productsApi.getAll(),
        locationsApi.getAll(),
        batchesApi.getAll(),
        alertsApi.getAll()
      ]);
      
      // Filter for active alerts (not resolved)
      const activeAlerts = alerts.filter(alert => !alert.resolved);
      const lowStockAlerts = activeAlerts.filter(alert => alert.alert_type === 'low_stock');
      const expiryAlerts = activeAlerts.filter(alert => alert.alert_type === 'expiry');
      
      // Find products with low stock
      const lowStock = products.filter(
        product => product.total_stock !== undefined && 
        product.total_stock <= (product.reorder_point || 10)
      );
      
      // Set stats
      setStats({
        productCount: products.length,
        locationCount: locations.length,
        batchCount: batches.length,
        alertCount: activeAlerts.length,
        lowStockCount: lowStockAlerts.length,
        expiringCount: expiryAlerts.length
      });
      
      // Get recent 5 unresolved alerts
      setRecentAlerts(
        activeAlerts
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      );
      
      // Set low stock products
      setLowStockProducts(lowStock);
    } catch (error) {
      toast({
        title: "Error loading dashboard data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const memoizedLoadDashboardData = React.useCallback(loadDashboardData, [toast]);

  useEffect(() => {
    memoizedLoadDashboardData();
  }, [memoizedLoadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // First generate alerts (check expiry dates, etc.)
      await generateAlerts();
      
      // Then check stock levels
      await checkStockLevel();
      
      // Reload dashboard data
      await loadDashboardData();
      
      toast({
        title: "Refresh complete",
        description: "The dashboard data has been refreshed with the latest information.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card onClick={() => navigate("/products")} className="cursor-pointer transition-colors hover:bg-accent/10">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockCount > 0 ? `${stats.lowStockCount} with low stock` : "All stocked well"}
            </p>
          </CardContent>
        </Card>
        
        <Card onClick={() => navigate("/locations")} className="cursor-pointer transition-colors hover:bg-accent/10">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Storage Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locationCount}</div>
            <p className="text-xs text-muted-foreground">
              Active storage locations
            </p>
          </CardContent>
        </Card>
        
        <Card onClick={() => navigate("/batches")} className="cursor-pointer transition-colors hover:bg-accent/10">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.batchCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expiringCount > 0 ? `${stats.expiringCount} expiring soon` : "No expiring batches"}
            </p>
          </CardContent>
        </Card>
        
        <Card onClick={() => navigate("/alerts")} className="cursor-pointer transition-colors hover:bg-accent/10">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alertCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.alertCount > 0 ? "Needs attention" : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Alerts</span>
              {stats.alertCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.alertCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                <p className="text-sm text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className="flex items-start p-3 rounded-md border bg-background"
                  >
                    <div className="mr-3 mt-1">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">
                          {alert.alert_type === 'low_stock' && "Low Stock Alert"}
                          {alert.alert_type === 'expiry' && "Expiry Alert"}
                          {!['low_stock', 'expiry'].includes(alert.alert_type || '') && "System Alert"}
                        </h4>
                        <div className="flex-1" />
                        <Badge variant="outline" className="text-xs">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                ))}
                
                {stats.alertCount > recentAlerts.length && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm" 
                    onClick={() => navigate('/alerts')}
                  >
                    View all {stats.alertCount} alerts
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Low Stock Products</span>
              {stats.lowStockCount > 0 && (
                <Badge variant="warning" className="ml-2">
                  {stats.lowStockCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                <p className="text-sm text-muted-foreground">No low stock products</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="flex items-center justify-between p-3 rounded-md border bg-background"
                  >
                    <div>
                      <h4 className="text-sm font-medium">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant="warning">
                      {product.total_stock} / {product.reorder_point || 10} {product.unit || 'units'}
                    </Badge>
                  </div>
                ))}
                
                {stats.lowStockCount > lowStockProducts.length && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm" 
                    onClick={() => navigate('/products')}
                  >
                    View all {stats.lowStockCount} low stock products
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}