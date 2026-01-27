import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Save } from "lucide-react";

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
          <Label htmlFor="fellowship">Fellowship *</Label>
          <Input
            id="fellowship"
            value={data.fellowship}
            onChange={(e) => handleChange("fellowship", e.target.value)}
            disabled={isSubmitted}
            placeholder="Enter fellowship"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="association">Association *</Label>
          <Input
            id="association"
            value={data.association}
            onChange={(e) => handleChange("association", e.target.value)}
            disabled={isSubmitted}
            placeholder="Enter association"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Sector *</Label>
          <Input
            id="sector"
            value={data.sector}
            onChange={(e) => handleChange("sector", e.target.value)}
            disabled={isSubmitted}
            placeholder="Enter sector"
          />
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
