import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { groupByWeekAndDate } from "@/utils/dateGrouping";

type IntakeSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  manually_closed: boolean;
};

function isSessionOpen(s: IntakeSession) {
  const now = Date.now();
  return !s.manually_closed && now >= new Date(s.starts_at).getTime() && now <= new Date(s.ends_at).getTime();
}

interface Props {
  sessions: IntakeSession[];
  isLoading: boolean;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onToggleClose: (session: IntakeSession) => void;
}

export function GroupedSessionsList({ sessions, isLoading, activeSessionId, onSelectSession, onToggleClose }: Props) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const groupedSessions = groupByWeekAndDate(sessions, (s) => s.starts_at);

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
          <div className="text-sm text-muted-foreground text-center">Loading sessions…</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions ({sessions.length})</CardTitle>
        <CardDescription>Grouped by week. Select a session to manage invites and submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No sessions yet. Create one above.</div>
        ) : (
          <div className="space-y-2">
            {groupedSessions.map((week) => {
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
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Window</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dateGroup.items.map((s) => (
                                    <TableRow key={s.id} className={s.id === activeSessionId ? "bg-muted/50" : ""}>
                                      <TableCell>
                                        <button className="text-left font-medium hover:underline" onClick={() => onSelectSession(s.id)}>
                                          {s.title}
                                        </button>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={isSessionOpen(s) ? "default" : "secondary"}>
                                          {isSessionOpen(s) ? "Open" : "Closed"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => onToggleClose(s)}>
                                          {s.manually_closed ? "Reopen" : "Close now"}
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
