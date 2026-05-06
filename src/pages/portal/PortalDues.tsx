import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { portalFetch } from "@/lib/portalApi";
import { toast } from "sonner";

export default function PortalDues() {
  const [history, setHistory] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState("MTN");
  const [paying, setPaying] = useState(false);

  const load = () => portalFetch<any>("minister-portal-dues-history").then(setHistory).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const pay = async () => {
    setPaying(true);
    try {
      const res = await portalFetch<any>("minister-portal-dues-pay", { body: { phone, channel } });
      toast.success(res.message || "Payment initiated");
      // Poll a few times for status update
      let tries = 0;
      const poll = setInterval(async () => {
        tries++;
        await load();
        if (tries >= 12) clearInterval(poll);
      }, 5000);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPaying(false);
    }
  };

  const settings = history?.duesSettings;
  const paid = history?.paidCurrentYear;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Dues & Payments</h1>

      <Card>
        <CardHeader>
          <CardTitle>{settings ? `${settings.year} Annual Dues` : "Annual Dues"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings && <p className="text-muted-foreground">Annual dues amount has not been set yet.</p>}
          {settings && (
            <>
              <div className="text-3xl font-bold">{settings.currency} {Number(settings.amount).toFixed(2)}</div>
              {paid ? (
                <Badge>Paid for {settings.year}</Badge>
              ) : (
                <div className="grid sm:grid-cols-3 gap-3 items-end pt-2">
                  <div>
                    <Label>Mobile Money Number</Label>
                    <Input placeholder="0241234567" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} />
                  </div>
                  <div>
                    <Label>Network</Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN</SelectItem>
                        <SelectItem value="VODAFONE">Telecel (Vodafone)</SelectItem>
                        <SelectItem value="AIRTELTIGO">AirtelTigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={pay} disabled={paying || phone.length < 10}>
                    {paying ? "Initiating..." : "Pay with Mobile Money"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(history?.payments || []).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.year}</TableCell>
                  <TableCell>{p.currency} {Number(p.amount).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"} className="capitalize">{p.status}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{p.provider_reference}</TableCell>
                  <TableCell>{(p.paid_at || p.created_at)?.slice(0,10)}</TableCell>
                </TableRow>
              ))}
              {(!history?.payments || history.payments.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No payments yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
