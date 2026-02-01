import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

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

export function GroupedSubmissionsList({ submissions, isLoading, onReview }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-sm text-muted-foreground text-center">Loading submissions…</div>
        </CardContent>
      </Card>
    );
  }

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
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
