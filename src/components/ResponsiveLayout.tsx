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
          {/* Header */}
          <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <AppSidebar />
                  </SheetContent>
                </Sheet>

                {/* Desktop Sidebar Trigger */}
                <div className="hidden md:block">
                  <SidebarTrigger className="h-9 w-9" />
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Church className="h-5 w-5 text-primary" />
                  </div>
                  <h1 className="text-base md:text-lg font-semibold text-foreground truncate">
                    Ghana Baptist Convention
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                  <span className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-none">
                    {user?.email}
                  </span>
                  {isSuperAdmin && (
                    <Badge variant="default" className="text-xs px-2 py-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 h-9">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden bg-background">
            <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">{children}</div>
          </main>

          {/* Watermark Logo */}
          <div className="fixed bottom-4 right-4 opacity-20 hover:opacity-40 transition-opacity pointer-events-none z-50">
            <img src={logoWatermark} alt="LEC" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}