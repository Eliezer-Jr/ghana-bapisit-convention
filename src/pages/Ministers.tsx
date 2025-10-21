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
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Minister
          </Button>
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
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredMinisters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No ministers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMinisters.map((minister) => (
                  <TableRow key={minister.id}>
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
    </Layout>
  );
};

export default Ministers;
