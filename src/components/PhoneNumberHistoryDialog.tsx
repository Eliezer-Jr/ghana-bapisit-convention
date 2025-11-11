import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface PhoneNumberHistoryDialogProps {
  applicantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PhoneNumberHistoryDialog = ({
  applicantId,
  open,
  onOpenChange,
}: PhoneNumberHistoryDialogProps) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ["phone-history", applicantId],
    queryFn: async () => {
      if (!applicantId) return [];
      
      const { data, error } = await supabase
        .from("phone_number_history")
        .select(`
          *,
          profiles:changed_by (full_name)
        `)
        .eq("approved_applicant_id", applicantId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!applicantId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Phone Number Change History</DialogTitle>
          <DialogDescription className="sr-only">All edits made to this approved phone number with who changed it and when.</DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !history || history.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No changes recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Old Number</TableHead>
                  <TableHead>New Number</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.changed_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono">{record.old_phone_number}</TableCell>
                    <TableCell className="font-mono">{record.new_phone_number}</TableCell>
                    <TableCell>{(record as any).profiles?.full_name || "Unknown"}</TableCell>
                    <TableCell>{record.reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
