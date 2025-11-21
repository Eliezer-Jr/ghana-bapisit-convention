import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, FolderOpen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWatermark from "@/assets/logo-watermark.png";
import { YearFolderCard } from "@/components/admissions/YearFolderCard";
import { YearApplicationsView } from "@/components/admissions/YearApplicationsView";

export default function AdminAdmissions() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

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

  // Group applications by academic year
  const getAcademicYear = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    // Academic year starts in September (month 8)
    if (month >= 8) {
      return `${year}/${year + 1}`;
    }
    return `${year - 1}/${year}`;
  };

  const groupedByYear = applications.reduce((acc, app) => {
    const year = getAcademicYear(app.submitted_at || app.created_at);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(app);
    return acc;
  }, {} as Record<string, any[]>);

  const years = Object.keys(groupedByYear).sort((a, b) => {
    const yearA = parseInt(a.split('/')[0]);
    const yearB = parseInt(b.split('/')[0]);
    return yearB - yearA; // Most recent first
  });

  const getYearStats = (apps: any[]) => {
    return {
      total: apps.length,
      submitted: apps.filter(a => a.status === "submitted" || a.status === "local_screening").length,
      approved: apps.filter(a => a.status === "approved").length,
      rejected: apps.filter(a => a.status === "rejected").length,
      inReview: apps.filter(a => ["association_approved", "vp_review", "interview_scheduled"].includes(a.status)).length,
    };
  };

  const exportToExcel = (apps: any[]) => {
    try {
      const exportData = apps.map(app => ({
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

  const exportToPDF = async (apps: any[]) => {
    if (apps.length === 0) {
      toast.error("No applications to export");
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      
      // Load and convert image to base64
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Add watermark (centered, semi-transparent)
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const imgWidth = 100;
          const imgHeight = 100;
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;
          
          // Add watermark with reduced opacity
          doc.saveGraphicsState();
          (doc as any).setGState(new (doc as any).GState({ opacity: 0.1 }));
          doc.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
          doc.restoreGraphicsState();
          
          // Add logo at top left
          doc.addImage(img, 'PNG', 14, 8, 25, 25);
          
          resolve(true);
        };
        img.onerror = reject;
        img.src = logoWatermark;
      });
      
      // Add title next to logo
      doc.setFontSize(18);
      doc.text('Admission Applications Report', 45, 15);
      
      // Add date and stats
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 45, 22);
      doc.text(`Total Applications: ${apps.length}`, 45, 28);
      
      // Prepare table data
      const tableData = apps.map((app) => [
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
        startY: 38,
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
    } catch (error: any) {
      toast.error("Failed to schedule interview");
      console.error(error);
    }
  };

  // If a year is selected, show that year's applications
  if (selectedYear) {
    const yearApps = groupedByYear[selectedYear] || [];
    return (
      <YearApplicationsView
        year={selectedYear}
        applications={yearApps}
        onBack={() => setSelectedYear(null)}
        onUpdateStatus={updateApplicationStatus}
        onScheduleInterview={scheduleInterview}
        onExportExcel={() => exportToExcel(yearApps)}
        onExportPDF={() => exportToPDF(yearApps)}
      />
    );
  }

  // Main folder view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            Admission Applications
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse applications organized by academic year
          </p>
        </div>
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

      {/* Year Folders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Applications by Academic Year</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : years.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {years.map((year) => {
              const stats = getYearStats(groupedByYear[year]);
              return (
                <YearFolderCard
                  key={year}
                  year={year}
                  totalApps={stats.total}
                  submitted={stats.submitted}
                  approved={stats.approved}
                  rejected={stats.rejected}
                  inReview={stats.inReview}
                  onClick={() => setSelectedYear(year)}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No applications found</p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
