import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { portalFetch } from "@/lib/portalApi";
import { Megaphone, FileUp, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export default function PortalDashboard() {
  const [me, setMe] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  useEffect(() => {
    portalFetch("minister-portal-me").then(setMe).catch(() => {});
    portalFetch<any>("minister-portal-announcements").then(d => setAnnouncements(d.announcements || [])).catch(() => {});
  }, []);

  const settings = me?.duesSettings;
  const latest = me?.latestPayment;
  const paidThisYear = settings && latest && latest.year === settings.year && latest.status === "paid";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {me?.minister?.full_name?.split(" ")[0] || ""}</h1>
        <p className="text-muted-foreground">Minister ID: {me?.minister?.minister_id}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/myportal/dues">
          <Card className="hover:shadow-md transition">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Dues</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings ? `${settings.currency} ${settings.amount}` : "—"}</div>
              <Badge variant={paidThisYear ? "default" : "secondary"} className="mt-2">
                {paidThisYear ? `Paid ${settings.year}` : `Outstanding ${settings?.year ?? ""}`}
              </Badge>
            </CardContent>
          </Card>
        </Link>
        <Link to="/myportal/documents">
          <Card className="hover:shadow-md transition">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Requests</CardTitle>
              <FileUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{me?.pendingDocs?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Pending action</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/myportal/announcements">
          <Card className="hover:shadow-md transition">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcements.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Total published</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Latest Announcements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {announcements.slice(0, 3).map(a => (
            <div key={a.id} className="border-l-4 border-primary pl-3">
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
