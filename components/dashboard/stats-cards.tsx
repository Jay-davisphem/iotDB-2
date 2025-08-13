"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Activity, AlertTriangle, Wifi } from "lucide-react"

interface StatsCardsProps {
  totalDevices: number
  activeDevices: number
  totalAlerts: number
  dataPoints: number
}

export default function StatsCards({ totalDevices, activeDevices, totalAlerts, dataPoints }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Devices",
      value: totalDevices,
      icon: Database,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Devices",
      value: activeDevices,
      icon: Wifi,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Open Alerts",
      value: totalAlerts,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Data Points (24h)",
      value: dataPoints.toLocaleString(),
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
