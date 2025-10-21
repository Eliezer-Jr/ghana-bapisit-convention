import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, History } from "lucide-react";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
          <div className="mt-4 border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sender ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(historyData) && historyData.length > 0 ? (
                    historyData.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">
                          {item.timestamp || item.date || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.destination || item.recipient || item.phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {item.message || item.text || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'DELIVRD' || item.status === 'delivered' 
                              ? 'bg-green-100 text-green-800' 
                              : item.status === 'FAILED' || item.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status || "pending"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.senderid || item.sender || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No history records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
