import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseAuthProvider } from "@/lib/supabase/services";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseAuthProvider>
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}