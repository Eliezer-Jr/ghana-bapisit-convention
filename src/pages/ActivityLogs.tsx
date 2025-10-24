import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function ActivityLogs() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      navigate("/");
      toast.error("Access denied. Super admin only.");
    }
  }, [isSuperAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();
    }
  }, [isSuperAdmin]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Fetch user profiles for the logs
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to logs
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      const enrichedLogs = logsData?.map(log => ({
        ...log,
        profiles: profilesMap.get(log.user_id)
      })) || [];

      setLogs(enrichedLogs);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('login')) return <Badge variant="default">Login</Badge>;
    if (action.includes('logout')) return <Badge variant="secondary">Logout</Badge>;
    if (action.includes('create')) return <Badge variant="default">Create</Badge>;
    if (action.includes('update')) return <Badge>Update</Badge>;
    if (action.includes('delete')) return <Badge variant="destructive">Delete</Badge>;
    return <Badge variant="outline">{action}</Badge>;
  };

  if (!isSuperAdmin) return null;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
            <CardDescription>
              Monitor all user activities across the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity logs found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {log.profiles?.full_name || "Unknown User"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.profiles?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          <pre className="text-xs max-w-md overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.ip_address || "N/A"}
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
