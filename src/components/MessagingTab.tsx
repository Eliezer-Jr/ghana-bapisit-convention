import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Send, History, DollarSign, Plus, Trash2, Upload, Users, Calendar, Cake } from "lucide-react";
import * as XLSX from "xlsx";
import { format, isSameDay, addDays } from "date-fns";

interface Destination {
  destination: string;
  msgid?: string;
  message?: string;
}

interface ExcelContact {
  name: string;
  phone_number: string;
}

interface EventMinister {
  id: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  date_of_birth?: string;
  date_joined: string;
  event_date: Date;
  event_type: 'birthday' | 'anniversary';
}

const MessagingTab = () => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  
  // General SMS
  const [generalSenderId, setGeneralSenderId] = useState("");
  const [generalMessage, setGeneralMessage] = useState("");
  const [generalDestinations, setGeneralDestinations] = useState<Destination[]>([{ destination: "" }]);
  const [useAllMinisters, setUseAllMinisters] = useState(false);
  const [excelContacts, setExcelContacts] = useState<ExcelContact[]>([]);
  
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

  // Events (Birthday/Anniversary)
  const [eventType, setEventType] = useState<'birthday' | 'anniversary'>('birthday');
  const [upcomingEvents, setUpcomingEvents] = useState<EventMinister[]>([]);
  const [eventMessage, setEventMessage] = useState("");
  const [eventSenderId, setEventSenderId] = useState("");
  const [autoSend, setAutoSend] = useState(false);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [eventType]);

  const fetchUpcomingEvents = async () => {
    try {
      const { data: ministers, error } = await supabase
        .from('ministers')
        .select('id, full_name, phone, whatsapp, date_of_birth, date_joined');
      
      if (error) throw error;

      const today = new Date();
      const nextWeek = addDays(today, 7);
      const events: EventMinister[] = [];

      ministers?.forEach((minister) => {
        if (eventType === 'birthday' && minister.date_of_birth) {
          const birthDate = new Date(minister.date_of_birth);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          
          if (thisYearBirthday >= today && thisYearBirthday <= nextWeek) {
            events.push({
              ...minister,
              event_date: thisYearBirthday,
              event_type: 'birthday'
            });
          }
        } else if (eventType === 'anniversary' && minister.date_joined) {
          const joinDate = new Date(minister.date_joined);
          const thisYearAnniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
          
          if (thisYearAnniversary >= today && thisYearAnniversary <= nextWeek) {
            events.push({
              ...minister,
              event_date: thisYearAnniversary,
              event_type: 'anniversary'
            });
          }
        }
      });

      events.sort((a, b) => a.event_date.getTime() - b.event_date.getTime());
      setUpcomingEvents(events);
    } catch (error: any) {
      toast.error("Failed to fetch events: " + error.message);
    }
  };

  const sendEventMessages = async () => {
    try {
      setLoading(true);
      
      if (!eventMessage.trim()) {
        toast.error("Please enter a message");
        return;
      }
      
      if (!eventSenderId.trim()) {
        toast.error("Please enter a sender ID");
        return;
      }

      const destinations = upcomingEvents.flatMap(minister => {
        const phones = [];
        if (minister.phone) {
          phones.push({
            destination: minister.phone,
            message: eventMessage.replace(/\[\[name\]\]/gi, minister.full_name)
          });
        }
        if (minister.whatsapp && minister.whatsapp !== minister.phone) {
          phones.push({
            destination: minister.whatsapp,
            message: eventMessage.replace(/\[\[name\]\]/gi, minister.full_name)
          });
        }
        return phones;
      });

      if (destinations.length === 0) {
        toast.error("No recipients found");
        return;
      }

      const { data, error } = await supabase.functions.invoke('frogapi-send-personalized', {
        body: {
          senderid: eventSenderId,
          destinations: destinations.map(d => ({
            ...d,
            smstype: "text"
          }))
        }
      });
      
      if (error) throw error;
      toast.success(`${eventType === 'birthday' ? 'Birthday' : 'Anniversary'} messages sent successfully to ${upcomingEvents.length} ministers`);
      console.log(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to send event messages");
    } finally {
      setLoading(false);
    }
  };

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

  const fetchAllMinisters = async () => {
    try {
      const { data, error } = await supabase
        .from('ministers')
        .select('phone, whatsapp, full_name');
      
      if (error) throw error;
      
      const phoneNumbers: Destination[] = [];
      data?.forEach(minister => {
        if (minister.phone) phoneNumbers.push({ destination: minister.phone });
        if (minister.whatsapp && minister.whatsapp !== minister.phone) {
          phoneNumbers.push({ destination: minister.whatsapp });
        }
      });
      
      return phoneNumbers;
    } catch (error: any) {
      toast.error("Failed to fetch ministers: " + error.message);
      return [];
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const contacts: ExcelContact[] = json.map(row => ({
          name: row.name || row.Name || row.NAME || '',
          phone_number: String(row.phone_number || row.phone || row.Phone || row.PHONE || '')
        })).filter(contact => contact.phone_number.trim());
        
        setExcelContacts(contacts);
        toast.success(`Loaded ${contacts.length} contacts from Excel`);
      } catch (error: any) {
        toast.error("Failed to parse Excel file: " + error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const replacePlaceholders = (message: string, contact: ExcelContact): string => {
    return message
      .replace(/\[\[name\]\]/gi, contact.name)
      .replace(/\[\[phone_number\]\]/gi, contact.phone_number);
  };

  const sendGeneralSMS = async () => {
    try {
      setLoading(true);
      
      let destinations: Destination[] = [];
      
      if (useAllMinisters) {
        destinations = await fetchAllMinisters();
      } else if (excelContacts.length > 0) {
        // Use Excel contacts with placeholder replacement
        destinations = excelContacts.map(contact => ({
          destination: contact.phone_number,
          message: replacePlaceholders(generalMessage, contact)
        }));
      } else {
        destinations = generalDestinations.filter(d => d.destination.trim());
      }
      
      if (destinations.length === 0) {
        toast.error("Please add at least one phone number or select a source");
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

      // If using Excel with placeholders, use personalized endpoint
      if (excelContacts.length > 0 && (generalMessage.includes('[[name]]') || generalMessage.includes('[[phone_number]]'))) {
        const { data, error } = await supabase.functions.invoke('frogapi-send-personalized', {
          body: {
            senderid: generalSenderId,
            destinations: destinations.map(d => ({
              destination: d.destination,
              message: d.message || generalMessage,
              smstype: "text"
            }))
          }
        });
        
        if (error) throw error;
        toast.success("Personalized SMS sent successfully");
        console.log(data);
      } else {
        // Regular general SMS
        const { data, error } = await supabase.functions.invoke('frogapi-send-general', {
          body: {
            senderid: generalSenderId,
            destinations: destinations,
            message: generalMessage,
            smstype: "text"
          }
        });
        
        if (error) throw error;
        toast.success("SMS sent successfully");
        console.log(data);
      }
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General SMS</TabsTrigger>
          <TabsTrigger value="personalized">Personalized</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
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

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use-all-ministers"
                    checked={useAllMinisters}
                    onChange={(e) => {
                      setUseAllMinisters(e.target.checked);
                      if (e.target.checked) setExcelContacts([]);
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="use-all-ministers" className="cursor-pointer">
                    <Users className="h-4 w-4 inline mr-1" />
                    Send to all ministers in database
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excel-upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Excel with Names & Phone Numbers
                  </Label>
                  <Input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      handleExcelUpload(e);
                      setUseAllMinisters(false);
                    }}
                    disabled={useAllMinisters}
                  />
                  {excelContacts.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {excelContacts.length} contacts loaded. Use [[name]] and [[phone_number]] as placeholders in your message.
                    </p>
                  )}
                </div>

                {!useAllMinisters && excelContacts.length === 0 && (
                  <div className="space-y-2">
                    <Label>Phone Numbers (Manual Entry)</Label>
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
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="general-message">Message</Label>
                <Textarea
                  id="general-message"
                  value={generalMessage}
                  onChange={(e) => setGeneralMessage(e.target.value)}
                  placeholder={excelContacts.length > 0 ? "Use [[name]] and [[phone_number]] for personalization..." : "Enter your message here..."}
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

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Messages (Birthdays & Anniversaries)
              </CardTitle>
              <CardDescription>
                Automatically send messages to ministers on their special days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select value={eventType} onValueChange={(value: 'birthday' | 'anniversary') => setEventType(value)}>
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">
                      <div className="flex items-center gap-2">
                        <Cake className="h-4 w-4" />
                        Birthdays
                      </div>
                    </SelectItem>
                    <SelectItem value="anniversary">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Joining Anniversaries
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Upcoming {eventType === 'birthday' ? 'Birthdays' : 'Anniversaries'} (Next 7 Days)</Label>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-lg">
                    No upcoming {eventType === 'birthday' ? 'birthdays' : 'anniversaries'} in the next 7 days.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map((minister) => (
                      <div key={minister.id} className="p-3 bg-secondary rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">{minister.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(minister.event_date, 'MMMM d, yyyy')}
                            {isSameDay(minister.event_date, new Date()) && ' (Today)'}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {minister.phone && <span className="block">{minister.phone}</span>}
                          {minister.whatsapp && minister.whatsapp !== minister.phone && (
                            <span className="block">WhatsApp: {minister.whatsapp}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-sender">Sender ID</Label>
                <Input
                  id="event-sender"
                  value={eventSenderId}
                  onChange={(e) => setEventSenderId(e.target.value)}
                  placeholder="e.g., Church Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-message">Message Template</Label>
                <Textarea
                  id="event-message"
                  value={eventMessage}
                  onChange={(e) => setEventMessage(e.target.value)}
                  placeholder="Use [[name]] for personalization. E.g., Happy Birthday [[name]]! May God bless you abundantly."
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Tip: Use [[name]] to personalize each message
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-send"
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="auto-send" className="cursor-pointer">
                  Enable auto-send (messages will be sent automatically on event day)
                </Label>
              </div>

              <Button 
                onClick={sendEventMessages} 
                disabled={loading || upcomingEvents.length === 0} 
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send {eventType === 'birthday' ? 'Birthday' : 'Anniversary'} Messages Now
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
