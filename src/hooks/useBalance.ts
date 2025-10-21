import { useState } from "react";
import { FrogAPIService } from "@/services/frogapi";
import { toast } from "sonner";

export const useBalance = () => {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await FrogAPIService.getBalance();
      
      if (result.success) {
        setBalance(result.data?.balance || "0");
        toast.success("Balance fetched successfully");
      } else {
        setError(result.error || "Failed to fetch balance");
        toast.error(result.error || "Failed to fetch balance");
      }
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      toast.error(error.message || "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  return { balance, loading, error, fetchBalance, setError };
};
