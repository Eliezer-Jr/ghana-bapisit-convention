import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function FinancePortal() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: approvedApplicants, isLoading } = useQuery({
    queryKey: ["approved-applicants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approved_applicants")
        .select(`
          *,
          profiles(full_name),
          applications(id, full_name, status, submitted_at)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const approveApplicantMutation = useMutation({
    mutationFn: async ({ phoneNumber, notes }: { phoneNumber: string; notes?: string }) => {
      const { data, error } = await supabase.functions.invoke("approve-applicant", {
        body: { phoneNumber, notes },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to approve applicant");
      
      return data;
    },
    onSuccess: () => {
      toast.success("Applicant approved and SMS sent!");
      setPhoneNumber("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["approved-applicants"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve applicant");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    approveApplicantMutation.mutate({ phoneNumber, notes });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Finance Portal</h1>
        <p className="text-muted-foreground mb-8">
          Approve applicants by adding their phone numbers to allow them to submit applications.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Approve New Applicant</CardTitle>
              <CardDescription>
                Enter the phone number of the person who has made payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0XXXXXXXXX or +233XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Format: 0XXXXXXXXX or +233XXXXXXXXX
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Payment receipt number, amount, or any other notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={approveApplicantMutation.isPending}
                >
                  {approveApplicantMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Approve & Send SMS
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approved Applicants</CardTitle>
              <CardDescription>
                List of phone numbers approved to apply
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : approvedApplicants && approvedApplicants.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applicant Name</TableHead>
                        <TableHead>App Status</TableHead>
                        <TableHead>Date Approved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedApplicants.map((applicant) => (
                        <TableRow key={applicant.id}>
                          <TableCell className="font-mono text-sm">
                            {applicant.phone_number}
                          </TableCell>
                          <TableCell>
                            {applicant.used ? (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Applied
                              </Badge>
                            ) : (
                              <Badge variant="default" className="flex items-center gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {applicant.applications?.full_name || "-"}
                          </TableCell>
                          <TableCell>
                            {applicant.applications ? (
                              <Badge variant="outline" className="text-xs">
                                {applicant.applications.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(applicant.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No approved applicants yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}