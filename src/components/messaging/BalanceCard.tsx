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
        {balance && (
          <div className="mt-4 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <div className="text-3xl font-bold text-primary">GHS {balance}</div>
              <p className="text-xs text-muted-foreground">SMS Credits Available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
