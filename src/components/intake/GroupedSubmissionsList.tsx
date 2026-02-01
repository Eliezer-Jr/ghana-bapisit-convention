import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";

type IntakeSubmission = {
  id: string;
  session_id: string;
  invite_id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  payload: Record<string, any>;
};

interface Props {
  submissions: IntakeSubmission[];
  isLoading: boolean;
  onReview: (submission: IntakeSubmission) => void;
}

type SortField = "status" | "name" | "phone" | "submitted_at" | "reviewed_at";
type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const STATUS_OPTIONS = ["all", "draft", "submitted", "approved", "rejected"];

export function GroupedSubmissionsList({ submissions, isLoading, onReview }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("submitted_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Status filter
      if (statusFilter !== "all" && sub.status !== statusFilter) {
        return false;
      }
      // Search filter (name or phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (sub.payload?.full_name || "").toLowerCase();
        const phone = (sub.payload?.phone || "").toLowerCase();
        if (!name.includes(query) && !phone.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, searchQuery, statusFilter]);

  // Sort submissions
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      let aValue: string | null = null;
      let bValue: string | null = null;

      switch (sortField) {
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "name":
          aValue = a.payload?.full_name || "";
          bValue = b.payload?.full_name || "";
          break;
        case "phone":
          aValue = a.payload?.phone || "";
          bValue = b.payload?.phone || "";
          break;
        case "submitted_at":
          aValue = a.submitted_at || "";
          bValue = b.submitted_at || "";
          break;
        case "reviewed_at":
          aValue = a.reviewed_at || "";
          bValue = b.reviewed_at || "";
          break;
      }

      if (aValue === null || aValue === "") return 1;
      if (bValue === null || bValue === "") return -1;

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredSubmissions, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSubmissions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSubmissions = sortedSubmissions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button
        className="flex items-center hover:text-foreground transition-colors"
        onClick={() => handleSort(field)}
      >
        {children}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-sm text-muted-foreground text-center">Loading submissions…</div>
        </CardContent>
      </Card>
    );
  }

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "all";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions ({submissions.length})</CardTitle>
        <CardDescription>Review and approve minister intake submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No submissions yet.</div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results info */}
            {hasActiveFilters && (
              <div className="text-sm text-muted-foreground">
                Showing {sortedSubmissions.length} of {submissions.length} submissions
              </div>
            )}

            <div className="border rounded-md overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="status">Status</SortableHeader>
                    <SortableHeader field="name">Name</SortableHeader>
                    <SortableHeader field="phone">Phone</SortableHeader>
                    <SortableHeader field="submitted_at">Submitted</SortableHeader>
                    <SortableHeader field="reviewed_at">Reviewed</SortableHeader>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No submissions match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSubmissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <Badge 
                            variant={
                              sub.status === "approved" 
                                ? "default" 
                                : sub.status === "rejected" 
                                  ? "destructive" 
                                  : "secondary"
                            }
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{sub.payload?.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sub.payload?.phone || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => onReview(sub)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {sortedSubmissions.length > 0
                    ? `${startIndex + 1}–${Math.min(endIndex, sortedSubmissions.length)} of ${sortedSubmissions.length}`
                    : "0 results"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
