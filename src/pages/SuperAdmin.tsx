import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/UserManagement";

export default function SuperAdmin() {
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: true })
        .eq("id", userId);

      if (error) throw error;
      return userId;
    },
    onSuccess: async (userId) => {
      await logActivity({
        action: "user_approved",
        details: { userId },
      });
      toast.success("User approved successfully");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve user");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: false })
        .eq("id", userId);

      if (error) throw error;
      return userId;
    },
    onSuccess: async (userId) => {
      await logActivity({
        action: "user_approval_revoked",
        details: { userId },
      });
      toast.success("User approval revoked");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to revoke approval");
    },
  });

  const pendingUsers = profiles?.filter((u) => !u.approved) || [];
  const stats = {
    total: profiles?.length || 0,
    approved: profiles?.filter((u) => u.approved).length || 0,
    pending: pendingUsers.length,
  };

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, approvals, and system settings
          </p>
        </div>

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </CardTitle>
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Approved Users
                    </CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{stats.approved}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Approval
                    </CardTitle>
                    <XCircle className="h-5 w-5 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Users waiting for approval to access the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending approvals
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.full_name || "N/A"}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(user.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
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

            {/* All Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Complete list of registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registration Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.full_name || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={user.approved ? "default" : "secondary"}>
                                {user.approved ? "Approved" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {user.approved ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => revokeMutation.mutate(user.id)}
                                  disabled={revokeMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => approveMutation.mutate(user.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}