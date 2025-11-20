import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Search, Calendar, CheckCircle, XCircle, Loader2, Download, Filter } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function AdminAdmissions() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssociation, setFilterAssociation] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, filterLevel, filterStatus, filterAssociation, applications]);

  const { data: approvedApplicants, isLoading: loadingApproved } = useQuery({
    queryKey: ["approved-applicants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approved_applicants")
        .select(`
          *,
          profiles(full_name),
          applications(id, full_name, status, submitted_at)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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
        app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.church_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.phone?.includes(searchTerm) ||
        app.sector?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter((app) => app.admission_level === filterLevel);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((app) => app.status === filterStatus);
    }

    if (filterAssociation !== "all") {
      filtered = filtered.filter((app) => app.association === filterAssociation);
    }

    setFilteredApps(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredApps.map(app => ({
        'Full Name': app.full_name,
        'Email': app.email,
        'Phone': app.phone,
        'Church': app.church_name,
        'Association': app.association,
        'Sector': app.sector,
        'Fellowship': app.fellowship,
        'Admission Level': app.admission_level,
        'Status': app.status,
        'Date of Birth': app.date_of_birth,
        'Marital Status': app.marital_status,
        'Submitted At': app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A',
        'Theological Institution': app.theological_institution || 'N/A',
        'Theological Qualification': app.theological_qualification || 'N/A',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Applications');
      
      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row] || '').length)))
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `applications_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Applications exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export applications");
    }
  };

  const exportToPDF = () => {
    if (filteredApps.length === 0) {
      toast.error("No applications to export");
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      
      // Add title
      doc.setFontSize(18);
      doc.text('Admission Applications Report', 14, 15);
      
      // Add date and stats
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
      doc.text(`Total Applications: ${filteredApps.length}`, 14, 28);
      
      // Prepare table data
      const tableData = filteredApps.map((app) => [
        app.full_name,
        app.admission_level.charAt(0).toUpperCase() + app.admission_level.slice(1),
        app.church_name,
        app.association,
        app.sector,
        app.phone,
        app.status.replace('_', ' ').toUpperCase(),
        app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'
      ]);

      // Add table
      autoTable(doc, {
        head: [['Name', 'Level', 'Church', 'Association', 'Sector', 'Phone', 'Status', 'Submitted']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
          7: { cellWidth: 25 }
        }
      });

      doc.save(`applications_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  // Get unique associations for filter
  const associations = Array.from(new Set(applications.map(app => app.association).filter(Boolean)));

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

        {/* Approved Applicants */}
        <Card>
          <CardHeader>
            <CardTitle>Approved Phone Numbers</CardTitle>
            <CardDescription>
              List of phone numbers approved to apply (managed by Finance)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingApproved ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : approvedApplicants && approvedApplicants.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applicant Name</TableHead>
                      <TableHead>App Status</TableHead>
                      <TableHead>Date Approved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedApplicants.map((applicant) => (
                      <TableRow key={applicant.id}>
                        <TableCell className="font-mono text-sm">
                          {applicant.phone_number}
                        </TableCell>
                        <TableCell>
                          {applicant.used ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <CheckCircle className="h-3 w-3" />
                              Applied
                            </Badge>
                          ) : (
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <XCircle className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {applicant.applications?.full_name || "-"}
                        </TableCell>
                        <TableCell>
                          {applicant.applications ? (
                            <Badge variant="outline" className="text-xs">
                              {applicant.applications.status}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(applicant.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No approved applicants yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, church, email, phone, sector..."
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
                <Label htmlFor="association">Association</Label>
                <Select value={filterAssociation} onValueChange={setFilterAssociation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Associations</SelectItem>
                    {associations.map(assoc => (
                      <SelectItem key={assoc} value={assoc}>{assoc}</SelectItem>
                    ))}
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="local_screening">Local Screening</SelectItem>
                    <SelectItem value="association_approved">Association Approved</SelectItem>
                    <SelectItem value="vp_review">VP Review</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={exportToExcel} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
              {(searchTerm || filterLevel !== "all" || filterStatus !== "all" || filterAssociation !== "all") && (
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterLevel("all");
                    setFilterStatus("all");
                    setFilterAssociation("all");
                  }} 
                  variant="ghost"
                >
                  Clear Filters
                </Button>
              )}
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Association</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.full_name}</TableCell>
                      <TableCell className="font-mono text-sm">{app.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{app.admission_level?.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{app.church_name}</TableCell>
                      <TableCell className="text-sm">{app.association}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-sm">
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
            
            {/* Pagination */}
            {filteredApps.length > itemsPerPage && (
              <div className="mt-6 flex items-center justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.ceil(filteredApps.length / itemsPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first, last, current, and adjacent pages
                        const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
                        return page === 1 || 
                               page === totalPages || 
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => (
                        <>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <PaginationItem key={`ellipsis-${page}`}>
                              <span className="px-4">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      ))
                    }
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredApps.length / itemsPerPage), p + 1))}
                        className={currentPage === Math.ceil(filteredApps.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground mt-4 text-center">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredApps.length)} to {Math.min(currentPage * itemsPerPage, filteredApps.length)} of {filteredApps.length} applications
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
