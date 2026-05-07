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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "sector" | "association">("all");
  const [audienceValue, setAudienceValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: ministerOpts } = useQuery({
    queryKey: ["minister-audience-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ministers").select("sector, association");
      if (error) throw error;
      return data || [];
    },
  });

  const sectors = useMemo(
    () => Array.from(new Set((ministerOpts || []).map((m: any) => m.sector).filter(Boolean))).sort(),
    [ministerOpts]
  );
  const associations = useMemo(
    () => Array.from(new Set((ministerOpts || []).map((m: any) => m.association).filter(Boolean))).sort(),
    [ministerOpts]
  );

  const create = async (publish: boolean) => {
    if (!title.trim() || !body.trim()) return toast.error("Title and body required");
    if (audience !== "all" && !audienceValue) return toast.error(`Select a ${audience}`);
    setSaving(true);
    const { error } = await supabase.from("announcements").insert({
      title, body,
      audience,
      audience_value: audience === "all" ? null : audienceValue,
      published_at: publish ? new Date().toISOString() : null,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(publish ? "Published" : "Saved as draft");
    setTitle(""); setBody(""); setAudience("all"); setAudienceValue("");
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  };

  const togglePublish = async (a: any) => {
    const { error } = await supabase.from("announcements").update({
      published_at: a.published_at ? null : new Date().toISOString(),
    }).eq("id", a.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Announcements</h1>
      <Card>
        <CardHeader><CardTitle>New Announcement</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Body</Label><Textarea rows={5} value={body} onChange={e => setBody(e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v: any) => { setAudience(v); setAudienceValue(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ministers</SelectItem>
                  <SelectItem value="sector">Specific Sector</SelectItem>
                  <SelectItem value="association">Specific Association</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audience !== "all" && (
              <div>
                <Label>{audience === "sector" ? "Sector" : "Association"}</Label>
                <Select value={audienceValue} onValueChange={setAudienceValue}>
                  <SelectTrigger><SelectValue placeholder={`Select ${audience}`} /></SelectTrigger>
                  <SelectContent>
                    {(audience === "sector" ? sectors : associations).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => create(true)} disabled={saving}>Publish</Button>
            <Button variant="outline" onClick={() => create(false)} disabled={saving}>Save Draft</Button>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {items?.map((a: any) => (
          <Card key={a.id}>
            <CardContent className="p-4 flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{a.title}</p>
                  <Badge variant={a.published_at ? "default" : "secondary"}>{a.published_at ? "Published" : "Draft"}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {a.audience}{a.audience_value ? `: ${a.audience_value}` : ""}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => togglePublish(a)}>{a.published_at ? "Unpublish" : "Publish"}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
