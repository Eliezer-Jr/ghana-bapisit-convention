import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Save } from "lucide-react";

interface AdmissionTrainingStepProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSave: (data: any) => void;
  isSubmitted: boolean;
}

export default function AdmissionTrainingStep({
  formData,
  onNext,
  onBack,
  onSave,
  isSubmitted,
}: AdmissionTrainingStepProps) {
  const [data, setData] = useState({
    admission_level: formData.admission_level || "licensing",
    theological_institution: formData.theological_institution || "",
    theological_qualification: formData.theological_qualification || "",
    mentor_name: formData.mentor_name || "",
    mentor_contact: formData.mentor_contact || "",
    vision_statement: formData.vision_statement || "",
    ministry_evaluation_paper: formData.ministry_evaluation_paper || "",
  });

  const handleChange = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  const handleSave = () => {
    onSave(data);
  };

  const handleNext = () => {
    if (!data.admission_level || !data.theological_institution) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate based on admission level
    if (data.admission_level === "licensing" && (!data.mentor_name || !data.mentor_contact || !data.vision_statement)) {
      alert("Licensing applicants must provide mentor details and vision statement");
      return;
    }

    if ((data.admission_level === "recognition" || data.admission_level === "ordination") && !data.ministry_evaluation_paper) {
      alert("Recognition and Ordination applicants must provide ministry evaluation paper");
      return;
    }

    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Admission & Training</h2>
        <p className="text-muted-foreground">Provide details about your theological training and admission level</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="admission_level">Admission Level *</Label>
          <Select
            value={data.admission_level}
            onValueChange={(value) => handleChange("admission_level", value)}
            disabled={isSubmitted}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="licensing">Licensing</SelectItem>
              <SelectItem value="recognition">Recognition</SelectItem>
              <SelectItem value="ordination">Ordination</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="theological_institution">Theological Institution *</Label>
            <Input
              id="theological_institution"
              value={data.theological_institution}
              onChange={(e) => handleChange("theological_institution", e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter institution name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theological_qualification">Qualification</Label>
            <Input
              id="theological_qualification"
              value={data.theological_qualification}
              onChange={(e) => handleChange("theological_qualification", e.target.value)}
              disabled={isSubmitted}
              placeholder="E.g., Certificate, Diploma, Degree"
            />
          </div>
        </div>

        {data.admission_level === "licensing" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mentor_name">Mentor Name *</Label>
                <Input
                  id="mentor_name"
                  value={data.mentor_name}
                  onChange={(e) => handleChange("mentor_name", e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Enter mentor's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mentor_contact">Mentor Contact *</Label>
                <Input
                  id="mentor_contact"
                  value={data.mentor_contact}
                  onChange={(e) => handleChange("mentor_contact", e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Enter mentor's phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vision_statement">Vision Statement *</Label>
              <Textarea
                id="vision_statement"
                value={data.vision_statement}
                onChange={(e) => handleChange("vision_statement", e.target.value)}
                disabled={isSubmitted}
                placeholder="Describe your ministry vision"
                rows={4}
              />
            </div>
          </>
        )}

        {(data.admission_level === "recognition" || data.admission_level === "ordination") && (
          <div className="space-y-2">
            <Label htmlFor="ministry_evaluation_paper">Ministry Evaluation Paper *</Label>
            <Textarea
              id="ministry_evaluation_paper"
              value={data.ministry_evaluation_paper}
              onChange={(e) => handleChange("ministry_evaluation_paper", e.target.value)}
              disabled={isSubmitted}
              placeholder="Provide a summary or reference to your ministry evaluation"
              rows={4}
            />
          </div>
        )}
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
