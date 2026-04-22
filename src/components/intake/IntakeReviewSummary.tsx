import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  GraduationCap,
  Church,
  Briefcase,
  Users,
  AlertTriangle,
} from "lucide-react";

interface IntakeReviewSummaryProps {
  payload: Record<string, any>;
}

function InfoRow({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{String(value)}</span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function QualificationDocumentPreview({
  documentUrl,
  documentName,
  documentType,
}: {
  documentUrl?: string | null;
  documentName?: string | null;
  documentType?: string | null;
}) {
  if (!documentUrl) return null;

  const isImage = documentType?.startsWith("image/");
  const isPdf = documentType === "application/pdf" || documentUrl.toLowerCase().includes(".pdf");

  return (
    <div className="mt-2 space-y-2">
      {documentName && (
        <p className="text-xs text-muted-foreground">{documentName}</p>
      )}
      {isImage ? (
        <img
          src={documentUrl}
          alt={documentName || "Qualification document"}
          className="max-h-56 w-full rounded-md border object-contain bg-muted/30"
        />
      ) : isPdf ? (
        <iframe
          src={documentUrl}
          title={documentName || "Qualification PDF preview"}
          className="h-64 w-full rounded-md border bg-background"
        />
      ) : (
        <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          Preview not available for this file type
        </div>
      )}
    </div>
  );
}

function GhanaCardDocumentPreview({
  documentUrl,
  documentName,
  documentType,
}: {
  documentUrl?: string | null;
  documentName?: string | null;
  documentType?: string | null;
}) {
  if (!documentUrl) return null;

  const isImage = documentType?.startsWith("image/");
  const isPdf = documentType === "application/pdf" || documentUrl.toLowerCase().includes(".pdf");

  return (
    <div className="mt-2 space-y-2">
      {documentName && (
        <p className="text-xs text-muted-foreground">{documentName}</p>
      )}
      {isImage ? (
        <img
          src={documentUrl}
          alt={documentName || "Ghana Card document"}
          className="max-h-56 w-full rounded-md border object-contain bg-muted/30"
        />
      ) : isPdf ? (
        <iframe
          src={documentUrl}
          title={documentName || "Ghana Card PDF preview"}
          className="h-64 w-full rounded-md border bg-background"
        />
      ) : (
        <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
          Preview not available for this file type
        </div>
      )}
    </div>
  );
}

export default function IntakeReviewSummary({ payload }: IntakeReviewSummaryProps) {
  const isSingle = payload.marital_status === "single";
  const hasQualifications = payload.qualifications?.length > 0;
  const hasChildren = !isSingle && payload.children?.length > 0;
  const hasMinisterialHistory = payload.ministerial_history?.length > 0;
  const hasConventionPositions = payload.convention_positions?.length > 0;
  const hasNonChurchWork = payload.non_church_work?.length > 0;
  const hasEmergencyContact = payload.emergency_contact?.contact_name;

  // Validation warnings
  const warnings: string[] = [];
  if (!payload.full_name?.trim()) warnings.push("Full name is required");
  if (!payload.phone?.trim()) warnings.push("Phone number is required");
  if (!payload.role?.trim()) warnings.push("Role/Position is required");

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive mb-1">
                Please fix the following before submitting:
              </p>
              <ul className="text-sm text-destructive/80 list-disc list-inside">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo and Basic Info */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
              <AvatarImage src={payload.photo_url} alt="Photo" />
              <AvatarFallback className="bg-primary/10">
                <User className="h-14 w-14 text-primary/40" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{payload.full_name || "—"}</h2>
              {payload.titles && (
                <p className="text-muted-foreground">{payload.titles}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {payload.role && (
                  <Badge variant="secondary">{payload.role}</Badge>
                )}
                {payload.association && (
                  <Badge variant="outline">{payload.association}</Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 text-sm text-muted-foreground justify-center sm:justify-start">
                {payload.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {payload.phone}
                  </span>
                )}
                {payload.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {payload.email}
                  </span>
                )}
                {payload.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {payload.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Personal Information */}
        <SectionCard title="Personal Information" icon={User}>
          <InfoRow label="Date of Birth" value={payload.date_of_birth} />
          <InfoRow label="Ghana Card Number" value={payload.ghana_card_number} />
          <InfoRow label="WhatsApp" value={payload.whatsapp} />
          <InfoRow label="GPS Address" value={payload.gps_address} />
          <InfoRow label="Location" value={payload.location} />
          <GhanaCardDocumentPreview
            documentUrl={payload.ghana_card_front_url}
            documentName={payload.ghana_card_front_name || "Ghana Card Front"}
            documentType={payload.ghana_card_front_type}
          />
          <GhanaCardDocumentPreview
            documentUrl={payload.ghana_card_back_url}
            documentName={payload.ghana_card_back_name || "Ghana Card Back"}
            documentType={payload.ghana_card_back_type}
          />
        </SectionCard>

        {/* Marital Information */}
        <SectionCard title="Marital Information" icon={Heart}>
          <InfoRow label="Marital Status" value={payload.marital_status} />
          {!isSingle && (
            <>
              <InfoRow label="Marriage Type" value={payload.marriage_type} />
              <InfoRow label="Spouse Name" value={payload.spouse_name} />
              <InfoRow label="Spouse Phone" value={payload.spouse_phone_number} />
              <InfoRow label="Spouse Occupation" value={payload.spouse_occupation} />
              <InfoRow label="Number of Children" value={payload.number_of_children} />
            </>
          )}
        </SectionCard>

        {/* Convention Structure */}
        <SectionCard title="Convention Structure" icon={Church}>
          <InfoRow label="Association" value={payload.association} />
          <InfoRow label="Sector" value={payload.sector} />
          <InfoRow label="Zone" value={payload.zone} />
        </SectionCard>

        {/* Current Ministry */}
        <SectionCard title="Current Ministry" icon={Church}>
          <InfoRow label="Role/Position" value={payload.role} />
          <InfoRow
            label="Type of Ministry"
            value={
              payload.ministry_engagement === "full_time"
                ? "Full-Time"
                : payload.ministry_engagement === "part_time"
                  ? "Part-Time"
                  : payload.ministry_engagement
            }
          />
          <InfoRow label="Current Church Name" value={payload.current_church_name} />
          <InfoRow label="Position at Church" value={payload.position_at_church} />
          <InfoRow label="Church Address" value={payload.church_address} />
        </SectionCard>

        {/* Ministerial Milestones */}
        <SectionCard title="Ministerial Milestones" icon={Church}>
          <InfoRow label="Licensing Year" value={payload.licensing_year} />
          <InfoRow label="Recognition Year" value={payload.recognition_year} />
          <InfoRow label="Ordination Year" value={payload.ordination_year} />
          <InfoRow label="Commissioning Year" value={payload.commissioning_year} />
        </SectionCard>
      </div>

      {/* Children */}
      {hasChildren && (
        <SectionCard title="Children" icon={Users}>
          <div className="space-y-2">
            {payload.children.map((child: any, idx: number) => (
              <div key={idx} className="flex justify-between py-1.5 border-b last:border-0">
                <span className="font-medium">{child.child_name}</span>
                <span className="text-sm text-muted-foreground">{child.date_of_birth || "—"}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Educational Qualifications */}
      {hasQualifications && (
        <SectionCard title="Educational Qualifications" icon={GraduationCap}>
          <div className="space-y-3">
            {payload.qualifications.map((qual: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                <p className="font-medium">{qual.qualification}</p>
                <p className="text-sm text-muted-foreground">
                  {qual.institution} {qual.year_obtained && `(${qual.year_obtained})`}
                </p>
                <QualificationDocumentPreview
                  documentUrl={qual.document_url}
                  documentName={qual.document_name}
                  documentType={qual.document_type}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Ministerial History */}
      {hasMinisterialHistory && (
        <SectionCard title="Ministerial History" icon={Church}>
          <div className="space-y-3">
            {payload.ministerial_history.map((hist: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                <p className="font-medium">{hist.position} at {hist.church_name}</p>
                <p className="text-sm text-muted-foreground">
                  {hist.association && `${hist.association}`}
                  {hist.sector && ` / ${hist.sector}`}
                  {(hist.period_start || hist.period_end) && (
                    <span className="ml-2">({hist.period_start || "?"} - {hist.period_end || "Present"})</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Convention Positions */}
      {hasConventionPositions && (
        <SectionCard title="Convention Positions" icon={Briefcase}>
          <div className="space-y-3">
            {payload.convention_positions.map((pos: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                <p className="font-medium">{pos.position}</p>
                <p className="text-sm text-muted-foreground">
                  {pos.period_start || "?"} - {pos.period_end || "Present"}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Non-Church Work */}
      {hasNonChurchWork && (
        <SectionCard title="Other Work Experience" icon={Briefcase}>
          <div className="space-y-3">
            {payload.non_church_work.map((work: any, idx: number) => (
              <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                <p className="font-medium">{work.job_title}</p>
                <p className="text-sm text-muted-foreground">
                  {work.organization}
                  {(work.period_start || work.period_end) && (
                    <span className="ml-2">({work.period_start || "?"} - {work.period_end || "Present"})</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Emergency Contact */}
      {hasEmergencyContact && (
        <SectionCard title="Emergency Contact" icon={Phone}>
          <InfoRow label="Contact Name" value={payload.emergency_contact.contact_name} />
          <InfoRow label="Relationship" value={payload.emergency_contact.relationship} />
          <InfoRow label="Phone Number" value={payload.emergency_contact.phone_number} />
        </SectionCard>
      )}

      {/* Notes */}
      {payload.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{payload.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
