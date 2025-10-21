import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Loader2 } from "lucide-react";
import { useBalance } from "@/hooks/useBalance";

export const BalanceCard = () => {
  const { balance, loading, fetchBalance } = useBalance();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Account Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchBalance} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Check Balance
        </Button>
        {balance && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <pre className="text-sm">{JSON.stringify(balance, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
