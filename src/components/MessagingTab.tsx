import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Send, History, DollarSign, Plus, Trash2 } from "lucide-react";

interface Destination {
  destination: string;
  msgid?: string;
  message?: string;
}

const MessagingTab = () => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  
  // General SMS
  const [generalSenderId, setGeneralSenderId] = useState("");
  const [generalMessage, setGeneralMessage] = useState("");
  const [generalDestinations, setGeneralDestinations] = useState<Destination[]>([{ destination: "" }]);
  
  // Personalized SMS
  const [personalizedSenderId, setPersonalizedSenderId] = useState("");
  const [personalizedDestinations, setPersonalizedDestinations] = useState<Destination[]>([
    { destination: "", message: "" }
  ]);
  
  // History
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyFilters, setHistoryFilters] = useState({
    datefrom: "",
    dateto: "",
    senderid: "",
    status: "",
  });

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

  const sendGeneralSMS = async () => {
    try {
      setLoading(true);
      
      const validDestinations = generalDestinations.filter(d => d.destination.trim());
      if (validDestinations.length === 0) {
        toast.error("Please add at least one phone number");
        return;
      }
      
      if (!generalMessage.trim()) {
        toast.error("Please enter a message");
        return;
      }
      
      if (!generalSenderId.trim()) {
        toast.error("Please enter a sender ID");
        return;
      }

      const { data, error } = await supabase.functions.invoke('frogapi-send-general', {
        body: {
          senderid: generalSenderId,
          destinations: validDestinations,
          message: generalMessage,
          smstype: "text"
        }
      });
      
      if (error) throw error;
      toast.success("SMS sent successfully");
      console.log(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to send SMS");
    } finally {
      setLoading(false);
    }
  };

  const sendPersonalizedSMS = async () => {
    try {
      setLoading(true);
      
      const validDestinations = personalizedDestinations.filter(
        d => d.destination.trim() && d.message?.trim()
      );
      
      if (validDestinations.length === 0) {
        toast.error("Please add at least one recipient with message");
        return;
      }
      
      if (!personalizedSenderId.trim()) {
        toast.error("Please enter a sender ID");
        return;
      }

      const { data, error } = await supabase.functions.invoke('frogapi-send-personalized', {
        body: {
          senderid: personalizedSenderId,
          destinations: validDestinations.map(d => ({
            ...d,
            smstype: "text"
          }))
        }
      });
      
      if (error) throw error;
      toast.success("Personalized SMS sent successfully");
      console.log(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to send personalized SMS");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      if (!historyFilters.datefrom || !historyFilters.dateto) {
        toast.error("Please select date range");
        return;
      }

      const { data, error } = await supabase.functions.invoke('frogapi-history', {
        body: {
          service: "SMS",
          servicetype: "TEXT",
          ...historyFilters
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Account Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchBalance} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Check Balance
          </Button>
          {balance && (
            <div className="mt-4 p-4 bg-secondary rounded-lg">
              <pre className="text-sm">{JSON.stringify(balance, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General SMS</TabsTrigger>
          <TabsTrigger value="personalized">Personalized</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send General SMS</CardTitle>
              <CardDescription>Send the same message to multiple recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="general-sender">Sender ID</Label>
                <Input
                  id="general-sender"
                  value={generalSenderId}
                  onChange={(e) => setGeneralSenderId(e.target.value)}
                  placeholder="e.g., Church Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Numbers</Label>
                {generalDestinations.map((dest, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="e.g., 0244123456"
                      value={dest.destination}
                      onChange={(e) => {
                        const newDests = [...generalDestinations];
                        newDests[idx].destination = e.target.value;
                        setGeneralDestinations(newDests);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setGeneralDestinations(generalDestinations.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGeneralDestinations([...generalDestinations, { destination: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Number
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="general-message">Message</Label>
                <Textarea
                  id="general-message"
                  value={generalMessage}
                  onChange={(e) => setGeneralMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                />
              </div>

              <Button onClick={sendGeneralSMS} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalized" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Personalized SMS</CardTitle>
              <CardDescription>Send different messages to different recipients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personalized-sender">Sender ID</Label>
                <Input
                  id="personalized-sender"
                  value={personalizedSenderId}
                  onChange={(e) => setPersonalizedSenderId(e.target.value)}
                  placeholder="e.g., Church Name"
                />
              </div>

              <div className="space-y-2">
                <Label>Recipients & Messages</Label>
                {personalizedDestinations.map((dest, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Phone number (e.g., 0244123456)"
                        value={dest.destination}
                        onChange={(e) => {
                          const newDests = [...personalizedDestinations];
                          newDests[idx].destination = e.target.value;
                          setPersonalizedDestinations(newDests);
                        }}
                      />
                      <Textarea
                        placeholder="Personalized message for this recipient..."
                        value={dest.message || ""}
                        onChange={(e) => {
                          const newDests = [...personalizedDestinations];
                          newDests[idx].message = e.target.value;
                          setPersonalizedDestinations(newDests);
                        }}
                        rows={2}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPersonalizedDestinations(personalizedDestinations.filter((_, i) => i !== idx))}
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
                  onClick={() => setPersonalizedDestinations([...personalizedDestinations, { destination: "", message: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Recipient
                </Button>
              </div>

              <Button onClick={sendPersonalizedSMS} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Personalized Messages
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
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
                    value={historyFilters.datefrom}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, datefrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">Date To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={historyFilters.dateto}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, dateto: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history-sender">Sender ID (Optional)</Label>
                  <Input
                    id="history-sender"
                    value={historyFilters.senderid}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, senderid: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history-status">Status (Optional)</Label>
                  <Input
                    id="history-status"
                    value={historyFilters.status}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
                    placeholder="e.g., DELIVRD"
                  />
                </div>
              </div>

              <Button onClick={fetchHistory} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Fetch History
              </Button>

              {historyData && (
                <div className="mt-4 p-4 bg-secondary rounded-lg max-h-96 overflow-auto">
                  <pre className="text-sm">{JSON.stringify(historyData, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagingTab;
