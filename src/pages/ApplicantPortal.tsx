import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { LogOut, CheckCircle2, Circle, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import PersonalInformationStep from "@/components/application/PersonalInformationStep";
import ChurchInformationStep from "@/components/application/ChurchInformationStep";
import AdmissionTrainingStep from "@/components/application/AdmissionTrainingStep";
import DocumentsStep from "@/components/application/DocumentsStep";
import SummaryStep from "@/components/application/SummaryStep";

const STEPS = [
  { 
    id: 0, 
    title: "Personal Information", 
    component: (props: any) => <PersonalInformationStep {...props} />
  },
  { 
    id: 1, 
    title: "Church Information", 
    component: (props: any) => <ChurchInformationStep {...props} />
  },
  { 
    id: 2, 
    title: "Admission & Training", 
    component: (props: any) => <AdmissionTrainingStep {...props} />
  },
  { 
    id: 3, 
    title: "Documents", 
    component: (props: any) => <DocumentsStep {...props} />
  },
  { 
    id: 4, 
    title: "Summary & Confirmation", 
    component: (props: any) => <SummaryStep {...props} />
  },
];

export default function ApplicantPortal() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string>("draft");
  const [formData, setFormData] = useState<any>({
    admission_level: "licensing",
    full_name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    marital_status: "",
    spouse_name: "",
    church_name: "",
    association: "",
    sector: "",
    fellowship: "",
    theological_institution: "",
    theological_qualification: "",
    mentor_name: "",
    mentor_contact: "",
    vision_statement: "",
    ministry_evaluation_paper: "",
  });

  useEffect(() => {
    checkApplicant();
  }, []);

  const checkApplicant = async () => {
    // Get phone number from localStorage (set during OTP verification)
    const phoneNumber = localStorage.getItem('applicant_phone');
    
    if (!phoneNumber) {
      navigate("/apply");
      return;
    }

    // Load existing application if any
    await loadApplication(phoneNumber);
    setLoading(false);
  };

  const loadApplication = async (phoneNumber: string) => {
    const { data: applications, error } = await supabase
      .from("applications")
      .select("*")
      .eq("phone", phoneNumber)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error loading application:", error);
      return;
    }

    if (applications && applications.length > 0) {
      const app = applications[0];
      setApplicationId(app.id);
      setApplicationStatus(app.status);
      setFormData(app);

      // Determine which step to show based on filled data
      if (app.status === "submitted") {
        setCurrentStep(4); // Show summary for submitted applications
      } else {
        // Calculate the furthest completed step
        let stepToShow = 0;
        
        // Check Step 0: Personal Information
        const hasPersonalInfo = app.full_name && app.date_of_birth && app.phone && app.email && app.marital_status;
        if (hasPersonalInfo) {
          stepToShow = 1;
          
          // Check Step 1: Church Information
          const hasChurchInfo = app.church_name && app.association && app.sector && app.fellowship;
          if (hasChurchInfo) {
            stepToShow = 2;
            
            // Check Step 2: Admission & Training
            const hasAdmissionInfo = app.theological_institution && app.theological_qualification;
            if (hasAdmissionInfo) {
              stepToShow = 3;
              
              // If all previous steps are complete, go to documents step
            }
          }
        }
        
        setCurrentStep(stepToShow);
        
        // Show welcome back message with last saved time
        const lastSaved = formatDistanceToNow(new Date(app.updated_at), { addSuffix: true });
        toast.success(
          `Welcome back! Last saved ${lastSaved}. Continuing from ${STEPS[stepToShow].title}.`,
          { duration: 5000 }
        );
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('applicant_phone');
    localStorage.removeItem('applicant_name');
    navigate("/apply");
  };

  const saveProgress = async (data: any) => {
    try {
      const phoneNumber = localStorage.getItem('applicant_phone');
      
      if (!phoneNumber) {
        toast.error("Session expired. Please log in again.");
        navigate("/apply");
        return;
      }

      const payload = {
        ...formData,
        ...data,
        user_id: null, // No user_id for applicants
        status: applicationStatus === "submitted" ? "submitted" : "draft",
      };

      if (applicationId) {
        // Update existing application
        const { error } = await supabase
          .from("applications")
          .update(payload)
          .eq("id", applicationId);

        if (error) throw error;
      } else {
        // Check if application already exists for this phone number
        const { data: existing, error: fetchError } = await supabase
          .from('applications')
          .select('id')
          .eq('phone', phoneNumber)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          // Application exists, update it instead of creating new
          const { error } = await supabase
            .from("applications")
            .update(payload)
            .eq("id", existing.id);

          if (error) throw error;
          setApplicationId(existing.id);
        } else {
          // No application exists, create new one
          const { data: newApp, error } = await supabase
            .from("applications")
            .insert(payload)
            .select()
            .single();

          if (error) throw error;
          setApplicationId(newApp.id);
        }
      }

      setFormData(payload);
      toast.success("Progress saved successfully");
    } catch (error: any) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    }
  };

  const handleNext = async (data: any) => {
    await saveProgress(data);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!applicationId) {
        toast.error("Please complete all steps first");
        return;
      }

      const { error } = await supabase
        .from("applications")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) throw error;

      setApplicationStatus("submitted");
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Applicant Portal</h1>
            <p className="text-sm text-muted-foreground">
              Status: <span className="font-medium capitalize">{applicationStatus}</span>
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <Card className="p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-3 border-2 border-border">
                  <AvatarImage src={formData.photo_url} alt="Profile photo" />
                  <AvatarFallback className="bg-muted">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium text-center">{formData.full_name || "No name yet"}</p>
              </div>
              <h2 className="font-semibold mb-4">Application Steps</h2>
              <nav className="space-y-2">
                {STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      currentStep === index
                        ? "bg-primary text-primary-foreground"
                        : index < currentStep
                        ? "text-foreground hover:bg-accent"
                        : "text-muted-foreground"
                    }`}
                    disabled={applicationStatus === "submitted" && index !== 4}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0" />
                    )}
                    <span className="text-sm">{step.title}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <CurrentStepComponent
                formData={formData}
                onNext={handleNext}
                onBack={handleBack}
                onSave={saveProgress}
                onSubmit={handleSubmit}
                applicationId={applicationId}
                isSubmitted={applicationStatus === "submitted"}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
