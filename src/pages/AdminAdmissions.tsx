import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Search, Calendar, CheckCircle, XCircle } from "lucide-react";

export default function AdminAdmissions() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, filterLevel, filterStatus, applications]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*, application_documents(*)")
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

  const filterApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter((app) =>
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.church_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter((app) => app.admission_level === filterLevel);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((app) => app.status === filterStatus);
    }

    setFilteredApps(filtered);
  };

  const updateApplicationStatus = async (appId: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (notes) updates.admin_notes = notes;

      const { error } = await supabase
        .from("applications")
        .update(updates)
        .eq("id", appId);

      if (error) throw error;
      toast.success("Application updated successfully");
      fetchApplications();
      setDialogOpen(false);
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
      fetchApplications();
      setDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to schedule interview");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      submitted: "default",
      under_review: "default",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const stats = {
    total: applications.length,
    submitted: applications.filter(a => a.status === "submitted").length,
    underReview: applications.filter(a => a.status === "under_review").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admission Applications Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage ministerial admission applications</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.underReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, church, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="licensing">Licensing</SelectItem>
                    <SelectItem value="recognition">Recognition</SelectItem>
                    <SelectItem value="ordination">Ordination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="screening_scheduled">Screening Scheduled</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">Loading applications...</div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No applications found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{app.admission_level.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{app.church_name}</TableCell>
                      <TableCell>{app.sector}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Not submitted"}
                      </TableCell>
                      <TableCell>
                        <Dialog open={dialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (open) setSelectedApp(app);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Review</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Review - {app.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Application Details */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Email</p>
                                  <p className="text-muted-foreground">{app.email}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Phone</p>
                                  <p className="text-muted-foreground">{app.phone}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Date of Birth</p>
                                  <p className="text-muted-foreground">{new Date(app.date_of_birth).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Marital Status</p>
                                  <p className="text-muted-foreground">{app.marital_status || "N/A"}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Association</p>
                                  <p className="text-muted-foreground">{app.association}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Fellowship</p>
                                  <p className="text-muted-foreground">{app.fellowship}</p>
                                </div>
                              </div>

                              {/* Documents */}
                              <div>
                                <p className="font-medium mb-2">Uploaded Documents ({app.application_documents?.length || 0})</p>
                                <div className="space-y-1 text-sm">
                                  {app.application_documents?.map((doc: any) => (
                                    <div key={doc.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                      <span>{doc.document_type}</span>
                                      <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        View
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Status Update */}
                              <div>
                                <Label>Update Status</Label>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateApplicationStatus(app.id, "under_review")}
                                  >
                                    Under Review
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateApplicationStatus(app.id, "screening_scheduled")}
                                  >
                                    Schedule Screening
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => updateApplicationStatus(app.id, "approved")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateApplicationStatus(app.id, "rejected")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>

                              {/* Admin Notes */}
                              <div>
                                <Label htmlFor="admin_notes">Admin Notes</Label>
                                <Textarea
                                  id="admin_notes"
                                  defaultValue={app.admin_notes || ""}
                                  rows={3}
                                  placeholder="Add notes about this application..."
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
}
