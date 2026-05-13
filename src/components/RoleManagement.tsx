import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Loader2, Plus, Search, Shield, X } from "lucide-react";

type AppRole =
  | "user"
  | "admin"
  | "super_admin"
  | "finance_manager"
  | "admission_reviewer"
  | "local_officer"
  | "association_head"
  | "vp_office";

const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
  { value: "finance_manager", label: "Finance Manager" },
  { value: "admission_reviewer", label: "Admission Reviewer" },
  { value: "local_officer", label: "Local Officer" },
  { value: "association_head", label: "Association Head" },
  { value: "vp_office", label: "VP Office" },
];

const labelOf = (r: string) => ALL_ROLES.find((x) => x.value === r)?.label || r;
const variantOf = (r: string): "default" | "destructive" | "secondary" | "outline" => {
  if (r === "super_admin") return "destructive";
  if (r === "user") return "secondary";
  return "default";
};

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
}

export function RoleManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [pendingRole, setPendingRole] = useState<Record<string, AppRole>>({});

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["role-mgmt-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone_number")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProfileRow[];
    },
  });

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ["role-mgmt-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id, user_id, role");
      if (error) throw error;
      return data || [];
    },
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, { id: string; role: AppRole }[]>();
    (roles || []).forEach((r: any) => {
      const arr = map.get(r.user_id) || [];
      arr.push({ id: r.id, role: r.role });
      map.set(r.user_id, arr);
    });
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    if (!profiles) return [];
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone_number?.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role added");
      qc.invalidateQueries({ queryKey: ["role-mgmt-roles"] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (e: any) => {
      const msg = String(e?.message || "");
      if (msg.includes("duplicate")) toast.error("User already has this role");
      else toast.error(msg || "Failed to add role");
    },
  });

  const removeRole = useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role removed");
      qc.invalidateQueries({ queryKey: ["role-mgmt-roles"] });
      qc.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove role"),
  });

  const isLoading = loadingProfiles || loadingRoles;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management
        </CardTitle>
        <CardDescription>
          Assign or revoke individual roles per user. A user may hold multiple roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[260px]">Add role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const userRoles = rolesByUser.get(u.id) || [];
                  const heldRoles = new Set(userRoles.map((r) => r.role));
                  const available = ALL_ROLES.filter((r) => !heldRoles.has(r.value));
                  const selected = pendingRole[u.id] || available[0]?.value;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{u.email || "—"}</div>
                        <div>{u.phone_number || ""}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userRoles.length === 0 && (
                            <span className="text-sm text-muted-foreground">No roles</span>
                          )}
                          {userRoles.map((r) => (
                            <AlertDialog key={r.id}>
                              <AlertDialogTrigger asChild>
                                <Badge
                                  variant={variantOf(r.role)}
                                  className="cursor-pointer gap-1"
                                >
                                  {labelOf(r.role)}
                                  <X className="h-3 w-3" />
                                </Badge>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Remove "{labelOf(r.role)}" from {u.full_name || u.email}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeRole.mutate(r.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={selected}
                            onValueChange={(v) =>
                              setPendingRole((p) => ({ ...p, [u.id]: v as AppRole }))
                            }
                            disabled={available.length === 0}
                          >
                            <SelectTrigger className="w-[170px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {available.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            disabled={!selected || available.length === 0 || addRole.isPending}
                            onClick={() =>
                              selected && addRole.mutate({ userId: u.id, role: selected })
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
