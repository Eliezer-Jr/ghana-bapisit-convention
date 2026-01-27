import { supabase } from "@/lib/supabase";

export interface OTPResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class OTPService {
  /**
   * Generate and send OTP to phone number
   */
  static async generateOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("frogapi-otp-generate", {
        body: { phoneNumber },
      });

      if (error) {
        console.error("OTP generation error:", error);
        return {
          success: false,
          error: error.message || "Failed to send OTP",
        };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.data?.message || data?.error || "Failed to send OTP",
        };
      }

      return {
        success: true,
        data: data.data,
        message: "OTP sent successfully",
      };
    } catch (error: any) {
      console.error("OTP generation exception:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  static async verifyOTP(
    phoneNumber: string,
    otp: string,
    fullName?: string,
    isSignup?: boolean
  ): Promise<OTPResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("frogapi-otp-verify", {
        body: {
          phoneNumber,
          otp: String(otp).trim(),
          fullName,
          isSignup,
        },
      });

      if (error) {
        console.error("OTP verification error:", error);
        return {
          success: false,
          error: error.message || "Failed to verify OTP",
        };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || "Invalid or expired OTP",
        };
      }

      return {
        success: true,
        data: data,
        message: data.message || "Verification successful",
      };
    } catch (error: any) {
      console.error("OTP verification exception:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }
}
