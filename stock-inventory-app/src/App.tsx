import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { SupabaseAuthProvider } from "@/lib/supabase/services";

// Lazy load components to improve performance
const Dashboard = lazy(() => import("@/components/Dashboard"));
const ProductsList = lazy(() => import("@/components/ProductsList"));
const LocationsList = lazy(() => import("@/components/LocationsList"));
const BatchesList = lazy(() => import("@/components/BatchesList"));
const MovementsList = lazy(() => import("@/components/MovementsList"));
const AlertsList = lazy(() => import("@/components/AlertsList"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-lg font-medium">Loading...</div>
  </div>
);

function App() {
  return (
    <SupabaseAuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<ProductsList />} />
                <Route path="/locations" element={<LocationsList />} />
                <Route path="/batches" element={<BatchesList />} />
                <Route path="/movements" element={<MovementsList />} />
                <Route path="/alerts" element={<AlertsList />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </SupabaseAuthProvider>
  );
}

export default App;