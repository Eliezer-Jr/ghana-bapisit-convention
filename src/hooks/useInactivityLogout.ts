import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useInactivityLogout(enabled: boolean = true) {
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.info("You have been logged out due to inactivity");
      navigate("/");
    }
  }, [navigate]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (enabled) {
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [enabled, handleLogout]);

  useEffect(() => {
    if (!enabled) return;

    // Events that indicate user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Set up event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetTimer]);

  return { resetTimer, handleLogout };
}
