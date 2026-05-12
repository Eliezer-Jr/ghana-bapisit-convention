import { ReactNode } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, User, Megaphone, FolderOpen, CreditCard, LogOut } from "lucide-react";
import logoGbcc from "@/assets/logo-gbcc.png";

const items = [
  { to: "/myportal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/myportal/profile", label: "My ID Card", icon: User },
  { to: "/myportal/announcements", label: "Announcements", icon: Megaphone },
  { to: "/myportal/documents", label: "My Data", icon: FolderOpen },
  { to: "/myportal/dues", label: "Dues & Payments", icon: CreditCard },
];

export default function PortalLayout({ children }: { children?: ReactNode }) {
  const { token, minister, signOut, loading } = usePortalAuth();
  const navigate = useNavigate();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!token || !minister) return <Navigate to="/myportal" replace />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/20">
      <aside className="md:w-64 bg-card border-r flex md:flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <img src={logoGbcc} alt="GBCC" className="h-9 w-9" />
          <div className="hidden md:block">
            <p className="font-semibold text-sm">Minister Portal</p>
            <p className="text-xs text-muted-foreground truncate">{minister.full_name}</p>
          </div>
        </div>
        <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
          {items.map(it => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm border-b md:border-b-0 md:border-l-4 ${isActive ? "bg-primary/10 text-primary border-primary md:border-l-primary font-medium" : "text-foreground/70 hover:bg-muted border-transparent"}`
            }>
              <it.icon className="h-4 w-4" />
              <span className="hidden md:inline">{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t hidden md:block">
          <Button variant="outline" className="w-full" onClick={() => { signOut(); navigate("/myportal"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children || <Outlet />}</main>
    </div>
  );
}
