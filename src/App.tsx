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
import Profile from "./pages/Profile";
import ActivityLogs from "./pages/ActivityLogs";
import Admissions from "./pages/Admissions";
import AdmissionForm from "./pages/AdmissionForm";
import AdminAdmissions from "./pages/AdminAdmissions";
import Apply from "./pages/Apply";
import FinancePortal from "./pages/FinancePortal";
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

  return <>{children}</>;
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

  return <>{children}</>;
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
            <Route path="/apply" element={<Apply />} />
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
              path="/"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Dashboard />
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ministers"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Ministers />
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Messages />
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Profile />
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity-logs"
              element={
                <SuperAdminRoute>
                  <ResponsiveLayout>
                    <ActivityLogs />
                  </ResponsiveLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admissions"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Admissions />
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions/:id"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <AdmissionForm />
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions/:id/edit"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <AdmissionForm />
                  </ResponsiveLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/admissions"
              element={
                <SuperAdminRoute>
                  <ResponsiveLayout>
                    <AdminAdmissions />
                  </ResponsiveLayout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <FinancePortal />
                  </ResponsiveLayout>
                </ProtectedRoute>
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
