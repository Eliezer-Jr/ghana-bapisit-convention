import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { portalFetch } from "@/lib/portalApi";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const STATUS_VARIANTS: Record<string, any> = {
  pending: "secondary",
  submitted: "default",
  approved: "default",
  rejected: "destructive",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1]);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function PortalDocuments() {
  const [requests, setRequests] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => portalFetch<any>("minister-portal-document-requests").then(d => {
    setRequests(d.requests || []);
    setUploads(d.uploads || []);
  }).catch((e) => toast.error(e.message));

  useEffect(() => { load(); }, []);

  const upload = async (requestId: string, file: File) => {
    setBusy(requestId);
    try {
      const base64 = await fileToBase64(file);
      await portalFetch("minister-portal-document-requests", { body: { action: "upload", requestId, fileName: file.name, mimeType: file.type, base64 } });
      toast.success("Uploaded");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Documents Requested</h1>
      {requests.length === 0 && <p className="text-muted-foreground">No document requests at the moment.</p>}
      {requests.map(r => {
        const myUploads = uploads.filter(u => u.request_id === r.id);
        return (
          <Card key={r.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{r.title}</CardTitle>
                <Badge variant={STATUS_VARIANTS[r.status] || "secondary"} className="capitalize">{r.status}</Badge>
              </div>
              {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              {r.due_date && <p className="text-xs text-muted-foreground">Due: {r.due_date}</p>}
              {r.reviewer_notes && <p className="text-sm bg-muted p-2 rounded">Note: {r.reviewer_notes}</p>}
              {myUploads.length > 0 && (
                <ul className="text-sm space-y-1">
                  {myUploads.map(u => <li key={u.id} className="text-muted-foreground">• {u.file_name}</li>)}
                </ul>
              )}
              {(r.status === "pending" || r.status === "rejected") && (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <Input type="file" className="max-w-sm" onChange={(e) => e.target.files?.[0] && upload(r.id, e.target.files[0])} disabled={busy === r.id} />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  {busy === r.id && <span className="text-xs text-muted-foreground">Uploading...</span>}
                </label>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
