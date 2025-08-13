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
    const startTime = searchParams.get("start_time")
    const endTime = searchParams.get("end_time")
    const limit = Number.parseInt(searchParams.get("limit") || "1000")
    const format = searchParams.get("format") || "csv"

    if (!deviceId) {
      return NextResponse.json({ error: "device_id is required" }, { status: 400 })
    }

    // Get device UUID from device_id
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, name")
      .eq("device_id", deviceId)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    let query = supabase
      .from("iot_data")
      .select("time, data, metadata")
      .eq("device_id", device.id)
      .order("time", { ascending: false })
      .limit(limit)

    if (startTime) {
      query = query.gte("time", startTime)
    }

    if (endTime) {
      query = query.lte("time", endTime)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (format === "csv") {
      // Convert to CSV
      if (!data || data.length === 0) {
        return new NextResponse("No data found", { status: 404 })
      }

      // Get all unique field names
      const fields = new Set<string>()
      data.forEach((item) => {
        if (item.data && typeof item.data === "object") {
          Object.keys(item.data).forEach((key) => fields.add(key))
        }
      })

      const fieldNames = Array.from(fields).sort()
      const headers = ["timestamp", ...fieldNames]

      let csv = headers.join(",") + "\n"

      data.forEach((item) => {
        const row = [
          item.time,
          ...fieldNames.map((field) => {
            const value = item.data?.[field]
            if (value === null || value === undefined) return ""
            if (typeof value === "string" && value.includes(",")) return `"${value}"`
            return value
          }),
        ]
        csv += row.join(",") + "\n"
      })

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="iot-data-${deviceId}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
