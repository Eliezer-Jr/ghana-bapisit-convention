import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type UserRole = "user" | "admin" | "super_admin" | "finance_manager" | "admission_reviewer";

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  approved: boolean;
  created_at: string;
  user_roles: Array<{ role: UserRole }>;
}

export function UserManagement() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch roles for all users
      const userIds = data?.map((u) => u.id) || [];
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Combine users with their roles
      return data?.map((user) => ({
        ...user,
        user_roles: rolesData?.filter((r) => r.user_id === user.id) || [],
      })) as UserWithRoles[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      fullName: string;
      phoneNumber: string;
      role: UserRole;
    }) => {
      // Generate a random email from phone number
      const email = `${userData.phoneNumber}@gbc.temp`;
      const tempPassword = Math.random().toString(36).slice(-12) + "GBC123!";

      // Create user via Supabase Auth Admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        phone: userData.phoneNumber,
        user_metadata: {
          full_name: userData.fullName,
        },
      });

      if (authError) throw authError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: userData.fullName,
          phone_number: userData.phoneNumber,
          approved: true,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: userData.role })
        .eq("user_id", authData.user.id);

      if (roleError) throw roleError;

      return authData;
    },
    onSuccess: () => {
      toast.success("User created successfully! They can now login with OTP.");
      setFullName("");
      setPhoneNumber("");
      setRole("user");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    createUserMutation.mutate({ fullName, phoneNumber, role });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
      case "finance_manager":
      case "admission_reviewer":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "finance_manager":
        return "Finance Manager";
      case "admission_reviewer":
        return "Admission Reviewer";
      case "admin":
        return "Admin";
      default:
        return "User";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New User
          </CardTitle>
          <CardDescription>
            Users will receive OTP for login. No password required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="557083554"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="admission_reviewer">Admission Reviewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={createUserMutation.isPending} className="w-full">
              {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User (OTP Login)
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and roles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone_number || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={user.user_roles?.[0]?.role || "user"}
                          onValueChange={(newRole) =>
                            updateRoleMutation.mutate({ userId: user.id, newRole: newRole as UserRole })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue>
                        <Badge variant={getRoleBadgeVariant(user.user_roles?.[0]?.role || "user")}>
                          {getRoleLabel(user.user_roles?.[0]?.role || "user")}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="finance_manager">Finance Manager</SelectItem>
                            <SelectItem value="admission_reviewer">Admission Reviewer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.approved ? "default" : "secondary"}>
                          {user.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}