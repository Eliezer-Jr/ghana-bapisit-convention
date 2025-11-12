import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationReviewCard } from "@/components/ApplicationReviewCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle, XCircle, Calendar } from "lucide-react";

export default function VPOfficeDashboard() {
  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ["vp-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const pendingApplications = applications?.filter(app => app.status === "association_approved") || [];
  const reviewedApplications = applications?.filter(app => app.status === "vp_review") || [];
  const interviewScheduledApplications = applications?.filter(app => app.status === "interview_scheduled") || [];
  const approvedApplications = applications?.filter(app => app.status === "approved") || [];
  const rejectedApplications = applications?.filter(app => app.status === "rejected") || [];

  const statsByLevel = applications?.reduce((acc, app) => {
    const level = app.admission_level;
    if (!acc[level]) acc[level] = 0;
    acc[level]++;
    return acc;
  }, {} as Record<string, number>) || {};

  const statsBySector = applications?.reduce((acc, app) => {
    if (app.sector) {
      if (!acc[app.sector]) acc[app.sector] = 0;
      acc[app.sector]++;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">VP Office Dashboard</h1>
        <p className="text-muted-foreground">Final review and approval of ministerial applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewedApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interview Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviewScheduledApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedApplications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedApplications.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Admission Level</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(statsByLevel).map(([level, count]) => (
              <Badge key={level} variant="secondary">
                {level}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Sector</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(statsBySector).map(([sector, count]) => (
              <Badge key={sector} variant="secondary">
                {sector}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({reviewedApplications.length})</TabsTrigger>
          <TabsTrigger value="interview">Interview ({interviewScheduledApplications.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedApplications.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No pending applications</p>
              </CardContent>
            </Card>
          ) : (
            pendingApplications.map((app) => (
              <ApplicationReviewCard
                key={app.id}
                application={app}
                onUpdate={refetch}
                reviewerRole="vp_office"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedApplications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No reviewed applications</p>
              </CardContent>
            </Card>
          ) : (
            reviewedApplications.map((app) => (
              <ApplicationReviewCard
                key={app.id}
                application={app}
                onUpdate={refetch}
                reviewerRole="vp_office"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="interview" className="space-y-4">
          {interviewScheduledApplications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No interviews scheduled</p>
              </CardContent>
            </Card>
          ) : (
            interviewScheduledApplications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{app.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Level:</strong> {app.admission_level}</p>
                    <p className="text-sm"><strong>Sector:</strong> {app.sector}</p>
                    <p className="text-sm"><strong>Church:</strong> {app.church_name}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedApplications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No approved applications</p>
              </CardContent>
            </Card>
          ) : (
            approvedApplications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{app.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Level:</strong> {app.admission_level}</p>
                    <p className="text-sm"><strong>Sector:</strong> {app.sector}</p>
                    <p className="text-sm"><strong>Church:</strong> {app.church_name}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApplications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No rejected applications</p>
              </CardContent>
            </Card>
          ) : (
            rejectedApplications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{app.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Rejected on {new Date(app.vp_reviewed_at || "").toLocaleDateString()}
                  </p>
                  {app.rejection_reason && (
                    <p className="mt-2 text-sm">Reason: {app.rejection_reason}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
