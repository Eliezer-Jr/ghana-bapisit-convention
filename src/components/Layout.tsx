import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, LayoutDashboard, Users, MessageSquare, Shield, UserCircle, Activity, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import logoWatermark from "@/assets/logo-watermark.png";
import { useActivityLog } from "@/hooks/useActivityLog";
interface LayoutProps {
  children: ReactNode;
}
const Layout = ({
  children
}: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isSuperAdmin
  } = useAuth();
  const {
    logActivity
  } = useActivityLog();
  const handleLogout = async () => {
    await logActivity({
      action: 'user_logout',
      details: {
        timestamp: new Date().toISOString()
      }
    });
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };
  const navItems = [{
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/"
  }, {
    icon: Users,
    label: "Ministers",
    path: "/ministers"
  }, {
    icon: MessageSquare,
    label: "Messages",
    path: "/messages"
  }, {
    icon: GraduationCap,
    label: "Admissions",
    path: "/admissions"
  }, {
    icon: UserCircle,
    label: "Profile",
    path: "/profile"
  }, ...(isSuperAdmin ? [{
    icon: Shield,
    label: "Super Admin",
    path: "/super-admin"
  }, {
    icon: Activity,
    label: "Activity Logs",
    path: "/activity-logs"
  }, {
    icon: GraduationCap,
    label: "Admission Admin",
    path: "/admin/admissions"
  }] : [])];
  return <div className="min-h-screen bg-background relative">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
      
      {/* Watermark Logo */}
      <div className="fixed bottom-4 right-4 opacity-20 hover:opacity-40 transition-opacity pointer-events-none z-50">
        <img src={logoWatermark} alt="LEC" className="w-20 h-20 object-contain" />
      </div>
    </div>;
};
export default Layout;