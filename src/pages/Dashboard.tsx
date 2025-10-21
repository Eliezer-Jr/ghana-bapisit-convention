import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, UserX, Clock, TrendingUp, Calendar } from "lucide-react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";

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

  const activePercentage = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;
  const recentPercentage = stats.total > 0 ? (stats.recentlyAdded / stats.total) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ghana Baptist Convention</h1>
            <p className="text-muted-foreground mt-1">
              Minister Management Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Last updated: Today
            </Badge>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Ministers - Large Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Ministers
                </CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-2">
                {loading ? "..." : stats.total}
              </div>
              <CardDescription className="text-xs">
                All registered ministers in the system
              </CardDescription>
            </CardContent>
          </Card>

          {/* Active Ministers - Highlighted Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-primary">
                  Active Ministers
                </CardTitle>
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary mb-3">
                {loading ? "..." : stats.active}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Active rate</span>
                  <span className="font-medium text-primary">{activePercentage.toFixed(0)}%</span>
                </div>
                <Progress value={activePercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recently Added */}
          <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recent Additions
                </CardTitle>
                <Clock className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-3">
                {loading ? "..." : stats.recentlyAdded}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Last 30 days</span>
                  <span className="font-medium text-accent">{recentPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={recentPercentage} className="h-2 [&>div]:bg-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Inactive/Retired */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Inactive/Retired
                </CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? "..." : stats.inactive}
              </div>
              <CardDescription className="text-xs mt-1">
                Ministers not currently active
              </CardDescription>
            </CardContent>
          </Card>

          {/* Growth Trend */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Growth Trend
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {loading ? "..." : `+${stats.recentlyAdded}`}
              </div>
              <CardDescription className="text-xs mt-1">
                New ministers this month
              </CardDescription>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-foreground font-medium">All Systems Operational</span>
              </div>
              <CardDescription className="text-xs mt-2">
                Database synced and up to date
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Info Card */}
        <Card className="shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to Ghana Baptist Convention System</CardTitle>
            <CardDescription>
              Manage and track minister data efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Key Features:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    <span>View and manage all minister records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Add new ministers with detailed information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                    <span>Track active, inactive, and retired status</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-foreground">Quick Actions:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5" />
                    <span>Search and filter ministers by various criteria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5" />
                    <span>Send bulk SMS messages to ministers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5" />
                    <span>Track birthdays and anniversaries</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
