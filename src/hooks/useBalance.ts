import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const useBalance = () => {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('frogapi-balance');
      
      if (error) throw error;
      setBalance(data);
      toast.success("Balance fetched successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  return { balance, loading, fetchBalance };
};
