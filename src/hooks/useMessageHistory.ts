import { useState } from "react";
import { supabaseFunctions } from "@/lib/supabase";
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
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>({
    datefrom: "",
    dateto: "",
    senderid: "",
    status: "",
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!filters.datefrom || !filters.dateto) {
        setError("Please select date range");
        toast.error("Please select date range");
        return;
      }

      // Moolre doesn't have a dedicated history endpoint
      // Return empty data with a notice
      setHistoryData({ messages: [], total: 0 });
      toast.info("Message history is available through the Moolre dashboard at app.moolre.com");
    } catch (error: any) {
      setError(error.message || "Failed to fetch history");
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
    error,
    setError,
    fetchHistory
  };
};
