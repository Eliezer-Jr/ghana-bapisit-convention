import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portalFetch } from "@/lib/portalApi";
import { format } from "date-fns";

export default function PortalAnnouncements() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { portalFetch<any>("minister-portal-announcements").then(d => setItems(d.announcements || [])).catch(() => {}); }, []);
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Announcements</h1>
      {items.length === 0 && <p className="text-muted-foreground">No announcements yet.</p>}
      {items.map(a => (
        <Card key={a.id}>
          <CardHeader>
            <CardTitle>{a.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{format(new Date(a.published_at), "PPP")}</p>
          </CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{a.body}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}
