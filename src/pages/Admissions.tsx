import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Admissions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error("Failed to load applications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Draft", variant: "secondary" },
      submitted: { label: "Submitted", variant: "default" },
      under_review: { label: "Under Review", variant: "default" },
      screening_scheduled: { label: "Screening Scheduled", variant: "default" },
      screening_passed: { label: "Screening Passed", variant: "default" },
      interview_scheduled: { label: "Interview Scheduled", variant: "default" },
      approved: { label: "Approved", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "rejected") return <XCircle className="h-5 w-5 text-red-600" />;
    if (status === "draft") return <FileText className="h-5 w-5 text-muted-foreground" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-1">Track your ministerial admission applications</p>
        </div>

        {/* Important Information */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">Applications are submitted outside this portal. Use this page to track the status of your submitted applications.</p>
            <div className="grid md:grid-cols-2 gap-2 mt-4 pt-4 border-t">
              <div>
                <p className="font-medium text-foreground">Application Deadline</p>
                <p className="text-muted-foreground">January 24, 2025</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Age Limit</p>
                <p className="text-muted-foreground">Maximum 45 years for Licensing</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Processing Fee</p>
                <p className="text-muted-foreground">GH₵ 850.00 (Non-Refundable)</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Gazette Fee</p>
                <p className="text-muted-foreground">GH₵ 750.00 (Refundable)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">Loading applications...</div>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
              <p className="text-muted-foreground">You don't have any applications yet. Applications are submitted through the official admission process.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(app.status)}
                      <div>
                        <CardTitle className="text-lg">{app.admission_level.toUpperCase()}</CardTitle>
                        <CardDescription>{app.full_name}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Church</p>
                      <p className="font-medium">{app.church_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Association</p>
                      <p className="font-medium">{app.association}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sector</p>
                      <p className="font-medium">{app.sector}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Submitted</p>
                      <p className="font-medium">
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Not yet"}
                      </p>
                    </div>
                  </div>
                  {app.interview_date && (
                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                      <p className="text-sm font-medium">Interview Scheduled</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(app.interview_date).toLocaleDateString()} at {app.interview_location}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/admissions/${app.id}`)}
                    >
                      View Details
                    </Button>
                    {app.status === "draft" && (
                      <Button onClick={() => navigate(`/admissions/${app.id}/edit`)}>
                        Continue Application
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
