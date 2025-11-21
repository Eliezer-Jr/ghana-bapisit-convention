import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, TrendingUp, Users, Calendar, Heart, UserCheck } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWatermark from "@/assets/logo-watermark.png";
import { differenceInYears } from "date-fns";

interface Minister {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  marital_status: string | null;
  association: string | null;
  sector: string | null;
  fellowship: string | null;
  date_joined: string;
  status: string;
  ordination_year: number | null;
  recognition_year: number | null;
  licensing_year: number | null;
  location: string | null;
  role: string;
  phone: string | null;
  email: string | null;
}

interface ReportFilters {
  association: string;
  sector: string;
  fellowship: string;
  ageGroup: string;
  maritalStatus: string;
  status: string;
  joinedYear: string;
  retirementStatus: string;
}

const Reports = () => {
  const [ministers, setMinisters] = useState<Minister[]>([]);
  const [filteredMinisters, setFilteredMinisters] = useState<Minister[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    association: "all",
    sector: "all",
    fellowship: "all",
    ageGroup: "all",
    maritalStatus: "all",
    status: "all",
    joinedYear: "all",
    retirementStatus: "all",
  });

  // Unique values for dropdowns
  const [associations, setAssociations] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [fellowships, setFellowships] = useState<string[]>([]);
  const [joinedYears, setJoinedYears] = useState<string[]>([]);

  useEffect(() => {
    fetchMinisters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ministers, filters]);

  const fetchMinisters = async () => {
    try {
      const { data, error } = await supabase
        .from("ministers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setMinisters(data || []);
      
      // Extract unique values for filters
      const uniqueAssociations = [...new Set(data?.map(m => m.association).filter(Boolean))] as string[];
      const uniqueSectors = [...new Set(data?.map(m => m.sector).filter(Boolean))] as string[];
      const uniqueFellowships = [...new Set(data?.map(m => m.fellowship).filter(Boolean))] as string[];
      const uniqueYears = [...new Set(data?.map(m => new Date(m.date_joined).getFullYear().toString()))] as string[];
      
      setAssociations(uniqueAssociations.sort());
      setSectors(uniqueSectors.sort());
      setFellowships(uniqueFellowships.sort());
      setJoinedYears(uniqueYears.sort());
    } catch (error: any) {
      toast.error("Error loading ministers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  const isNearingRetirement = (dateOfBirth: string | null) => {
    const age = calculateAge(dateOfBirth);
    return age !== null && age >= 55 && age < 60;
  };

  const isRetirementAge = (dateOfBirth: string | null) => {
    const age = calculateAge(dateOfBirth);
    return age !== null && age >= 60;
  };

  const isNewMinister = (dateJoined: string) => {
    const joinedDate = new Date(dateJoined);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return joinedDate > oneYearAgo;
  };

  const applyFilters = () => {
    let filtered = [...ministers];

    // Association filter
    if (filters.association !== "all") {
      filtered = filtered.filter(m => m.association === filters.association);
    }

    // Sector filter
    if (filters.sector !== "all") {
      filtered = filtered.filter(m => m.sector === filters.sector);
    }

    // Fellowship filter
    if (filters.fellowship !== "all") {
      filtered = filtered.filter(m => m.fellowship === filters.fellowship);
    }

    // Age group filter
    if (filters.ageGroup !== "all") {
      filtered = filtered.filter(m => {
        const age = calculateAge(m.date_of_birth);
        if (age === null) return false;
        
        switch (filters.ageGroup) {
          case "under30": return age < 30;
          case "30-40": return age >= 30 && age < 40;
          case "40-50": return age >= 40 && age < 50;
          case "50-60": return age >= 50 && age < 60;
          case "over60": return age >= 60;
          default: return true;
        }
      });
    }

    // Marital status filter
    if (filters.maritalStatus !== "all") {
      filtered = filtered.filter(m => m.marital_status === filters.maritalStatus);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    // Joined year filter
    if (filters.joinedYear !== "all") {
      filtered = filtered.filter(m => 
        new Date(m.date_joined).getFullYear().toString() === filters.joinedYear
      );
    }

    // Retirement status filter
    if (filters.retirementStatus !== "all") {
      filtered = filtered.filter(m => {
        switch (filters.retirementStatus) {
          case "nearing": return isNearingRetirement(m.date_of_birth);
          case "retirement": return isRetirementAge(m.date_of_birth);
          case "new": return isNewMinister(m.date_joined);
          default: return true;
        }
      });
    }

    setFilteredMinisters(filtered);
  };

  const resetFilters = () => {
    setFilters({
      association: "all",
      sector: "all",
      fellowship: "all",
      ageGroup: "all",
      maritalStatus: "all",
      status: "all",
      joinedYear: "all",
      retirementStatus: "all",
    });
  };

  const getStatistics = () => {
    const total = filteredMinisters.length;
    const active = filteredMinisters.filter(m => m.status === "active").length;
    const married = filteredMinisters.filter(m => m.marital_status === "married").length;
    const single = filteredMinisters.filter(m => m.marital_status === "single").length;
    const nearRetirement = filteredMinisters.filter(m => isNearingRetirement(m.date_of_birth)).length;
    const retired = filteredMinisters.filter(m => isRetirementAge(m.date_of_birth)).length;
    const newMinisters = filteredMinisters.filter(m => isNewMinister(m.date_joined)).length;
    const ordained = filteredMinisters.filter(m => m.ordination_year).length;
    const recognized = filteredMinisters.filter(m => m.recognition_year).length;
    const licensed = filteredMinisters.filter(m => m.licensing_year).length;

    const averageAge = filteredMinisters.reduce((sum, m) => {
      const age = calculateAge(m.date_of_birth);
      return age !== null ? sum + age : sum;
    }, 0) / filteredMinisters.filter(m => m.date_of_birth).length;

    return {
      total,
      active,
      married,
      single,
      nearRetirement,
      retired,
      newMinisters,
      ordained,
      recognized,
      licensed,
      averageAge: isNaN(averageAge) ? 0 : Math.round(averageAge),
    };
  };

  const exportPDF = async () => {
    if (filteredMinisters.length === 0) {
      toast.error("No ministers to export");
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      const stats = getStatistics();
      
      // Load and add logo
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Add watermark
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const imgWidth = 100;
          const imgHeight = 100;
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;
          
          doc.saveGraphicsState();
          (doc as any).setGState(new (doc as any).GState({ opacity: 0.1 }));
          doc.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
          doc.restoreGraphicsState();
          
          // Add logo at top
          doc.addImage(img, 'PNG', 14, 8, 25, 25);
          resolve(true);
        };
        img.onerror = reject;
        img.src = logoWatermark;
      });
      
      // Title
      doc.setFontSize(18);
      doc.text('Ministers Report', 45, 15);
      
      // Filters applied
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 45, 22);
      
      // Statistics summary
      doc.setFontSize(12);
      doc.text('Report Statistics', 14, 40);
      doc.setFontSize(9);
      doc.text(`Total Ministers: ${stats.total} | Active: ${stats.active} | Married: ${stats.married} | Single: ${stats.single}`, 14, 46);
      doc.text(`Near Retirement (55-59): ${stats.nearRetirement} | Retirement Age (60+): ${stats.retired} | New (Last Year): ${stats.newMinisters}`, 14, 51);
      doc.text(`Ordained: ${stats.ordained} | Recognized: ${stats.recognized} | Licensed: ${stats.licensed} | Average Age: ${stats.averageAge}`, 14, 56);
      
      // Table data
      const tableData = filteredMinisters.map((minister) => {
        const age = calculateAge(minister.date_of_birth);
        return [
          minister.full_name,
          age !== null ? age.toString() : "-",
          minister.marital_status || "-",
          minister.association || "-",
          minister.sector || "-",
          minister.status,
          new Date(minister.date_joined).getFullYear(),
          isNearingRetirement(minister.date_of_birth) ? "Yes" : isRetirementAge(minister.date_of_birth) ? "Retired" : "No",
        ];
      });

      autoTable(doc, {
        head: [['Name', 'Age', 'Marital Status', 'Association', 'Sector', 'Status', 'Joined', 'Retirement']],
        body: tableData,
        startY: 62,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`ministers_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const stats = getStatistics();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ministers Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Generate comprehensive reports based on various criteria
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={resetFilters} variant="outline">
              Reset Filters
            </Button>
            <Button onClick={exportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Total Ministers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.active} active</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                New Ministers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.newMinisters}</div>
              <p className="text-xs text-muted-foreground mt-1">Joined last year</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                Near Retirement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.nearRetirement}</div>
              <p className="text-xs text-muted-foreground mt-1">Ages 55-59 years</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Marital Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.married}</div>
              <p className="text-xs text-muted-foreground mt-1">Married / {stats.single} Single</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ordination Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ordained</span>
                <Badge>{stats.ordained}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Recognized</span>
                <Badge variant="secondary">{stats.recognized}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Licensed</span>
                <Badge variant="outline">{stats.licensed}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Age Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Age</span>
                <Badge>{stats.averageAge} years</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Retirement Age (60+)</span>
                <Badge variant="destructive">{stats.retired}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active</span>
                <Badge>{stats.active}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Inactive</span>
                <Badge variant="secondary">{stats.total - stats.active}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <CardDescription>
              Apply filters to generate specific reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Association */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Association</label>
                <Select value={filters.association} onValueChange={(value) => setFilters({...filters, association: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Associations" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Associations</SelectItem>
                    {associations.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sector</label>
                <Select value={filters.sector} onValueChange={(value) => setFilters({...filters, sector: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fellowship */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fellowship</label>
                <Select value={filters.fellowship} onValueChange={(value) => setFilters({...filters, fellowship: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Fellowships" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Fellowships</SelectItem>
                    {fellowships.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age Group */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Age Group</label>
                <Select value={filters.ageGroup} onValueChange={(value) => setFilters({...filters, ageGroup: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Ages" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="under30">Under 30</SelectItem>
                    <SelectItem value="30-40">30-40 years</SelectItem>
                    <SelectItem value="40-50">40-50 years</SelectItem>
                    <SelectItem value="50-60">50-60 years</SelectItem>
                    <SelectItem value="over60">Over 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Marital Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Marital Status</label>
                <Select value={filters.maritalStatus} onValueChange={(value) => setFilters({...filters, maritalStatus: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minister Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Minister Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Joined Year */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Joined Year</label>
                <Select value={filters.joinedYear} onValueChange={(value) => setFilters({...filters, joinedYear: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Years</SelectItem>
                    {joinedYears.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Retirement Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Special Categories</label>
                <Select value={filters.retirementStatus} onValueChange={(value) => setFilters({...filters, retirementStatus: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="new">New Ministers (Last Year)</SelectItem>
                    <SelectItem value="nearing">Nearing Retirement (55-59)</SelectItem>
                    <SelectItem value="retirement">Retirement Age (60+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Filtered Results ({filteredMinisters.length} ministers)</CardTitle>
            <CardDescription>
              Preview of ministers matching your filter criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredMinisters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No ministers match the selected filters
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMinisters.slice(0, 50).map((minister) => {
                  const age = calculateAge(minister.date_of_birth);
                  return (
                    <div
                      key={minister.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{minister.full_name}</p>
                        <div className="flex gap-2 mt-1">
                          {age !== null && (
                            <Badge variant="outline" className="text-xs">
                              {age} years
                            </Badge>
                          )}
                          {minister.marital_status && (
                            <Badge variant="outline" className="text-xs">
                              {minister.marital_status}
                            </Badge>
                          )}
                          {minister.association && (
                            <Badge variant="secondary" className="text-xs">
                              {minister.association}
                            </Badge>
                          )}
                          {isNearingRetirement(minister.date_of_birth) && (
                            <Badge variant="destructive" className="text-xs">
                              Nearing Retirement
                            </Badge>
                          )}
                          {isRetirementAge(minister.date_of_birth) && (
                            <Badge variant="destructive" className="text-xs">
                              Retirement Age
                            </Badge>
                          )}
                          {isNewMinister(minister.date_joined) && (
                            <Badge className="text-xs bg-green-500">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{minister.role}</div>
                        <div className="text-xs">{minister.sector || minister.location}</div>
                      </div>
                    </div>
                  );
                })}
                {filteredMinisters.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Showing first 50 of {filteredMinisters.length} results. Export PDF to see all.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;