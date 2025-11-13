import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Ministers from "./pages/Ministers";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PendingApproval from "./pages/PendingApproval";
import SuperAdmin from "./pages/SuperAdmin";
import UserManagementPage from "./pages/UserManagementPage";
import Profile from "./pages/Profile";
import ActivityLogs from "./pages/ActivityLogs";
import Admissions from "./pages/Admissions";
import AdmissionForm from "./pages/AdmissionForm";
import AdminAdmissions from "./pages/AdminAdmissions";
import Apply from "./pages/Apply";
import ApplyAuth from "./pages/ApplyAuth";
import ApplicantPortal from "./pages/ApplicantPortal";
import FinancePortal from "./pages/FinancePortal";
import LocalOfficerDashboard from "./pages/LocalOfficerDashboard";
import AssociationDashboard from "./pages/AssociationDashboard";
import VPOfficeDashboard from "./pages/VPOfficeDashboard";
import ResponsiveLayout from "./components/ResponsiveLayout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending" replace />;
  }

  return <ResponsiveLayout>{children}</ResponsiveLayout>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <ResponsiveLayout>{children}</ResponsiveLayout>;
};

const RoleBasedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { user, loading, isApproved, isSuperAdmin, isLocalOfficer, isAssociationHead, isVPOffice } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending" replace />;
  }

  const hasRole = allowedRoles.some(role => {
    switch (role) {
      case 'super_admin': return isSuperAdmin;
      case 'local_officer': return isLocalOfficer;
      case 'association_head': return isAssociationHead;
      case 'vp_office': return isVPOffice;
      default: return false;
    }
  });

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return <ResponsiveLayout>{children}</ResponsiveLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
        <Route path="/apply-auth" element={<ApplyAuth />} />
        <Route path="/applicant-portal" element={<ApplicantPortal />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route
              path="/super-admin"
              element={
                <SuperAdminRoute>
                  <SuperAdmin />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <SuperAdminRoute>
                  <UserManagementPage />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ministers"
              element={
                <ProtectedRoute>
                  <Ministers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-logs"
              element={
                <SuperAdminRoute>
                  <ActivityLogs />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admissions"
              element={
                <ProtectedRoute>
                  <Admissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions/:id"
              element={
                <ProtectedRoute>
                  <AdmissionForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions/:id/edit"
              element={
                <ProtectedRoute>
                  <AdmissionForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/admissions"
              element={
                <SuperAdminRoute>
                  <AdminAdmissions />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <FinancePortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/local-officer"
              element={
                <RoleBasedRoute allowedRoles={['local_officer', 'super_admin']}>
                  <LocalOfficerDashboard />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/association"
              element={
                <RoleBasedRoute allowedRoles={['association_head', 'super_admin']}>
                  <AssociationDashboard />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/vp-office"
              element={
                <RoleBasedRoute allowedRoles={['vp_office', 'super_admin']}>
                  <VPOfficeDashboard />
                </RoleBasedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
