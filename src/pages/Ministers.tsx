import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import MinisterDialog from "@/components/MinisterDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoField } from "@/components/InfoField";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Pencil, Trash2, Eye, Download, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoWatermark from "@/assets/logo-watermark.png";

const Ministers = () => {
  const [ministers, setMinisters] = useState<any[]>([]);
  const [filteredMinisters, setFilteredMinisters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMinister, setSelectedMinister] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ministerToDelete, setMinisterToDelete] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [ministerToView, setMinisterToView] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  useEffect(() => {
    fetchMinisters();
  }, []);

  useEffect(() => {
    filterMinisters();
  }, [ministers, searchQuery, statusFilter]);

  const fetchMinisters = async () => {
    try {
      const { data, error } = await supabase
        .from("ministers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMinisters(data || []);
    } catch (error: any) {
      toast.error("Error loading ministers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterMinisters = () => {
    let filtered = ministers;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.role?.toLowerCase().includes(query) ||
          m.location?.toLowerCase().includes(query)
      );
    }

    setFilteredMinisters(filtered);
  };

  const handleEdit = (minister: any) => {
    setSelectedMinister(minister);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedMinister(null);
    setDialogOpen(true);
  };

  const handleViewClick = (minister: any) => {
    setMinisterToView(minister);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (minister: any) => {
    setMinisterToDelete(minister);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!ministerToDelete) return;

    try {
      const { error } = await supabase
        .from("ministers")
        .delete()
        .eq("id", ministerToDelete.id);

      if (error) throw error;

      toast.success("Minister deleted successfully");
      fetchMinisters();
    } catch (error: any) {
      toast.error("Error deleting minister");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setMinisterToDelete(null);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        full_name: "John Doe",
        email: "john@example.com",
        phone: "+233123456789",
        role: "Pastor",
        location: "Accra",
        status: "active",
        date_joined: "2024-01-01",
        date_of_birth: "1980-01-01",
        marital_status: "Married",
        spouse_name: "Jane Doe",
        marriage_type: "Traditional",
        number_of_children: "2",
        titles: "Rev.",
        gps_address: "GA-123-4567",
        whatsapp: "+233123456789",
        current_church_name: "Grace Church",
        position_at_church: "Senior Pastor",
        church_address: "123 Main St, Accra",
        association: "Greater Accra",
        sector: "Central",
        fellowship: "Morning Fellowship",
        ordination_year: "2010",
        recognition_year: "2008",
        licensing_year: "2006",
        emergency_contact_1_name: "Jane Doe",
        emergency_contact_1_relationship: "Spouse",
        emergency_contact_1_phone: "+233987654321",
        emergency_contact_2_name: "John Doe Jr",
        emergency_contact_2_relationship: "Child",
        emergency_contact_2_phone: "+233456789123",
        notes: "Additional notes here"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ministers Template");
    XLSX.writeFile(wb, "ministers_import_template.xlsx");
    toast.success("Template downloaded successfully");
  };

  const handleExport = async () => {
    if (filteredMinisters.length === 0) {
      toast.error("No ministers to export");
      return;
    }

    // Fetch emergency contacts for all ministers
    const ministerIds = filteredMinisters.map(m => m.id);
    const { data: emergencyContacts } = await supabase
      .from("emergency_contacts")
      .select("*")
      .in("minister_id", ministerIds);

    const exportData = filteredMinisters.map((minister) => {
      const contacts = emergencyContacts?.filter(c => c.minister_id === minister.id) || [];
      return {
        minister_id: minister.minister_id || "",
        full_name: minister.full_name,
        email: minister.email || "",
        phone: minister.phone || "",
        role: minister.role,
        location: minister.location || "",
        status: minister.status,
        date_joined: minister.date_joined,
        date_of_birth: minister.date_of_birth || "",
        marital_status: minister.marital_status || "",
        spouse_name: minister.spouse_name || "",
        marriage_type: minister.marriage_type || "",
        number_of_children: minister.number_of_children || 0,
        titles: minister.titles || "",
        gps_address: minister.gps_address || "",
        whatsapp: minister.whatsapp || "",
        current_church_name: minister.current_church_name || "",
        position_at_church: minister.position_at_church || "",
        church_address: minister.church_address || "",
        association: minister.association || "",
        sector: minister.sector || "",
        fellowship: minister.fellowship || "",
        ordination_year: minister.ordination_year || "",
        recognition_year: minister.recognition_year || "",
        licensing_year: minister.licensing_year || "",
        emergency_contact_1_name: contacts[0]?.contact_name || "",
        emergency_contact_1_relationship: contacts[0]?.relationship || "",
        emergency_contact_1_phone: contacts[0]?.phone_number || "",
        emergency_contact_2_name: contacts[1]?.contact_name || "",
        emergency_contact_2_relationship: contacts[1]?.relationship || "",
        emergency_contact_2_phone: contacts[1]?.phone_number || "",
        notes: minister.notes || ""
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ministers");
    XLSX.writeFile(wb, `ministers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Ministers exported successfully");
  };

  const handleExportPDF = async () => {
    if (filteredMinisters.length === 0) {
      toast.error("No ministers to export");
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
      doc.text('Ministers Directory', 45, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 45, 22);
      doc.text(`Total Ministers: ${filteredMinisters.length}`, 45, 28);
      
      // Prepare table data
      const tableData = filteredMinisters.map((minister) => [
        minister.minister_id || "-",
        minister.full_name,
        minister.role,
        minister.location || "-",
        minister.email || "-",
        minister.phone || "-",
        new Date(minister.date_joined).toLocaleDateString(),
        minister.status.charAt(0).toUpperCase() + minister.status.slice(1)
      ]);

      // Add table
      autoTable(doc, {
        head: [['Minister ID', 'Name', 'Role', 'Location', 'Email', 'Phone', 'Date Joined', 'Status']],
        body: tableData,
        startY: 38,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`ministers_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // sheet_to_json automatically uses first row as headers and skips it
        // Only data rows (row 2 onwards) are converted to JSON objects
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("No data found in the file (header row was skipped)");
          return;
        }

        // Show preview instead of importing directly
        const ministersPreview = jsonData.map((row: any, index: number) => ({
          _rowId: index,
          full_name: row.full_name || "",
          email: row.email || "",
          phone: row.phone || "",
          role: row.role || "",
          location: row.location || "",
          status: row.status || "active",
          date_joined: row.date_joined || new Date().toISOString().split('T')[0],
          date_of_birth: row.date_of_birth || "",
          marital_status: row.marital_status || "",
          spouse_name: row.spouse_name || "",
          marriage_type: row.marriage_type || "",
          number_of_children: row.number_of_children || 0,
          titles: row.titles || "",
          gps_address: row.gps_address || "",
          whatsapp: row.whatsapp || "",
          current_church_name: row.current_church_name || "",
          position_at_church: row.position_at_church || "",
          church_address: row.church_address || "",
          association: row.association || "",
          sector: row.sector || "",
          fellowship: row.fellowship || "",
          ordination_year: row.ordination_year || "",
          recognition_year: row.recognition_year || "",
          licensing_year: row.licensing_year || "",
          emergency_contact_1_name: row.emergency_contact_1_name || "",
          emergency_contact_1_relationship: row.emergency_contact_1_relationship || "",
          emergency_contact_1_phone: row.emergency_contact_1_phone || "",
          emergency_contact_2_name: row.emergency_contact_2_name || "",
          emergency_contact_2_relationship: row.emergency_contact_2_relationship || "",
          emergency_contact_2_phone: row.emergency_contact_2_phone || "",
          notes: row.notes || ""
        }));

        setImportPreview(ministersPreview);
        setShowImportPreview(true);
        toast.success(`Preview ready: ${ministersPreview.length} ministers`);
      } catch (error: any) {
        toast.error("Error reading file: " + error.message);
        console.error(error);
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = ""; // Reset input
  };

  const confirmImport = async () => {
    try {
      const ministersToInsert = importPreview.map(({ 
        _rowId, 
        emergency_contact_1_name,
        emergency_contact_1_relationship,
        emergency_contact_1_phone,
        emergency_contact_2_name,
        emergency_contact_2_relationship,
        emergency_contact_2_phone,
        ...minister 
      }) => minister);

      const { data: insertedMinisters, error } = await supabase
        .from("ministers")
        .insert(ministersToInsert)
        .select();

      if (error) throw error;

      // Now insert emergency contacts
      const emergencyContactsToInsert = [];
      for (let i = 0; i < importPreview.length; i++) {
        const preview = importPreview[i];
        const minister = insertedMinisters![i];
        
        if (preview.emergency_contact_1_name && preview.emergency_contact_1_phone) {
          emergencyContactsToInsert.push({
            minister_id: minister.id,
            contact_name: preview.emergency_contact_1_name,
            relationship: preview.emergency_contact_1_relationship || "",
            phone_number: preview.emergency_contact_1_phone
          });
        }
        
        if (preview.emergency_contact_2_name && preview.emergency_contact_2_phone) {
          emergencyContactsToInsert.push({
            minister_id: minister.id,
            contact_name: preview.emergency_contact_2_name,
            relationship: preview.emergency_contact_2_relationship || "",
            phone_number: preview.emergency_contact_2_phone
          });
        }
      }

      if (emergencyContactsToInsert.length > 0) {
        const { error: contactsError } = await supabase
          .from("emergency_contacts")
          .insert(emergencyContactsToInsert);
        
        if (contactsError) throw contactsError;
      }

      toast.success(`Successfully imported ${ministersToInsert.length} ministers with emergency contacts`);
      setShowImportPreview(false);
      setImportPreview([]);
      fetchMinisters();
    } catch (error: any) {
      toast.error("Error importing ministers: " + error.message);
      console.error(error);
    }
  };

  const updatePreviewCell = (rowId: number, field: string, value: any) => {
    setImportPreview(prev => 
      prev.map(row => 
        row._rowId === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      retired: "secondary",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ministers</h1>
            <p className="text-muted-foreground mt-2">
              Manage minister records and information
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2 relative">
              <Upload className="h-4 w-4" />
              Import
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Minister
            </Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Filter Ministers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, role, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Minister ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                     <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredMinisters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No ministers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMinisters.map((minister) => (
                  <TableRow key={minister.id}>
                        <TableCell className="font-mono text-sm">
                          {minister.minister_id || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={minister.photo_url || undefined} alt={minister.full_name} />
                              <AvatarFallback>{minister.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {minister.full_name}
                          </div>
                        </TableCell>
                        <TableCell>{minister.role}</TableCell>
                        <TableCell>{minister.location || "-"}</TableCell>
                        <TableCell>{minister.email || "-"}</TableCell>
                        <TableCell>{minister.phone || "-"}</TableCell>
                        <TableCell>
                          {new Date(minister.date_joined).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(minister.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewClick(minister)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(minister)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(minister)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <MinisterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        minister={selectedMinister}
        onSuccess={fetchMinisters}
      />

      <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          {ministerToView && (
            <div className="grid md:grid-cols-3 h-full">
              {/* Sidebar with photo and basic info */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={ministerToView.photo_url || undefined} alt={ministerToView.full_name} />
                    <AvatarFallback className="text-4xl font-bold">{ministerToView.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{ministerToView.full_name}</h2>
                    <p className="text-muted-foreground">{ministerToView.role}</p>
                  </div>
                  {getStatusBadge(ministerToView.status)}
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="w-full justify-start">
                      📧 {ministerToView.email || "No email"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="w-full justify-start">
                      📱 {ministerToView.phone || "No phone"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="w-full justify-start">
                      💬 {ministerToView.whatsapp || "No WhatsApp"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div className="md:col-span-2 p-6 overflow-y-auto max-h-[90vh]">
                <AlertDialogHeader className="mb-6">
                  <AlertDialogTitle className="text-2xl">Detailed Information</AlertDialogTitle>
                </AlertDialogHeader>

                <div className="space-y-6">
                  {/* Minister ID & Basic Info */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2">Identification</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoField label="Minister ID" value={ministerToView.minister_id || "-"} />
                      <InfoField label="Titles" value={ministerToView.titles || "-"} />
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoField label="Date of Birth" value={ministerToView.date_of_birth ? new Date(ministerToView.date_of_birth).toLocaleDateString() : "-"} />
                      <InfoField label="Marital Status" value={ministerToView.marital_status || "-"} />
                      <InfoField label="Spouse Name" value={ministerToView.spouse_name || "-"} />
                      <InfoField label="Marriage Type" value={ministerToView.marriage_type || "-"} />
                      <InfoField label="Number of Children" value={ministerToView.number_of_children || "0"} />
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2">Location Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoField label="Location" value={ministerToView.location || "-"} />
                      <InfoField label="GPS Address" value={ministerToView.gps_address || "-"} />
                      <InfoField label="Church Address" value={ministerToView.church_address || "-"} className="col-span-2" />
                    </div>
                  </div>

                  {/* Ministry Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2">Ministry Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoField label="Current Church" value={ministerToView.current_church_name || "-"} />
                      <InfoField label="Position at Church" value={ministerToView.position_at_church || "-"} />
                      <InfoField label="Association" value={ministerToView.association || "-"} />
                      <InfoField label="Sector" value={ministerToView.sector || "-"} />
                      <InfoField label="Fellowship" value={ministerToView.fellowship || "-"} />
                      <InfoField label="Date Joined" value={new Date(ministerToView.date_joined).toLocaleDateString()} />
                    </div>
                  </div>

                  {/* Ordination Information */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary border-b pb-2">Ordination & Credentials</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <InfoField label="Ordination Year" value={ministerToView.ordination_year || "-"} />
                      <InfoField label="Recognition Year" value={ministerToView.recognition_year || "-"} />
                      <InfoField label="Licensing Year" value={ministerToView.licensing_year || "-"} />
                    </div>
                  </div>

                  {/* Notes */}
                  {ministerToView.notes && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-primary border-b pb-2">Notes</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-wrap">{ministerToView.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the minister record for{" "}
              <strong>{ministerToDelete?.full_name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showImportPreview} onOpenChange={setShowImportPreview}>
        <AlertDialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden p-0">
          <AlertDialogHeader className="p-6 pb-4">
            <AlertDialogTitle>Import Preview - {importPreview.length} Ministers</AlertDialogTitle>
            <AlertDialogDescription>
              Review and edit the data before importing. Click on any cell to edit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="overflow-auto max-h-[60vh] px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Full Name</TableHead>
                  <TableHead className="min-w-[150px]">Email</TableHead>
                  <TableHead className="min-w-[120px]">Phone</TableHead>
                  <TableHead className="min-w-[120px]">Role</TableHead>
                  <TableHead className="min-w-[120px]">Location</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importPreview.map((row) => (
                  <TableRow key={row._rowId}>
                    <TableCell>
                      <Input
                        value={row.full_name}
                        onChange={(e) => updatePreviewCell(row._rowId, 'full_name', e.target.value)}
                        className="min-w-[140px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.email}
                        onChange={(e) => updatePreviewCell(row._rowId, 'email', e.target.value)}
                        className="min-w-[140px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.phone}
                        onChange={(e) => updatePreviewCell(row._rowId, 'phone', e.target.value)}
                        className="min-w-[110px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.role}
                        onChange={(e) => updatePreviewCell(row._rowId, 'role', e.target.value)}
                        className="min-w-[110px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.location}
                        onChange={(e) => updatePreviewCell(row._rowId, 'location', e.target.value)}
                        className="min-w-[110px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={row.status} onValueChange={(value) => updatePreviewCell(row._rowId, 'status', value)}>
                        <SelectTrigger className="min-w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AlertDialogFooter className="p-6 pt-4">
            <AlertDialogCancel onClick={() => {
              setShowImportPreview(false);
              setImportPreview([]);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>
              Confirm Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Ministers;
