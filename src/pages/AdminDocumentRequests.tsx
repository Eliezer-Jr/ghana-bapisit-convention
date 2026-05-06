import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useSignedUrl } from "@/hooks/useSignedUrl";

function UploadLink({ path, name }: { path: string; name: string }) {
  const { signedUrl } = useSignedUrl("application-documents", path);
  return <a href={signedUrl || "#"} target="_blank" rel="noreferrer" className="text-primary underline text-sm">{name}</a>;
}

export default function AdminDocumentRequests() {
  const qc = useQueryClient();
  const [ministerId, setMinisterId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: ministers } = useQuery({
    queryKey: ["ministers-mini"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ministers").select("id, full_name, minister_id").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["admin-doc-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: uploads } = useQuery({
    queryKey: ["admin-doc-uploads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_request_uploads").select("*");
      if (error) throw error;
      return data;
    },
  });

  const ministerMap = useMemo(() => {
    const m = new Map<string, any>();
    (ministers || []).forEach(x => m.set(x.id, x));
    return m;
  }, [ministers]);

  const create = async () => {
    if (!ministerId || !title) return toast.error("Minister and title required");
    const { error } = await supabase.from("document_requests").insert({
      minister_id: ministerId, title, description: description || null, due_date: dueDate || null, status: "pending",
    });
    if (error) return toast.error(error.message);
    toast.success("Request created");
    setTitle(""); setDescription(""); setDueDate("");
    qc.invalidateQueries({ queryKey: ["admin-doc-requests"] });
  };

  const review = async (id: string, status: "approved" | "rejected", notes?: string) => {
    const { error } = await supabase.from("document_requests").update({
      status, reviewer_notes: notes || null, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-doc-requests"] });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Document Requests</h1>
      <Card>
        <CardHeader><CardTitle>New Request</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Minister</Label>
              <Select value={ministerId} onValueChange={setMinisterId}>
                <SelectTrigger><SelectValue placeholder="Select minister" /></SelectTrigger>
                <SelectContent>
                  {ministers?.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name} ({m.minister_id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Due date (optional)</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Updated Ordination Certificate" /></div>
          <div><Label>Description (optional)</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
          <Button onClick={create}>Send Request</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Requests</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Minister</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploads</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requests || []).map(r => {
                const ms = ministerMap.get(r.minister_id);
                const ups = (uploads || []).filter(u => u.request_id === r.id);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{ms?.full_name || r.minister_id}<br/><span className="text-xs text-muted-foreground">{ms?.minister_id}</span></TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell><Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{r.status}</Badge></TableCell>
                    <TableCell className="space-y-1">
                      {ups.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      {ups.map(u => <div key={u.id}><UploadLink path={u.file_url} name={u.file_name} /></div>)}
                    </TableCell>
                    <TableCell>
                      {r.status === "submitted" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => review(r.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            const reason = prompt("Reason for rejection?") || "";
                            review(r.id, "rejected", reason);
                          }}>Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
