import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalanceCard } from "@/components/messaging/BalanceCard";
import { GeneralSMSForm } from "@/components/messaging/GeneralSMSForm";
import { PersonalizedSMSForm } from "@/components/messaging/PersonalizedSMSForm";
import { EventsForm } from "@/components/messaging/EventsForm";
import { HistoryForm } from "@/components/messaging/HistoryForm";

const MessagingTab = () => {
  return (
    <div className="space-y-4">
      <BalanceCard />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General SMS</TabsTrigger>
          <TabsTrigger value="personalized">Personalized</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralSMSForm />
        </TabsContent>

        <TabsContent value="personalized" className="space-y-4">
          <PersonalizedSMSForm />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <EventsForm />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagingTab;
