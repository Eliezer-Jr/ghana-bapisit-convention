import { supabase } from "@/lib/supabase";

export interface ActivityLog {
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
}

export const useActivityLog = () => {
  const logActivity = async ({ action, details, ip_address }: ActivityLog) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action,
          details: details || {},
          ip_address: ip_address || null,
        });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error in logActivity:', error);
    }
  };

  return { logActivity };
};
