import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, User, Phone } from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";
import { OTPService } from "@/services/otp";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Profile() {
  const { user, profile } = useAuth();
  const { logActivity } = useActivityLog();
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('minister-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('minister-photos')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await logActivity({
        action: 'profile_avatar_updated',
        details: { avatar_url: publicUrl }
      });

      toast.success("Profile image updated successfully");
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!user || !fullName.trim()) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      await logActivity({
        action: 'profile_name_updated',
        details: { old_name: profile?.full_name, new_name: fullName }
      });

      toast.success("Name updated successfully");
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating name:', error);
      toast.error(error.message || "Failed to update name");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendOTP = async () => {
    if (!newPhoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    try {
      setVerifying(true);
      const result = await OTPService.generateOTP(newPhoneNumber);
      
      if (result.success) {
        setOtpSent(true);
        toast.success("OTP sent to your phone number");
      } else {
        toast.error(result.error || "Failed to send OTP");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!user || !otp || !newPhoneNumber) return;

    try {
      setVerifying(true);
      const result = await OTPService.verifyOTP(newPhoneNumber, otp, user.user_metadata?.full_name || "User");
      
      if (result.success) {
        // Update phone number in profile
        const { error } = await supabase
          .from('profiles')
          .update({ phone_number: newPhoneNumber })
          .eq('id', user.id);

        if (error) throw error;

        await logActivity({
          action: 'profile_phone_updated',
          details: { old_phone: profile?.phone_number, new_phone: newPhoneNumber }
        });

        toast.success("Phone number updated successfully");
        setOtpSent(false);
        setOtp("");
        setNewPhoneNumber("");
        window.location.reload();
      } else {
        toast.error(result.error || "Invalid OTP");
      }
    } catch (error: any) {
      console.error('Error updating phone:', error);
      toast.error(error.message || "Failed to update phone number");
    } finally {
      setVerifying(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>Upload or change your profile image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-fit">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? "Uploading..." : "Upload Image"}
                    </div>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Name Section */}
          <Card>
            <CardHeader>
              <CardTitle>Full Name</CardTitle>
              <CardDescription>Update your display name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <Button onClick={handleNameUpdate} disabled={updating || !fullName.trim()}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Name
              </Button>
            </CardContent>
          </Card>

          {/* Phone Number Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Number
              </CardTitle>
              <CardDescription>
                Current: {profile?.phone_number || "Not set"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">New Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      placeholder="Enter new phone number"
                    />
                  </div>
                  <Button onClick={handleSendOTP} disabled={verifying || !newPhoneNumber.trim()}>
                    {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Enter OTP</Label>
                    <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleVerifyAndUpdate} disabled={verifying || otp.length !== 6}>
                      {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify & Update
                    </Button>
                    <Button variant="outline" onClick={() => setOtpSent(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span>{profile?.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account Created:</span>
                <span>{new Date(profile?.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
