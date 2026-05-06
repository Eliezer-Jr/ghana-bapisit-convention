import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { portalFetch } from "@/lib/portalApi";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import logoGbcc from "@/assets/logo-gbcc.png";

export default function PortalProfile() {
  const [me, setMe] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { portalFetch("minister-portal-me").then(setMe).catch(() => {}); }, []);

  const minister = me?.minister;
  const verifyUrl = minister ? `${window.location.origin}/verify/${minister.minister_id}` : "";

  const download = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, backgroundColor: "#ffffff" });
    const a = document.createElement("a");
    a.href = dataUrl; a.download = `${minister.minister_id}-id-card.png`; a.click();
  };

  if (!minister) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My ID Card</h1>
        <Button onClick={download}><Download className="h-4 w-4 mr-2" /> Download</Button>
      </div>

      <div ref={cardRef} className="bg-white rounded-xl overflow-hidden border-2 shadow-lg max-w-md">
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
          <img src={logoGbcc} alt="GBCC" className="h-12 w-12 bg-white rounded-full p-1" />
          <div>
            <p className="font-bold text-sm leading-tight">Ghana Baptist Convention</p>
            <p className="text-xs opacity-90">Minister Identification Card</p>
          </div>
        </div>
        <div className="p-5 flex gap-4">
          <div className="w-24 h-32 bg-muted rounded-md overflow-hidden flex-shrink-0">
            {minister.photo_url ? <img src={minister.photo_url} alt="" className="w-full h-full object-cover" /> : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-bold">{minister.full_name}</p>
            <p className="text-xs text-muted-foreground mt-2">Minister ID</p>
            <p className="font-mono font-semibold">{minister.minister_id}</p>
            <p className="text-xs text-muted-foreground mt-2">Role</p>
            <p className="text-sm">{minister.role || "—"}</p>
            <p className="text-xs text-muted-foreground mt-2">Status</p>
            <p className="text-sm capitalize">{minister.status}</p>
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-between bg-muted/30">
          <div className="text-xs text-muted-foreground">
            <p>Church: {minister.current_church_name || "—"}</p>
            <p>Association: {minister.association || "—"}</p>
          </div>
          <QRCodeCanvas value={verifyUrl} size={80} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div><p className="text-muted-foreground">Phone</p><p>{minister.phone}</p></div>
          <div><p className="text-muted-foreground">Email</p><p>{minister.email || "—"}</p></div>
          <div><p className="text-muted-foreground">Sector</p><p>{minister.sector || "—"}</p></div>
          <div><p className="text-muted-foreground">Fellowship</p><p>{minister.fellowship || "—"}</p></div>
          <div><p className="text-muted-foreground">Ordination Year</p><p>{minister.ordination_year || "—"}</p></div>
          <div><p className="text-muted-foreground">Date Joined</p><p>{minister.date_joined}</p></div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">To update your details, contact the GBCC office.</p>
    </div>
  );
}
