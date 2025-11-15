import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Save } from "lucide-react";

interface PersonalInformationStepProps {
  formData: any;
  onNext: (data: any) => void;
  onSave: (data: any) => void;
  isSubmitted: boolean;
}

export default function PersonalInformationStep({
  formData,
  onNext,
  onSave,
  isSubmitted,
}: PersonalInformationStepProps) {
  const [data, setData] = useState({
    full_name: formData.full_name || "",
    date_of_birth: formData.date_of_birth || "",
    phone: formData.phone || "",
    email: formData.email || "",
    marital_status: formData.marital_status || "",
    spouse_name: formData.spouse_name || "",
  });

  const handleChange = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  const handleSave = () => {
    onSave(data);
  };

  const handleNext = () => {
    if (!data.full_name || !data.date_of_birth || !data.phone || !data.email || !data.marital_status) {
      alert("Please fill in all required fields");
      return;
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">Please provide your personal details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={data.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            disabled={isSubmitted}
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={data.date_of_birth}
            onChange={(e) => handleChange("date_of_birth", e.target.value)}
            disabled={isSubmitted}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={isSubmitted}
            placeholder="0XXXXXXXXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={isSubmitted}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marital_status">Marital Status *</Label>
          <Select
            value={data.marital_status}
            onValueChange={(value) => handleChange("marital_status", value)}
            disabled={isSubmitted}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.marital_status === "married" && (
          <div className="space-y-2">
            <Label htmlFor="spouse_name">Spouse Name</Label>
            <Input
              id="spouse_name"
              value={data.spouse_name}
              onChange={(e) => handleChange("spouse_name", e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter spouse name"
            />
          </div>
        )}
      </div>

      {!isSubmitted && (
        <div className="flex gap-4">
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
