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
  UserCog,
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

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
    { icon: Shield, label: "User Approvals", path: "/super-admin", show: isSuperAdmin },
    { icon: UserCog, label: "User Management", path: "/user-management", show: isSuperAdmin },
    { icon: Activity, label: "Activity Logs", path: "/activity-logs", show: isSuperAdmin },
    { icon: ClipboardCheck, label: "Review Admissions", path: "/admin/admissions", show: isSuperAdmin || isAdmissionReviewer },
    { icon: DollarSign, label: "Finance Portal", path: "/finance", show: isSuperAdmin || isFinanceManager },
  ];

  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-l-4 border-primary" 
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="gap-0">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild className="h-11">
                      <NavLink 
                        to={item.path} 
                        end={item.path === "/"} 
                        className={({ isActive: navActive }) => 
                          `flex items-center gap-3 rounded-md px-3 py-2 transition-all ${getNavCls(isActive(item.path))}`
                        }
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="text-sm">{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {adminItems.some((item) => item.show) && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"}>
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2">
                {adminItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild className="h-11">
                        <NavLink 
                          to={item.path} 
                          className={({ isActive: navActive }) => 
                            `flex items-center gap-3 rounded-md px-3 py-2 transition-all ${getNavCls(isActive(item.path))}`
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && <span className="text-sm">{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      {!collapsed && (
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email?.split("@")[0]}</p>
              {isSuperAdmin && (
                <Badge variant="default" className="text-xs mt-1">
                  Super Admin
                </Badge>
              )}
              {isFinanceManager && !isSuperAdmin && (
                <Badge variant="default" className="text-xs mt-1">
                  Finance Manager
                </Badge>
              )}
              {isAdmissionReviewer && !isSuperAdmin && (
                <Badge variant="default" className="text-xs mt-1">
                  Reviewer
                </Badge>
              )}
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}