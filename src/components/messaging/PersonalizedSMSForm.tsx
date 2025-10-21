import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Plus, Trash2 } from "lucide-react";
import { useSMSMessaging } from "@/hooks/useSMSMessaging";

interface Destination {
  destination: string;
  message?: string;
}

export const PersonalizedSMSForm = () => {
  const { loading, sendPersonalizedSMS } = useSMSMessaging();
  const [destinations, setDestinations] = useState<Destination[]>([
    { destination: "", message: "" }
  ]);

  const handleSend = () => {
    sendPersonalizedSMS(destinations);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Personalized SMS</CardTitle>
        <CardDescription>Send different messages to different recipients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Recipients & Messages</Label>
          {destinations.map((dest, idx) => (
            <Card key={idx} className="p-4">
              <div className="space-y-2">
                <Input
                  placeholder="Phone number (e.g., 0244123456)"
                  value={dest.destination}
                  onChange={(e) => {
                    const newDests = [...destinations];
                    newDests[idx].destination = e.target.value;
                    setDestinations(newDests);
                  }}
                />
                <Textarea
                  placeholder="Personalized message for this recipient..."
                  value={dest.message || ""}
                  onChange={(e) => {
                    const newDests = [...destinations];
                    newDests[idx].message = e.target.value;
                    setDestinations(newDests);
                  }}
                  rows={2}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDestinations(destinations.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </div>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDestinations([...destinations, { destination: "", message: "" }])}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Recipient
          </Button>
        </div>

        <Button onClick={handleSend} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Send Personalized Messages
        </Button>
      </CardContent>
    </Card>
  );
};
