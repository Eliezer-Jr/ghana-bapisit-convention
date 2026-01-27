import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { MESSAGING_CONFIG } from "@/config/messaging";

interface Destination {
  destination: string;
  msgid?: string;
  message?: string;
}

interface ExcelContact {
  name: string;
  phone_number: string;
}

export const useSMSMessaging = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllMinisters = async () => {
    try {
      const { data, error } = await supabase
        .from('ministers')
        .select('phone, whatsapp, full_name');
      
      if (error) throw error;
      
      const phoneNumbers: Destination[] = [];
      data?.forEach(minister => {
        if (minister.phone) phoneNumbers.push({ destination: minister.phone });
        if (minister.whatsapp && minister.whatsapp !== minister.phone) {
          phoneNumbers.push({ destination: minister.whatsapp });
        }
      });
      
      return phoneNumbers;
    } catch (error: any) {
      toast.error("Failed to fetch ministers: " + error.message);
      return [];
    }
  };

  const replacePlaceholders = (message: string, contact: ExcelContact): string => {
    return message
      .replace(/\[\[name\]\]/gi, contact.name)
      .replace(/\[\[phone_number\]\]/gi, contact.phone_number);
  };

  const sendGeneralSMS = async (
    message: string,
    destinations: Destination[],
    excelContacts: ExcelContact[],
    useAllMinisters: boolean
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      let finalDestinations: Destination[] = [];
      
      if (useAllMinisters) {
        finalDestinations = await fetchAllMinisters();
      } else if (excelContacts.length > 0) {
        finalDestinations = excelContacts.map(contact => ({
          destination: contact.phone_number,
          message: replacePlaceholders(message, contact)
        }));
      } else {
        finalDestinations = destinations.filter(d => d.destination.trim());
      }
      
      if (finalDestinations.length === 0) {
        setError("Please add at least one phone number");
        toast.error("Please add at least one phone number or select a source");
        return;
      }
      
      if (!message.trim()) {
        setError("Please enter a message");
        toast.error("Please enter a message");
        return;
      }

      if (excelContacts.length > 0 && (message.includes('[[name]]') || message.includes('[[phone_number]]'))) {
        const { data, error } = await supabase.functions.invoke('frogapi-send-personalized', {
          body: {
            senderid: MESSAGING_CONFIG.SENDER_ID,
            destinations: finalDestinations.map(d => ({
              destination: d.destination,
              message: d.message || message,
              smstype: MESSAGING_CONFIG.SMS_TYPE
            }))
          }
        });
        
        if (error) throw error;
        toast.success("Personalized SMS sent successfully");
      } else {
        const { data, error } = await supabase.functions.invoke('frogapi-send-general', {
          body: {
            senderid: MESSAGING_CONFIG.SENDER_ID,
            destinations: finalDestinations,
            message: message,
            smstype: MESSAGING_CONFIG.SMS_TYPE
          }
        });
        
        if (error) throw error;
        toast.success("SMS sent successfully");
      }
    } catch (error: any) {
      setError(error.message || "Failed to send SMS");
      toast.error(error.message || "Failed to send SMS");
    } finally {
      setLoading(false);
    }
  };

  const sendPersonalizedSMS = async (destinations: Array<{ destination: string; message?: string }>) => {
    try {
      setLoading(true);
      setError(null);
      
      const validDestinations = destinations.filter(
        d => d.destination.trim() && d.message?.trim()
      );
      
      if (validDestinations.length === 0) {
        setError("Please add at least one recipient with message");
        toast.error("Please add at least one recipient with message");
        return;
      }

      const { data, error } = await supabase.functions.invoke('frogapi-send-personalized', {
        body: {
          senderid: MESSAGING_CONFIG.SENDER_ID,
          destinations: validDestinations.map(d => ({
            ...d,
            smstype: MESSAGING_CONFIG.SMS_TYPE
          }))
        }
      });
      
      if (error) throw error;
      toast.success("Personalized SMS sent successfully");
    } catch (error: any) {
      setError(error.message || "Failed to send personalized SMS");
      toast.error(error.message || "Failed to send personalized SMS");
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, sendGeneralSMS, sendPersonalizedSMS };
};
