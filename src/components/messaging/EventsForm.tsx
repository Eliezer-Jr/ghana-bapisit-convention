import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Calendar, Cake, Save } from "lucide-react";
import { useEventMessages } from "@/hooks/useEventMessages";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";

const DEFAULT_MESSAGES = {
  birthday: "Happy Birthday [[name]]! May God bless you abundantly on your special day and grant you many more years of fruitful ministry. 🎂🎉",
  anniversary: "Congratulations [[name]] on your ministry anniversary! We celebrate God's faithfulness in your life and service. 🎊"
};

export const EventsForm = () => {
  const { eventType, setEventType, upcomingEvents, loading, sendEventMessages } = useEventMessages();
  const [message, setMessage] = useState("");
  const [autoSend, setAutoSend] = useState(false);

  useEffect(() => {
    const savedMessage = localStorage.getItem(`default_${eventType}_message`);
    setMessage(savedMessage || DEFAULT_MESSAGES[eventType]);
  }, [eventType]);

  const handleSaveDefault = () => {
    localStorage.setItem(`default_${eventType}_message`, message);
    toast.success("Default message saved");
  };

  const handleSend = () => {
    sendEventMessages(message);
  };

  return (
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
          <div className="flex items-center justify-between">
            <Label htmlFor="event-message">Default Message Template</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDefault}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Default
            </Button>
          </div>
          <Textarea
            id="event-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Use [[name]] for personalization. E.g., Happy Birthday [[name]]! May God bless you abundantly."
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Tip: Use [[name]] to personalize each message. Edit and save to customize your default template.
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
          onClick={handleSend} 
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
  );
};
