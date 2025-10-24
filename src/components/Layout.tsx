import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, LayoutDashboard, Users, MessageSquare, Shield, UserCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import logoWatermark from "@/assets/logo-watermark.png";
import { useActivityLog } from "@/hooks/useActivityLog";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSuperAdmin } = useAuth();
  const { logActivity } = useActivityLog();

  const handleLogout = async () => {
    await logActivity({
      action: 'user_logout',
      details: { timestamp: new Date().toISOString() }
    });
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Ministers", path: "/ministers" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: UserCircle, label: "Profile", path: "/profile" },
    ...(isSuperAdmin
      ? [
          { icon: Shield, label: "Super Admin", path: "/super-admin" },
          { icon: Activity, label: "Activity Logs", path: "/activity-logs" }
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-semibold text-primary">Ghana Baptist Convention</h1>
              <div className="flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                {isSuperAdmin && (
                  <Badge variant="default" className="text-xs">
                    Super Admin
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
      
      {/* Watermark Logo */}
      <div className="fixed bottom-4 right-4 opacity-20 hover:opacity-40 transition-opacity pointer-events-none z-50">
        <img 
          src={logoWatermark} 
          alt="LEC" 
          className="w-20 h-20 object-contain"
        />
      </div>
    </div>
  );
};

export default Layout;
