import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DeviceTable from "@/components/devices/device-table"
import DeviceTypeManager from "@/components/devices/device-type-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getDevices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("devices")
    .select(`
      *,
      device_types (
        id,
        name,
        description,
        schema_definition
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching devices:", error)
    return []
  }

  return data || []
}

async function getDeviceTypes() {
  const supabase = createClient()
  const { data, error } = await supabase.from("device_types").select("*").order("name")

  if (error) {
    console.error("Error fetching device types:", error)
    return []
  }

  return data || []
}

export default async function DevicesPage() {
  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [devices, deviceTypes] = await Promise.all([getDevices(), getDeviceTypes()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
        <p className="text-gray-600">Manage your IoT devices and device types</p>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="types">Device Types</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <DeviceTable devices={devices} deviceTypes={deviceTypes} onRefresh={() => window.location.reload()} />
        </TabsContent>

        <TabsContent value="types">
          <DeviceTypeManager deviceTypes={deviceTypes} onRefresh={() => window.location.reload()} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
