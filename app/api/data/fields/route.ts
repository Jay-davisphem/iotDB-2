import { type NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("device_id")

    if (!deviceId) {
      return NextResponse.json({ error: "device_id is required" }, { status: 400 })
    }

    // Get device UUID from device_id
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id")
      .eq("device_id", deviceId)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Get recent data to extract field names
    const { data, error } = await supabase
      .from("iot_data")
      .select("data")
      .eq("device_id", device.id)
      .order("time", { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Extract unique field names from the data
    const fields = new Set<string>()
    data?.forEach((item) => {
      if (item.data && typeof item.data === "object") {
        Object.keys(item.data).forEach((key) => fields.add(key))
      }
    })

    return NextResponse.json({ fields: Array.from(fields).sort() })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
