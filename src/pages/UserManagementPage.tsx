import ResponsiveLayout from "@/components/ResponsiveLayout";
import { UserManagement } from "@/components/UserManagement";

export default function UserManagementPage() {
  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Create and manage user accounts with different roles
          </p>
        </div>
        <UserManagement />
      </div>
    </ResponsiveLayout>
  );
}