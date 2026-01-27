import { useState, useEffect } from "react";
import { supabase, supabaseFunctions } from "@/lib/supabase";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { MESSAGING_CONFIG } from "@/config/messaging";

interface EventMinister {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  date_of_birth?: string;
  date_joined: string;
  event_date: Date;
  event_type: 'birthday' | 'anniversary';
}

export const useEventMessages = () => {
  const [eventType, setEventType] = useState<'birthday' | 'anniversary'>('birthday');
  const [upcomingEvents, setUpcomingEvents] = useState<EventMinister[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [eventType]);

  const fetchUpcomingEvents = async () => {
    try {
      // Use supabase (DB client) for database queries
      const { data: ministers, error } = await supabase
        .from('ministers')
        .select('id, full_name, phone, whatsapp, date_of_birth, date_joined');
      
      if (error) throw error;

      const today = new Date();
      const nextWeek = addDays(today, MESSAGING_CONFIG.EVENT_LOOKAHEAD_DAYS);
      const events: EventMinister[] = [];

      ministers?.forEach((minister) => {
        if (eventType === 'birthday' && minister.date_of_birth) {
          const birthDate = new Date(minister.date_of_birth);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          
          if (thisYearBirthday >= today && thisYearBirthday <= nextWeek) {
            events.push({
              ...minister,
              event_date: thisYearBirthday,
              event_type: 'birthday'
            });
          }
        } else if (eventType === 'anniversary' && minister.date_joined) {
          const joinDate = new Date(minister.date_joined);
          const thisYearAnniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
          
          if (thisYearAnniversary >= today && thisYearAnniversary <= nextWeek) {
            events.push({
              ...minister,
              event_date: thisYearAnniversary,
              event_type: 'anniversary'
            });
          }
        }
      });

      events.sort((a, b) => a.event_date.getTime() - b.event_date.getTime());
      setUpcomingEvents(events);
    } catch (error: any) {
      toast.error("Failed to fetch events: " + error.message);
    }
  };

  const sendEventMessages = async (message: string) => {
    try {
      setLoading(true);
      
      if (!message.trim()) {
        toast.error("Please enter a message");
        return;
      }

      const destinations = upcomingEvents.flatMap(minister => {
        const phones = [];
        if (minister.phone) {
          phones.push({
            destination: minister.phone,
            message: message.replace(/\[\[name\]\]/gi, minister.full_name)
          });
        }
        if (minister.whatsapp && minister.whatsapp !== minister.phone) {
          phones.push({
            destination: minister.whatsapp,
            message: message.replace(/\[\[name\]\]/gi, minister.full_name)
          });
        }
        return phones;
      });

      if (destinations.length === 0) {
        toast.error("No recipients found");
        return;
      }

      // Use supabaseFunctions for edge function calls
      const { data, error } = await supabaseFunctions.functions.invoke('frogapi-send-personalized', {
        body: {
          senderid: MESSAGING_CONFIG.SENDER_ID,
          destinations: destinations.map(d => ({
            ...d,
            smstype: MESSAGING_CONFIG.SMS_TYPE
          }))
        }
      });
      
      if (error) throw error;
      toast.success(`${eventType === 'birthday' ? 'Birthday' : 'Anniversary'} messages sent to ${upcomingEvents.length} ministers`);
      console.log(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to send event messages");
    } finally {
      setLoading(false);
    }
  };

  return {
    eventType,
    setEventType,
    upcomingEvents,
    loading,
    sendEventMessages
  };
};
