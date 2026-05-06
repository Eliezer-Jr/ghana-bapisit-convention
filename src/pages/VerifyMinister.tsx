import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import logoGbcc from "@/assets/logo-gbcc.png";

const FN_BASE = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_FUNCTIONS_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function VerifyMinister() {
  const { ministerId } = useParams();
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");
  const [m, setM] = useState<any>(null);

  useEffect(() => {
    fetch(`${FN_BASE}/verify-minister?id=${encodeURIComponent(ministerId || "")}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) { setM(d.minister); setState("ok"); } else setState("fail"); })
      .catch(() => setState("fail"));
  }, [ministerId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b pb-4">
            <img src={logoGbcc} alt="GBCC" className="h-12 w-12" />
            <div>
              <p className="font-bold">Ghana Baptist Convention</p>
              <p className="text-xs text-muted-foreground">Minister Verification</p>
            </div>
          </div>
          {state === "loading" && <p className="text-center text-muted-foreground py-8">Verifying...</p>}
          {state === "fail" && (
            <div className="text-center py-8 space-y-2">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-semibold">Not a recognised Minister ID</p>
              <p className="text-sm text-muted-foreground">{ministerId}</p>
            </div>
          )}
          {state === "ok" && m && (
            <div className="space-y-3">
              <div className="flex items-center justify-center text-emerald-600 gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Verified</span>
              </div>
              <div className="flex gap-4">
                <div className="w-24 h-32 bg-muted rounded-md overflow-hidden">
                  {m.photo_url && <img src={m.photo_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{m.full_name}</p>
                  <p className="font-mono text-sm">{m.minister_id}</p>
                  <Badge className="mt-1 capitalize">{m.status}</Badge>
                  <p className="text-sm mt-2"><span className="text-muted-foreground">Role:</span> {m.role || "—"}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Church:</span> {m.current_church_name || "—"}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Association:</span> {m.association || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
