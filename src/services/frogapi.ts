import { supabaseFunctions } from "@/lib/supabase";
import { MESSAGING_CONFIG } from "@/config/messaging";

export interface FrogAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class FrogAPIService {
  /**
   * Get SMS balance
   */
  static async getBalance(): Promise<FrogAPIResponse> {
    try {
      const { data, error } = await supabaseFunctions.functions.invoke("frogapi-balance");

      if (error) {
        console.error("Balance fetch error:", error);
        return {
          success: false,
          error: error.message || "Failed to fetch balance",
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      console.error("Balance fetch exception:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * Send general SMS to multiple recipients
   */
  static async sendGeneralSMS(
    recipients: string[],
    message: string
  ): Promise<FrogAPIResponse> {
    try {
      const { data, error } = await supabaseFunctions.functions.invoke("frogapi-send-general", {
        body: {
          senderid: MESSAGING_CONFIG.SENDER_ID,
          destinations: recipients.map(r => ({ destination: r })),
          message,
        },
      });

      if (error) {
        console.error("General SMS send error:", error);
        return {
          success: false,
          error: error.message || "Failed to send SMS",
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      console.error("General SMS send exception:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * Send personalized SMS to multiple recipients
   */
  static async sendPersonalizedSMS(
    messages: Array<{ recipient: string; message: string }>
  ): Promise<FrogAPIResponse> {
    try {
      const { data, error } = await supabaseFunctions.functions.invoke(
        "frogapi-send-personalized",
        {
          body: {
            senderid: MESSAGING_CONFIG.SENDER_ID,
            destinations: messages.map(m => ({
              destination: m.recipient,
              message: m.message,
            })),
          },
        }
      );

      if (error) {
        console.error("Personalized SMS send error:", error);
        return {
          success: false,
          error: error.message || "Failed to send personalized SMS",
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      console.error("Personalized SMS send exception:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * Get message history - Frog provides a history endpoint; use the messaging history screen for detailed filters
   */
  static async getHistory(
    startDate?: string,
    endDate?: string
  ): Promise<FrogAPIResponse> {
    return {
      success: true,
      data: { messages: [], total: 0 },
    };
  }
}
