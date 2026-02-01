import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { groupByWeekAndDate } from "@/utils/dateGrouping";

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
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const groupedSubmissions = groupByWeekAndDate(submissions, (sub) => sub.submitted_at || sub.reviewed_at);

  const toggleWeek = (weekLabel: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekLabel)) next.delete(weekLabel);
      else next.add(weekLabel);
      return next;
    });
  };

  const toggleDate = (key: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
        <CardDescription>Grouped by week and date. Review and approve submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No submissions yet.</div>
        ) : (
          <div className="space-y-2">
            {groupedSubmissions.map((week) => {
              const weekOpen = expandedWeeks.has(week.weekLabel);
              const weekCount = week.dates.reduce((sum, d) => sum + d.items.length, 0);

              return (
                <Collapsible key={week.weekLabel} open={weekOpen} onOpenChange={() => toggleWeek(week.weekLabel)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-left font-semibold">
                      <span className="flex items-center gap-2">
                        {weekOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {week.weekLabel}
                      </span>
                      <Badge variant="secondary">{weekCount}</Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {week.dates.map((dateGroup) => {
                      const dateKey = `${week.weekLabel}-${dateGroup.dateLabel}`;
                      const dateOpen = expandedDates.has(dateKey);

                      return (
                        <Collapsible key={dateKey} open={dateOpen} onOpenChange={() => toggleDate(dateKey)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between text-left">
                              <span className="flex items-center gap-2">
                                {dateOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                {dateGroup.dateLabel}
                              </span>
                              <Badge variant="outline">{dateGroup.items.length}</Badge>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border rounded-md overflow-auto mt-1 mb-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dateGroup.items.map((sub) => (
                                    <TableRow key={sub.id}>
                                      <TableCell>
                                        <Badge variant={sub.status === "approved" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}>
                                          {sub.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="font-medium">{sub.payload?.full_name || "—"}</TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{sub.payload?.phone || "—"}</TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "—"}
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
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
