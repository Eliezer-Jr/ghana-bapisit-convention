import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, Phone, Globe } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import approvalHero from "@/assets/approval-hero.png";

const PendingApproval = () => {
  const { user, isApproved } = useAuth();
  const navigate = useNavigate();

  // Redirect if approved
  if (isApproved) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Image Side */}
          <div className="hidden md:block relative">
            <img 
              src={approvalHero} 
              alt="Ghana Baptist Convention Conference" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20" />
          </div>

          {/* Content Side */}
          <div>
            <CardHeader className="text-center space-y-4 pt-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-accent/10 p-4">
                  <Clock className="h-12 w-12 text-accent animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-3xl">Pending Approval</CardTitle>
              <CardDescription className="text-base">
                Your account is awaiting approval from a super administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg text-foreground">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Email:</span> {user?.email}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Status:</span>{" "}
                    <span className="text-accent font-medium">Pending Approval</span>
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-lg mb-4">Developer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Email Support</p>
                      <p className="text-sm text-muted-foreground">info@lordeconsult.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Phone Support</p>
                      <p className="text-sm text-muted-foreground">+233 55 708 3554</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Website</p>
                      <p className="text-sm text-muted-foreground">lordeconsult.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong className="text-foreground">What happens next?</strong>
                </p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>A super administrator will review your account</li>
                  <li>You'll receive an SMS notification once approved</li>
                  <li>After approval, you can access the full system</li>
                </ul>
              </div>

              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PendingApproval;
