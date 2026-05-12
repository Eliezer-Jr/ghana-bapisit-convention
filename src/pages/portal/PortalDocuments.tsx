import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { portalFetch } from "@/lib/portalApi";
import { toast } from "sonner";
import { Upload, Send, GraduationCap, User, Church, FileText, ExternalLink } from "lucide-react";

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

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function getPreviewUrl(documentUrl?: string | null, previewUrl?: string | null) {
  if (previewUrl) return previewUrl;
  if (documentUrl?.startsWith("http")) return documentUrl;
  return null;
}

function isImageFile(url?: string | null, type?: string | null, name?: string | null) {
  const source = `${type || ""} ${name || ""} ${url || ""}`.toLowerCase();
  return source.includes("image/") || /\.(png|jpe?g|webp|gif|bmp)(\?|$)/.test(source);
}

function isPdfFile(url?: string | null, type?: string | null, name?: string | null) {
  const source = `${type || ""} ${name || ""} ${url || ""}`.toLowerCase();
  return source.includes("application/pdf") || /\.pdf(\?|$)/.test(source);
}

function DocumentPreview({
  title,
  name,
  url,
  previewUrl,
  type,
}: {
  title: string;
  name?: string | null;
  url?: string | null;
  previewUrl?: string | null;
  type?: string | null;
}) {
  const src = getPreviewUrl(url, previewUrl);

  if (!src) {
    return (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{title}</p>
        <p>{name || "No preview available"}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          {name && <p className="text-xs text-muted-foreground">{name}</p>}
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
      {isImageFile(src, type, name) ? (
        <img src={src} alt={name || title} className="max-h-72 w-full rounded-md bg-muted/30 object-contain" />
      ) : isPdfFile(src, type, name) ? (
        <iframe src={src} title={name || title} className="h-72 w-full rounded-md bg-background" />
      ) : (
        <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
      )}
    </div>
  );
}

export default function PortalDocuments() {
  const [me, setMe] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadAll = () => {
    portalFetch<any>("minister-portal-me").then(setMe).catch((e) => toast.error(e.message));
    portalFetch<any>("minister-portal-document-requests").then(d => {
      setRequests(d.requests || []);
      setUploads(d.uploads || []);
    }).catch((e) => toast.error(e.message));
  };

  useEffect(() => { loadAll(); }, []);

  const upload = async (requestId: string, file: File) => {
    setBusy(requestId);
    try {
      const base64 = await fileToBase64(file);
      await portalFetch("minister-portal-document-requests", { body: { action: "upload", requestId, fileName: file.name, mimeType: file.type, base64 } });
      toast.success("Uploaded");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const submitForReview = async () => {
    setSubmittingReview(true);
    try {
      const r: any = await portalFetch("minister-portal-submit-review", { body: { section: "education" } });
      if (r.alreadyOpen) toast.info("A review is already pending for your educational information.");
      else toast.success("Submitted for review");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!me?.minister) return <p className="text-muted-foreground">Loading...</p>;

  const m = me.minister;
  const quals = me.qualifications || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">My Data</h1>
        <p className="text-sm text-muted-foreground">Your personal information on file with GBCC. To request changes, contact the office.</p>
      </div>

      {/* Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-md border bg-muted">
              {m.photo_url ? (
                <img src={m.photo_url} alt="Profile photo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <User className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="grid flex-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Full Name" value={m.full_name} />
              <Field label="Minister ID" value={m.minister_id} />
              <Field label="Titles" value={m.titles} />
              <Field label="Phone" value={m.phone} />
              <Field label="WhatsApp" value={m.whatsapp} />
              <Field label="Email" value={m.email} />
              <Field label="Date of Birth" value={m.date_of_birth} />
              <Field label="Marital Status" value={m.marital_status} />
              <Field label="Spouse" value={m.spouse_name} />
              <Field label="Children" value={m.number_of_children} />
              <Field label="Location" value={m.location} />
              <Field label="GPS Address" value={m.gps_address} />
              <Field label="Ghana Card #" value={m.ghana_card_number} />
            </div>
          </div>
          {(m.ghana_card_front_url || m.ghana_card_back_url) && (
            <div className="grid gap-3 md:grid-cols-2">
              <DocumentPreview title="Ghana Card Front" name={m.ghana_card_front_name} url={m.ghana_card_front_url} type={m.ghana_card_front_type} />
              <DocumentPreview title="Ghana Card Back" name={m.ghana_card_back_name} url={m.ghana_card_back_url} type={m.ghana_card_back_type} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Church / Ministry */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Church className="h-5 w-5" /> Church & Ministry</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Role" value={m.role} />
          <Field label="Status" value={m.status} />
          <Field label="Current Church" value={m.current_church_name} />
          <Field label="Position at Church" value={m.position_at_church} />
          <Field label="Church Address" value={m.church_address} />
          <Field label="Sector" value={m.sector} />
          <Field label="Association" value={m.association} />
          <Field label="Fellowship" value={m.fellowship} />
          <Field label="Zone" value={m.zone} />
          <Field label="Date Joined" value={m.date_joined} />
          <Field label="Licensing Year" value={m.licensing_year} />
          <Field label="Ordination Year" value={m.ordination_year} />
          <Field label="Recognition Year" value={m.recognition_year} />
          <Field label="Commissioning Year" value={m.commissioning_year} />
        </CardContent>
      </Card>

      {/* Educational */}
      <EducationSection
        initialQuals={quals}
        onChanged={loadAll}
        onSubmitReview={submitForReview}
        submittingReview={submittingReview}
      />

      {/* Document Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5" /> Document Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No document requests at the moment.</p>}
          {requests.map(r => {
            const myUploads = uploads.filter(u => u.request_id === r.id);
            return (
              <div key={r.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{r.title}</p>
                  <Badge variant={STATUS_VARIANTS[r.status] || "secondary"} className="capitalize">{r.status}</Badge>
                </div>
                {r.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{r.description}</p>}
                {r.due_date && <p className="text-xs text-muted-foreground">Due: {r.due_date}</p>}
                {r.reviewer_notes && <p className="text-sm bg-muted p-2 rounded">Note: {r.reviewer_notes}</p>}
                {myUploads.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {myUploads.map(u => (
                      <DocumentPreview
                        key={u.id}
                        title="Uploaded Document"
                        name={u.file_name}
                        url={u.file_url}
                        previewUrl={u.file_preview_url}
                        type={u.mime_type}
                      />
                    ))}
                  </div>
                )}
                {(r.status === "pending" || r.status === "rejected") && (
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <Input type="file" className="max-w-sm" onChange={(e) => e.target.files?.[0] && upload(r.id, e.target.files[0])} disabled={busy === r.id} />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    {busy === r.id && <span className="text-xs text-muted-foreground">Uploading...</span>}
                  </label>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

interface EduItem {
  id?: string;
  qualification: string;
  institution: string;
  year_obtained: string;
  document_name?: string;
  document_url?: string;
  document_preview_url?: string | null;
  document_type?: string | null;
  _file?: File | null;
}

function EducationSection({ initialQuals, onChanged, onSubmitReview, submittingReview }: {
  initialQuals: any[];
  onChanged: () => void;
  onSubmitReview: () => void;
  submittingReview: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  const [newItems, setNewItems] = useState<EduItem[]>([]);
  const [saving, setSaving] = useState(false);

  const items: EduItem[] = (initialQuals || []).map(q => ({
    id: q.id,
    qualification: q.qualification || "",
    institution: q.institution || "",
    year_obtained: q.year_obtained ? String(q.year_obtained) : "",
    document_name: q.document_name,
    document_url: q.document_url,
    document_preview_url: q.document_preview_url,
    document_type: q.document_type,
  }));

  useEffect(() => { if (!editMode) setNewItems([]); }, [editMode, initialQuals]);

  const startEdit = () => {
    setNewItems([{ qualification: "", institution: "", year_obtained: "" }]);
    setEditMode(true);
  };
  const cancel = () => {
    setNewItems([]);
    setEditMode(false);
  };

  const updateItem = (idx: number, patch: Partial<EduItem>) => {
    setNewItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };

  const addRow = () => setNewItems(prev => [...prev, { qualification: "", institution: "", year_obtained: "" }]);
  const removeRow = (idx: number) => setNewItems(prev => prev.filter((_, i) => i !== idx));

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const it of newItems) {
        if (!it.qualification.trim()) continue;
        const payload: any = {
          qualification: it.qualification,
          institution: it.institution,
          year_obtained: it.year_obtained,
        };
        if (it._file) {
          payload.fileName = it._file.name;
          payload.mimeType = it._file.type;
          payload.base64 = await fileToBase64(it._file);
        }
        await portalFetch("minister-portal-education", { body: { action: "upsert", item: payload } });
      }
      toast.success("Saved");
      setNewItems([]);
      setEditMode(false);
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Educational Information</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {!editMode && (
              <>
                <Button variant="outline" size="sm" onClick={startEdit}>Add</Button>
                <Button onClick={onSubmitReview} disabled={submittingReview} size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  {submittingReview ? "Submitting..." : "Submit and Review"}
                </Button>
              </>
            )}
            {editMode && (
              <>
                <Button variant="outline" size="sm" onClick={cancel} disabled={saving}>Cancel</Button>
                <Button size="sm" onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save New"}</Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && !editMode && (
          <p className="text-sm text-muted-foreground">No educational qualifications on record.</p>
        )}

        {items.map((q, i) => (
          <div key={q.id || i} className="border rounded-md p-3">
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <Field label="Qualification" value={q.qualification} />
              <Field label="Institution" value={q.institution} />
              <Field label="Year" value={q.year_obtained} />
            </div>
            {q.document_name && <p className="text-xs text-muted-foreground mt-2">📎 {q.document_name}</p>}
            {q.document_name && (
              <DocumentPreview
                title="Supporting Document"
                name={q.document_name}
                url={q.document_url}
                previewUrl={q.document_preview_url}
                type={q.document_type}
              />
            )}
          </div>
        ))}

        {editMode && newItems.map((q, i) => (
          <div key={`new-${i}`} className="border rounded-md p-3 space-y-2">
            <div className="grid sm:grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Qualification</p>
                <Input value={q.qualification} onChange={(e) => updateItem(i, { qualification: e.target.value })} placeholder="e.g. BA Theology" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Institution</p>
                <Input value={q.institution} onChange={(e) => updateItem(i, { institution: e.target.value })} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Year Obtained</p>
                <Input type="number" value={q.year_obtained} onChange={(e) => updateItem(i, { year_obtained: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Input type="file" className="max-w-xs" onChange={(e) => updateItem(i, { _file: e.target.files?.[0] || null })} />
                {q._file ? (
                  <span className="text-xs text-muted-foreground">{q._file.name}</span>
                ) : q.document_name ? (
                  <span className="text-xs text-muted-foreground">📎 {q.document_name}</span>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeRow(i)} className="text-destructive">Remove</Button>
            </div>
          </div>
        ))}

        {editMode && (
          <Button variant="outline" size="sm" onClick={addRow}>+ Add Qualification</Button>
        )}

        {!editMode && (
          <p className="text-xs text-muted-foreground">
            Click <strong>Add</strong> to submit new entries or attach supporting documents, then <strong>Submit and Review</strong> so the GBCC office can verify your changes. Existing records cannot be edited here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
