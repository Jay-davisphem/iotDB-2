import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import StatsCards from "@/components/dashboard/stats-cards"
import DeviceStatusChart from "@/components/dashboard/device-status-chart"
import RealTimeChart from "@/components/dashboard/real-time-chart"
import RecentAlerts from "@/components/dashboard/recent-alerts"

export default async function DashboardPage() {
  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch dashboard data
  const [devicesResult, alertsResult, dataPointsResult] = await Promise.all([
    supabase.from("devices").select("status"),
    supabase.from("alerts").select("id").eq("status", "open"),
    supabase
      .from("iot_data")
      .select("id")
      .gte("time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ])

  const devices = devicesResult.data || []
  const alerts = alertsResult.data || []
  const dataPoints = dataPointsResult.data || []

  // Calculate stats
  const totalDevices = devices.length
  const activeDevices = devices.filter((d) => d.status === "active").length
  const totalAlerts = alerts.length
  const totalDataPoints = dataPoints.length

  // Device status distribution
  const statusCounts = devices.reduce(
    (acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const deviceStatusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    color:
      {
        active: "#10b981",
        inactive: "#6b7280",
        maintenance: "#f59e0b",
        error: "#ef4444",
      }[status] || "#6b7280",
  }))

  // Get sample devices for charts
  const sampleDevices = await supabase.from("devices").select("device_id, name").eq("status", "active").limit(2)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Monitor your IoT infrastructure and device performance</p>
      </div>

      {/* Stats Cards */}
      <StatsCards
        totalDevices={totalDevices}
        activeDevices={activeDevices}
        totalAlerts={totalAlerts}
        dataPoints={totalDataPoints}
      />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DeviceStatusChart data={deviceStatusData} />
        <RecentAlerts />
      </div>

      {/* Real-time Charts */}
      {sampleDevices.data && sampleDevices.data.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {sampleDevices.data.slice(0, 2).map((device, index) => (
            <RealTimeChart
              key={device.device_id}
              deviceId={device.device_id}
              title={`${device.name} - Live Data`}
              metrics={index === 0 ? ["temperature", "humidity"] : ["pm25", "co2"]}
              colors={index === 0 ? ["#3b82f6", "#10b981"] : ["#f59e0b", "#ef4444"]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
