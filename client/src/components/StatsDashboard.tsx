import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Users, Clock, MapPin, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  index?: number;
}

function StatCard({ title, value, subtitle, icon, trend, index = 0 }: StatCardProps) {
  const trendColors = {
    up: "text-[#00C851]",
    down: "text-[#FF3547]",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="h-4 w-4 text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className={`text-xs ${trend ? trendColors[trend] : "text-muted-foreground"} mt-1`}>
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StatsDashboard() {
  // Fetch statistics
  const { data: dismissalStats, isLoading: loadingDismissals } = useQuery({
    queryKey: ["/api/stats/dismissals"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: gateStats, isLoading: loadingGates } = useQuery({
    queryKey: ["/api/stats/gates"],
    refetchInterval: 30000,
  });

  const { data: hourlyStats, isLoading: loadingHourly } = useQuery({
    queryKey: ["/api/stats/hourly"],
    refetchInterval: 30000,
  });

  // Colors for charts
  const COLORS = ["#4F46E5", "#00C851", "#FF3547", "#FFA500", "#9333EA", "#06B6D4"];

  if (loadingDismissals || loadingGates || loadingHourly) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Statistics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Loading real-time metrics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Filter hourly data to show only relevant hours (e.g., 7 AM to 6 PM)
  const filteredHourlyData = hourlyStats?.filter(
    (stat: any) => stat.hour >= 7 && stat.hour <= 18 && stat.count > 0
  ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time dismissal metrics and analytics</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Dismissals"
          value={dismissalStats?.totalDismissals || 0}
          subtitle="Today"
          icon={<Users className="h-4 w-4" />}
          index={0}
        />
        <StatCard
          title="Completed"
          value={dismissalStats?.completedDismissals || 0}
          subtitle={`${dismissalStats?.completionRate || 0}% completion rate`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="up"
          index={1}
        />
        <StatCard
          title="Pending"
          value={dismissalStats?.pendingDismissals || 0}
          subtitle="Awaiting pickup"
          icon={<Activity className="h-4 w-4" />}
          trend={dismissalStats?.pendingDismissals > 5 ? "down" : "neutral"}
          index={2}
        />
        <StatCard
          title="Avg Pickup Time"
          value={`${dismissalStats?.averagePickupTimeMinutes || 0}m`}
          subtitle="From call to completion"
          icon={<Clock className="h-4 w-4" />}
          trend={dismissalStats?.averagePickupTimeMinutes < 5 ? "up" : "neutral"}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Dismissals by Hour</CardTitle>
              <CardDescription>Today's dismissal activity throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredHourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              {filteredHourlyData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No dismissal data available for today
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gate Usage Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Gate Usage</CardTitle>
              <CardDescription>Distribution of pickups by gate location</CardDescription>
            </CardHeader>
            <CardContent>
              {gateStats && gateStats.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={gateStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {gateStats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {gateStats.map((stat: any, index: number) => (
                      <div key={stat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">{stat.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No gate usage data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Busiest Gate Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gateStats && gateStats.length > 0 ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{gateStats[0].name}</p>
                  <p className="text-sm text-muted-foreground">
                    {gateStats[0].count} dismissals (
                    {Math.round((gateStats[0].count / (dismissalStats?.totalDismissals || 1)) * 100)}
                    % of total)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Peak usage</p>
                  <p className="text-lg font-semibold text-primary">
                    {gateStats[0].count} pickups
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No gate data available yet</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
