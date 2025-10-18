import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import Layout from "@/components/Layout";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    inactive: 0,
    recentlyAdded: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from("ministers").select("*");

      if (error) throw error;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      setStats({
        total: data.length,
        active: data.filter((m) => m.status === "active").length,
        inactive: data.filter((m) => m.status === "inactive" || m.status === "retired").length,
        recentlyAdded: data.filter(
          (m) => new Date(m.created_at) >= thirtyDaysAgo
        ).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Ministers",
      value: stats.total,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Ministers",
      value: stats.active,
      icon: UserCheck,
      color: "text-success",
    },
    {
      title: "Inactive/Retired",
      value: stats.inactive,
      icon: UserX,
      color: "text-muted-foreground",
    },
    {
      title: "Added (30 days)",
      value: stats.recentlyAdded,
      icon: Clock,
      color: "text-accent",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your church minister data
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {loading ? "..." : stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Welcome to Ghana Bapisit Convention System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-muted-foreground">
            <p>
              This system helps you manage and track minister data for your church organization.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View and manage all minister records</li>
              <li>Add new ministers with detailed information</li>
              <li>Track active, inactive, and retired status</li>
              <li>Search and filter ministers by various criteria</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
