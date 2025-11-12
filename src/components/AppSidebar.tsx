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
  FileCheck,
  Building2,
  Briefcase,
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
  const { isSuperAdmin, user, isLocalOfficer, isAssociationHead, isVPOffice } = useAuth();
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

  // Show workflow dashboards based on role
  const showWorkflowDashboards = isLocalOfficer || isAssociationHead || isVPOffice || isSuperAdmin;

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", show: true },
    { icon: Users, label: "Ministers", path: "/ministers", show: true },
    { icon: MessageSquare, label: "Messages", path: "/messages", show: true },
    { icon: GraduationCap, label: "My Admissions", path: "/admissions", show: true },
    { icon: UserCircle, label: "Profile", path: "/profile", show: true },
  ];

  const workflowItems = [
    { icon: FileCheck, label: "Local Screening", path: "/local-officer", show: isLocalOfficer || isSuperAdmin },
    { icon: Building2, label: "Association Review", path: "/association", show: isAssociationHead || isSuperAdmin },
    { icon: Briefcase, label: "VP Office", path: "/vp-office", show: isVPOffice || isSuperAdmin },
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
      ? "bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold border-l-4 border-primary shadow-sm" 
      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="py-6">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-3">
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild className="h-11" tooltip={collapsed ? item.label : undefined}>
                      <NavLink 
                        to={item.path} 
                        end={item.path === "/"} 
                        className={({ isActive: navActive }) => 
                          `flex items-center gap-3 rounded-xl px-4 smooth-transition ${getNavCls(isActive(item.path))}`
                        }
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="font-medium">{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workflow Section */}
        {showWorkflowDashboards && workflowItems.some((item) => item.show) && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className={collapsed ? "sr-only" : "px-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"}>
              Admission Workflow
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2 px-3">
                {workflowItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild className="h-11" tooltip={collapsed ? item.label : undefined}>
                        <NavLink 
                          to={item.path} 
                          className={({ isActive: navActive }) => 
                            `flex items-center gap-3 rounded-xl px-4 smooth-transition ${getNavCls(isActive(item.path))}`
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && <span className="font-medium">{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {adminItems.some((item) => item.show) && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className={collapsed ? "sr-only" : "px-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"}>
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2 px-3">
                {adminItems
                  .filter((item) => item.show)
                  .map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild className="h-11" tooltip={collapsed ? item.label : undefined}>
                        <NavLink 
                          to={item.path} 
                          className={({ isActive: navActive }) => 
                            `flex items-center gap-3 rounded-xl px-4 smooth-transition ${getNavCls(isActive(item.path))}`
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!collapsed && <span className="font-medium">{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer - Modern User Card */}
      {!collapsed && (
        <SidebarFooter className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-card shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.email?.split("@")[0]}</p>
              {isSuperAdmin && (
                <Badge variant="default" className="text-xs mt-1 px-2 py-0.5 bg-primary">
                  Admin
                </Badge>
              )}
              {isFinanceManager && !isSuperAdmin && (
                <Badge variant="default" className="text-xs mt-1 px-2 py-0.5 bg-secondary">
                  Finance
                </Badge>
              )}
              {isAdmissionReviewer && !isSuperAdmin && (
                <Badge variant="default" className="text-xs mt-1 px-2 py-0.5 bg-secondary">
                  Reviewer
                </Badge>
              )}
              {(isLocalOfficer || isAssociationHead || isVPOffice) && !isSuperAdmin && !isFinanceManager && !isAdmissionReviewer && (
                <Badge variant="default" className="text-xs mt-1 px-2 py-0.5 bg-accent">
                  {isLocalOfficer && "Local Officer"}
                  {isAssociationHead && "Association"}
                  {isVPOffice && "VP Office"}
                </Badge>
              )}
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}