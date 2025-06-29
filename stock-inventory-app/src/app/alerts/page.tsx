"use client";

import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/lib/supabase/services";
import AuthForm from "@/components/AuthForm";
import AlertsList from "@/components/AlertsList";
import AppLayout from "@/components/AppLayout";

export default function AlertsPage() {
  const { session, isLoading } = useSupabaseAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return (
    <AppLayout>
      <AlertsList />
    </AppLayout>
  );
}