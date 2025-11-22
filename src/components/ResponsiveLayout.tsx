import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu, Church } from "lucide-react";
import { toast } from "sonner";
import logoWatermark from "@/assets/logo-watermark.png";
import { useActivityLog } from "@/hooks/useActivityLog";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface ResponsiveLayoutProps {
  children: ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { logActivity } = useActivityLog();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logActivity({
      action: "user_logout",
      details: { timestamp: new Date().toISOString() },
    });

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - Modern Design */}
          <header className="h-16 border-b bg-card/80 backdrop-blur-lg sticky top-0 z-40 flex items-center justify-between px-6 shadow-sm">
            {/* Left side - Menu and Logo */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <AppSidebar />
                </SheetContent>
              </Sheet>

              {/* Desktop Sidebar Trigger */}
              <div className="hidden md:block">
                <SidebarTrigger />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md">
                  <Church className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gradient leading-none">Ghana Baptist Convention Conference</h1>
                  <p className="text-xs text-muted-foreground">Ministry Portal</p>
                </div>
              </div>
            </div>

            {/* Right side - Logout only */}
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 font-medium">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto px-6 py-8 max-w-7xl">{children}</div>
          </main>

          {/* Watermark Logo */}
          <div className="fixed bottom-4 right-4 opacity-10 hover:opacity-20 transition-opacity pointer-events-none">
            <img src={logoWatermark} alt="LEC" className="w-16 h-16 object-contain" />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}