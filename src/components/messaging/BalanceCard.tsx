import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Loader2 } from "lucide-react";
import { useBalance } from "@/hooks/useBalance";
import { ErrorDisplay } from "@/components/ErrorDisplay";

export const BalanceCard = () => {
  const { balance, loading, error, fetchBalance, setError } = useBalance();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Account Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        <Button onClick={fetchBalance} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Check Balance
        </Button>
        {balance && balance !== "0" && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-foreground">GHS {balance}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
