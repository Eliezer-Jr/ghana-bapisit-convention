import Layout from "@/components/Layout";
import MessagingTab from "@/components/MessagingTab";

const Messages = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Messaging</h1>
          <p className="text-muted-foreground mt-2">
            Send SMS messages to ministers and manage your messaging history
          </p>
        </div>
        <MessagingTab />
      </div>
    </Layout>
  );
};

export default Messages;
