import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Filter, CheckCircle, XCircle, ArrowRight, Loader2, ClipboardCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApplicationReviewDialog } from "@/components/admissions/ApplicationReviewDialog";
import { format } from "date-fns";

export default function AdmissionReview() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Fetch applications with real-time updates
  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ["admission-review-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, application_documents(*)")
        .in("status", ["submitted", "local_screening", "association_approved", "vp_review", "interview_scheduled"])
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admission-review-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      app.church_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesLevel = levelFilter === "all" || app.admission_level === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  // Statistics
  const stats = {
    total: applications.length,
    submitted: applications.filter(a => a.status === "submitted").length,
    localScreening: applications.filter(a => a.status === "local_screening").length,
    associationApproved: applications.filter(a => a.status === "association_approved").length,
    vpReview: applications.filter(a => a.status === "vp_review").length,
    interviewScheduled: applications.filter(a => a.status === "interview_scheduled").length,
  };

  // Toggle selection
  const toggleSelection = (appId: string) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedApps.size === filteredApps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(filteredApps.map(app => app.id)));
    }
  };

  // Batch actions
  const handleBatchAction = async (action: string) => {
    if (selectedApps.size === 0) {
      toast.error("Please select at least one application");
      return;
    }

    try {
      const updates: any = {};
      
      switch (action) {
        case "approve":
          updates.status = "approved";
          break;
        case "reject":
          updates.status = "rejected";
          break;
        case "local_screening":
          updates.status = "local_screening";
          break;
        case "association_approved":
          updates.status = "association_approved";
          break;
        case "vp_review":
          updates.status = "vp_review";
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from("applications")
        .update(updates)
        .in("id", Array.from(selectedApps));

      if (error) throw error;

      toast.success(`${selectedApps.size} application(s) updated successfully`);
      setSelectedApps(new Set());
      refetch();
    } catch (error: any) {
      toast.error("Failed to update applications");
      console.error(error);
    }
  };

  const updateApplicationStatus = async (appId: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (notes) updates.admin_notes = notes;

      const { data: appData } = await supabase
        .from("applications")
        .select("phone, full_name")
        .eq("id", appId)
        .single();

      const { error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", appId);

      if (error) throw error;

      if (appData) {
        await supabase.functions.invoke('notify-status-change', {
          body: {
            applicationId: appId,
            status: status,
            recipientPhone: appData.phone,
            recipientName: appData.full_name
          }
        });
      }

      toast.success("Application updated successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to update application");
      console.error(error);
    }
  };

  const scheduleInterview = async (appId: string, date: string, location: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          interview_date: date,
          interview_location: location,
          status: "interview_scheduled",
        })
        .eq("id", appId);

      if (error) throw error;
      toast.success("Interview scheduled successfully");
      refetch();
    } catch (error: any) {
      toast.error("Failed to schedule interview");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
      submitted: { variant: "default", color: "bg-blue-500" },
      local_screening: { variant: "secondary", color: "bg-yellow-500" },
      association_approved: { variant: "outline", color: "bg-green-500" },
      vp_review: { variant: "secondary", color: "bg-purple-500" },
      interview_scheduled: { variant: "default", color: "bg-cyan-500" },
    };

    const config = variants[status] || { variant: "outline" as const, color: "bg-gray-500" };
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Admission Review Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and process pending admission applications
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-xs text-muted-foreground">Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.localScreening}</div>
            <div className="text-xs text-muted-foreground">Local Screening</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.associationApproved}</div>
            <div className="text-xs text-muted-foreground">Assoc. Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.vpReview}</div>
            <div className="text-xs text-muted-foreground">VP Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-cyan-600">{stats.interviewScheduled}</div>
            <div className="text-xs text-muted-foreground">Interview Set</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="local_screening">Local Screening</SelectItem>
                <SelectItem value="association_approved">Association Approved</SelectItem>
                <SelectItem value="vp_review">VP Review</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="licensing">Licensing</SelectItem>
                <SelectItem value="recognition">Recognition</SelectItem>
                <SelectItem value="ordination">Ordination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Batch Actions */}
          {selectedApps.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-sm font-medium">
                {selectedApps.size} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBatchAction("local_screening")}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Move to Local Screening
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBatchAction("association_approved")}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Move to Association
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBatchAction("vp_review")}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Move to VP Review
                </Button>
                <Button size="sm" variant="default" onClick={() => handleBatchAction("approve")}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBatchAction("reject")}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredApps.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedApps.size === filteredApps.length && filteredApps.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Association</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedApps.has(app.id)}
                          onCheckedChange={() => toggleSelection(app.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{app.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {app.admission_level.charAt(0).toUpperCase() + app.admission_level.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{app.church_name}</TableCell>
                      <TableCell className="text-sm">{app.association}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {app.submitted_at ? format(new Date(app.submitted_at), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(app);
                            setReviewDialogOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No applications found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedApplication && (
        <ApplicationReviewDialog
          application={selectedApplication}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          onUpdateStatus={updateApplicationStatus}
          onScheduleInterview={scheduleInterview}
        />
      )}
    </div>
  );
}
