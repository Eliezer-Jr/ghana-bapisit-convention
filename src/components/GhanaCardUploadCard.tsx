import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Trash2, Upload } from "lucide-react";

type GhanaCardUploadCardProps = {
  id: string;
  title: string;
  sideLabel: string;
  imageUrl?: string | null;
  imageName?: string | null;
  disabled?: boolean;
  onUpload: (file: File | null) => void | Promise<void>;
  onRemove: () => void;
};

export default function GhanaCardUploadCard({
  id,
  title,
  sideLabel,
  imageUrl,
  imageName,
  disabled,
  onUpload,
  onRemove,
}: GhanaCardUploadCardProps) {
  return (
    <div className="rounded-lg border bg-card/60 p-3 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{sideLabel}</p>
        </div>
        <div className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
          Image only
        </div>
      </div>

      <AspectRatio ratio={1.586} className="overflow-hidden rounded-md border bg-muted/30">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageName || title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <CreditCard className="h-8 w-8" />
            <p className="text-xs">No image uploaded</p>
          </div>
        )}
      </AspectRatio>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Label htmlFor={id} className="cursor-pointer">
          <div className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90">
            <Upload className="h-4 w-4" />
            <span>{imageUrl ? "Replace Image" : "Upload Image"}</span>
          </div>
        </Label>
        <Input
          id={id}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            void onUpload(e.target.files?.[0] || null);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled || !imageUrl}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </Button>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground">Accepted: images only, up to 2MB.</p>
        <p className="truncate text-xs text-muted-foreground">
          {imageName || "PNG or JPG recommended"}
        </p>
      </div>
    </div>
  );
}
