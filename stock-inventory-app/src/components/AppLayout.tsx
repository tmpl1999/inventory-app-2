"use client";

import React, { useState, ReactNode } from "react";
import { useSupabaseAuth } from "@/lib/supabase/services";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { 
  Package, 
  Truck, 
  MapPin,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: ReactNode;
};

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  onClick: () => void;
};

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <Button
    variant={active ? "default" : "ghost"}
    className={cn(
      "w-full justify-start gap-2",
      active ? "bg-primary text-primary-foreground" : "hover:bg-transparent hover:text-primary"
    )}
    onClick={onClick}
  >
    {icon}
    {label}
  </Button>
);

export default function AppLayout({ children }: AppLayoutProps) {
  const { session, signOut } = useSupabaseAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
      variant: "info",
    });
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: "Products",
      href: "/products",
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: "Locations",
      href: "/locations",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Batches",
      href: "/batches",
    },
    {
      icon: <Truck className="h-5 w-5" />,
      label: "Movements",
      href: "/movements",
    },
    {
      icon: <Bell className="h-5 w-5" />,
      label: "Alerts",
      href: "/alerts",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-card border-r p-4 shadow-sm">
        <div className="flex items-center mb-8 px-2 py-3">
          <Package className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-xl font-bold">Stock Inventory</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
              onClick={() => handleNavigation(item.href)}
            />
          ))}
        </nav>
        
        <div className="pt-4 mt-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
          
          <div className="mt-4 px-2 py-3">
            <p className="text-sm font-medium truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>
      
      {/* Mobile Header with Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background z-10 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Package className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-xl font-bold">Stock Inventory</h1>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="p-4 border-t bg-background">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={pathname === item.href}
                  onClick={() => handleNavigation(item.href)}
                />
              ))}
              
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-muted-foreground mt-4"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="md:hidden h-16" /> {/* Spacer for mobile header */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}