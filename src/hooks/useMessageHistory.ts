import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface HistoryFilters {
  datefrom: string;
  dateto: string;
  senderid: string;
  status: string;
}

export const useMessageHistory = () => {
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({
    datefrom: "",
    dateto: "",
    senderid: "",
    status: "",
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      if (!filters.datefrom || !filters.dateto) {
        toast.error("Please select date range");
        return;
      }

      const { data, error } = await supabase.functions.invoke('frogapi-history', {
        body: {
          service: "SMS",
          servicetype: "TEXT",
          ...filters
        }
      });
      
      if (error) throw error;
      setHistoryData(data);
      toast.success("History fetched successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  return {
    historyData,
    filters,
    setFilters,
    loading,
    fetchHistory
  };
};
