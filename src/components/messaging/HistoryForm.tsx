import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, History } from "lucide-react";
import { useMessageHistory } from "@/hooks/useMessageHistory";

export const HistoryForm = () => {
  const { historyData, filters, setFilters, loading, fetchHistory } = useMessageHistory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          SMS History
        </CardTitle>
        <CardDescription>View your SMS sending history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-from">Date From</Label>
            <Input
              id="date-from"
              type="date"
              value={filters.datefrom}
              onChange={(e) => setFilters({ ...filters, datefrom: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to">Date To</Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateto}
              onChange={(e) => setFilters({ ...filters, dateto: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-sender">Sender ID (Optional)</Label>
            <Input
              id="history-sender"
              value={filters.senderid}
              onChange={(e) => setFilters({ ...filters, senderid: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-status">Status (Optional)</Label>
            <Input
              id="history-status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              placeholder="e.g., DELIVRD"
            />
          </div>
        </div>

        <Button onClick={fetchHistory} disabled={loading} className="w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Fetch History
        </Button>

        {historyData && (
          <div className="mt-4 p-4 bg-secondary rounded-lg max-h-96 overflow-auto">
            <pre className="text-sm">{JSON.stringify(historyData, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
