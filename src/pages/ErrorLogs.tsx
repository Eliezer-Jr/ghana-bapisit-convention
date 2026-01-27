import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { AlertCircle, AlertTriangle, Info, XCircle, RefreshCw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ErrorLog {
  id: string;
  source: string;
  error_message: string;
  stack_trace: string | null;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  user_agent: string | null;
  url: string | null;
  function_name: string | null;
  severity: string;
  created_at: string;
}

const severityConfig = {
  info: { icon: Info, color: "bg-blue-500", label: "Info" },
  warning: { icon: AlertTriangle, color: "bg-yellow-500", label: "Warning" },
  error: { icon: AlertCircle, color: "bg-red-500", label: "Error" },
  critical: { icon: XCircle, color: "bg-red-700", label: "Critical" },
};

export default function ErrorLogs() {
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["error-logs", sourceFilter, severityFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter);
      }
      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }
      if (searchTerm) {
        query = query.ilike("error_message", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  const getSeverityBadge = (severity: string) => {
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.error;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Error Logs</h1>
            <p className="text-muted-foreground">
              Centralized error logging for debugging
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter logs by source, severity, or search term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search error messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>
              Showing the most recent {logs?.length || 0} error logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : logs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No error logs found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Severity</TableHead>
                      <TableHead className="w-[80px]">Source</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-[150px]">Function/URL</TableHead>
                      <TableHead className="w-[150px]">Time</TableHead>
                      <TableHead className="w-[80px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.source}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {log.error_message}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm">
                          {log.function_name || log.url || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">View</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  {getSeverityBadge(log.severity)}
                                  <span>Error Details</span>
                                </DialogTitle>
                                <DialogDescription>
                                  {format(new Date(log.created_at), "PPpp")}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-1">Message</h4>
                                    <p className="text-sm bg-muted p-2 rounded">{log.error_message}</p>
                                  </div>
                                  
                                  {log.stack_trace && (
                                    <div>
                                      <h4 className="font-semibold mb-1">Stack Trace</h4>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                                        {log.stack_trace}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {log.url && (
                                    <div>
                                      <h4 className="font-semibold mb-1">URL</h4>
                                      <p className="text-sm bg-muted p-2 rounded break-all">{log.url}</p>
                                    </div>
                                  )}
                                  
                                  {log.function_name && (
                                    <div>
                                      <h4 className="font-semibold mb-1">Function</h4>
                                      <p className="text-sm bg-muted p-2 rounded">{log.function_name}</p>
                                    </div>
                                  )}
                                  
                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-1">Metadata</h4>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  
                                  {log.user_agent && (
                                    <div>
                                      <h4 className="font-semibold mb-1">User Agent</h4>
                                      <p className="text-xs bg-muted p-2 rounded break-all">{log.user_agent}</p>
                                    </div>
                                  )}
                                  
                                  {log.user_id && (
                                    <div>
                                      <h4 className="font-semibold mb-1">User ID</h4>
                                      <p className="text-sm bg-muted p-2 rounded font-mono">{log.user_id}</p>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
