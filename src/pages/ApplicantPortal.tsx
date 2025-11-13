import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, LogOut } from "lucide-react";
import { toast } from "sonner";
import AdmissionForm from "./AdmissionForm";

type Step = {
  id: number;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
};

export default function ApplicantPortal() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const steps: Step[] = [
    {
      id: 1,
      title: "Personal Information",
      description: "Basic details and contact info",
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "current" : "upcoming",
    },
    {
      id: 2,
      title: "Educational Background",
      description: "Academic qualifications",
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "upcoming",
    },
    {
      id: 3,
      title: "Document Upload",
      description: "Required documents",
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "upcoming",
    },
    {
      id: 4,
      title: "Review & Submit",
      description: "Final review",
      status: currentStep === 4 ? "current" : "upcoming",
    },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Please log in to continue");
      navigate('/apply-auth');
      return;
    }

    setUser(session.user);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate('/');
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Applicant Portal</h1>
            <p className="text-sm text-muted-foreground">{user?.phone}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Application Progress</h2>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Steps */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Steps</CardTitle>
                <CardDescription>Track your application progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      step.status === "current"
                        ? "bg-primary/10 border border-primary/20"
                        : step.status === "completed"
                        ? "bg-muted/50"
                        : "opacity-60"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        step.status === "current" ? "text-primary fill-primary" : "text-muted-foreground"
                      }`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${
                        step.status === "current" ? "text-primary" : ""
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area - Form */}
          <div className="lg:col-span-3">
            <AdmissionForm currentStep={currentStep} onStepChange={setCurrentStep} />
          </div>
        </div>
      </div>
    </div>
  );
}
