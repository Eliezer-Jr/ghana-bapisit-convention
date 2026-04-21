import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Save } from "lucide-react";
import { SECTORS, getAssociationsForSector, getFellowshipsForAssociation } from "@/config/ministerOptions";

interface ChurchInformationStepProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSave: (data: any) => void;
  isSubmitted: boolean;
}

export default function ChurchInformationStep({
  formData,
  onNext,
  onBack,
  onSave,
  isSubmitted,
}: ChurchInformationStepProps) {
  const [data, setData] = useState({
    church_name: formData.church_name || "",
    fellowship: formData.fellowship || "",
    association: formData.association || "",
    sector: formData.sector || "",
  });

  const handleChange = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  const handleSectorChange = (value: string) => {
    setData({ ...data, sector: value, association: "", fellowship: "" });
  };

  const handleSave = () => {
    onSave(data);
  };

  const handleNext = () => {
    if (!data.church_name || !data.fellowship || !data.association || !data.sector) {
      alert("Please fill in all required fields");
      return;
    }
    onNext(data);
  };

  const filteredAssociations = getAssociationsForSector(data.sector);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Church Information</h2>
        <p className="text-muted-foreground">Provide details about your church affiliation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="church_name">Church Name *</Label>
          <Input
            id="church_name"
            value={data.church_name}
            onChange={(e) => handleChange("church_name", e.target.value)}
            disabled={isSubmitted}
            placeholder="Enter church name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Sector *</Label>
          <Select
            value={data.sector}
            onValueChange={handleSectorChange}
            disabled={isSubmitted}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="association">Association *</Label>
          <Select
            value={data.association}
            onValueChange={(value) => handleChange("association", value)}
            disabled={isSubmitted || !data.sector}
          >
            <SelectTrigger>
              <SelectValue placeholder={data.sector ? "Select association" : "Select sector first"} />
            </SelectTrigger>
            <SelectContent>
              {filteredAssociations.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fellowship">Fellowship *</Label>
          <Select
            value={data.fellowship}
            onValueChange={(value) => handleChange("fellowship", value)}
            disabled={isSubmitted || !data.association}
          >
            <SelectTrigger>
              <SelectValue placeholder={data.association ? "Select fellowship" : "Select association first"} />
            </SelectTrigger>
            <SelectContent>
              {getFellowshipsForAssociation(data.association).map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isSubmitted && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
          <Button onClick={handleNext} className="ml-auto">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
