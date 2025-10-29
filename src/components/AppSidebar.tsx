import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GraduationCap,
  UserCircle,
  Shield,
  Activity,
  DollarSign,
  ClipboardCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { isSuperAdmin, user } = useAuth();
  const currentPath = location.pathname;

  // Fetch user roles
  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const collapsed = state === "collapsed";
  const isFinanceManager = userRoles?.some((r) => r.role === "finance_manager");
  const isAdmissionReviewer = userRoles?.some((r) => r.role === "admission_reviewer");

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", show: true },
    { icon: Users, label: "Ministers", path: "/ministers", show: true },
    { icon: MessageSquare, label: "Messages", path: "/messages", show: true },
    { icon: GraduationCap, label: "My Admissions", path: "/admissions", show: true },
    { icon: UserCircle, label: "Profile", path: "/profile", show: true },
  ];

  const adminItems = [
    { icon: Shield, label: "Super Admin", path: "/super-admin", show: isSuperAdmin },
    { icon: Activity, label: "Activity Logs", path: "/activity-logs", show: isSuperAdmin },
    { icon: ClipboardCheck, label: "Review Admissions", path: "/admin/admissions", show: isSuperAdmin || isAdmissionReviewer },
    { icon: DollarSign, label: "Finance Portal", path: "/finance", show: isSuperAdmin || isFinanceManager },
  ];

  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "hover:bg-accent";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.path} end={item.path === "/"} className={() => getNavCls(isActive(item.path))}>
                        <item.icon className={collapsed ? "h-5 w-5 mx-auto" : "h-5 w-5"} />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminItems.some((item) => item.show) && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.path} className={() => getNavCls(isActive(item.path))}>
                          <item.icon className={collapsed ? "h-5 w-5 mx-auto" : "h-5 w-5"} />
                          {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}