import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export default function AdminDues() {
  const qc = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["dues-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dues_settings").select("*").order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["dues-payments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dues_payments")
        .select("*, ministers:minister_id(full_name, minister_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = async () => {
    if (!amount) return toast.error("Amount required");
    const { error } = await supabase.from("dues_settings").upsert({
      year, amount: Number(amount), currency: "GHS",
    }, { onConflict: "year" });
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setAmount("");
    qc.invalidateQueries({ queryKey: ["dues-settings"] });
  };

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("dues_payments").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["dues-payments-all"] });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Annual Dues</h1>
      <Card>
        <CardHeader><CardTitle>Set Annual Amount</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 items-end">
          <div><Label>Year</Label><Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} /></div>
          <div><Label>Amount (GHS)</Label><Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <Button onClick={save}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Configured Years</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Amount</TableHead><TableHead>Currency</TableHead></TableRow></TableHeader>
            <TableBody>
              {settings?.map(s => (
                <TableRow key={s.id}><TableCell>{s.year}</TableCell><TableCell>{Number(s.amount).toFixed(2)}</TableCell><TableCell>{s.currency}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Payments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Minister</TableHead><TableHead>Year</TableHead><TableHead>Amount</TableHead>
              <TableHead>Status</TableHead><TableHead>Reference</TableHead><TableHead>Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(payments || []).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.ministers?.full_name}<br/><span className="text-xs text-muted-foreground">{p.ministers?.minister_id}</span></TableCell>
                  <TableCell>{p.year}</TableCell>
                  <TableCell>{p.currency} {Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"} className="capitalize">{p.status}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{p.provider_reference}</TableCell>
                  <TableCell>{p.status !== "paid" && <Button size="sm" variant="outline" onClick={() => markPaid(p.id)}>Mark Paid</Button>}</TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No payments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
