import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AlertTable from "@/components/alerts/alert-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ArchiveManager from "@/components/archiving/archive-manager"

async function getAlerts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("alerts")
    .select(`
      *,
      devices (
        id,
        name,
        device_id,
        location
      )
    `)
    .order("triggered_at", { ascending: false })

  if (error) {
    console.error("Error fetching alerts:", error)
    return []
  }

  return data || []
}

async function getDevices() {
  const supabase = createClient()
  const { data, error } = await supabase.from("devices").select("*").order("name")

  if (error) {
    console.error("Error fetching devices:", error)
    return []
  }

  return data || []
}

export default async function AlertsPage() {
  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [alerts, devices] = await Promise.all([getAlerts(), getDevices()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Archiving</h1>
        <p className="text-gray-600">Manage alert rules and archive historical data</p>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alert Management</TabsTrigger>
          <TabsTrigger value="archives">Data Archiving</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <AlertTable alerts={alerts} devices={devices} onRefresh={() => window.location.reload()} />
        </TabsContent>

        <TabsContent value="archives">
          <ArchiveManager devices={devices} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
