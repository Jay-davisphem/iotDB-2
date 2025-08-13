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
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const aggregation = searchParams.get("aggregation") // 'avg', 'sum', 'count', 'min', 'max'
    const interval = searchParams.get("interval") // '1m', '5m', '1h', '1d'

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

    // If aggregation is requested, process the data
    if (aggregation && interval && data.length > 0) {
      // This is a simplified aggregation - in production, you'd use TimescaleDB functions
      const aggregatedData = processAggregation(data, aggregation, interval)
      return NextResponse.json({ data: aggregatedData, count: aggregatedData.length })
    }

    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

function processAggregation(data: any[], aggregation: string, interval: string) {
  // Simplified aggregation logic - group by time intervals
  const intervalMs = parseInterval(interval)
  const groups: { [key: string]: any[] } = {}

  data.forEach((item) => {
    const timestamp = new Date(item.time).getTime()
    const groupKey = Math.floor(timestamp / intervalMs) * intervalMs
    const groupKeyStr = new Date(groupKey).toISOString()

    if (!groups[groupKeyStr]) {
      groups[groupKeyStr] = []
    }
    groups[groupKeyStr].push(item)
  })

  return Object.entries(groups).map(([time, items]) => ({
    time,
    data: aggregateItems(items, aggregation),
    count: items.length,
  }))
}

function parseInterval(interval: string): number {
  const unit = interval.slice(-1)
  const value = Number.parseInt(interval.slice(0, -1))

  switch (unit) {
    case "m":
      return value * 60 * 1000
    case "h":
      return value * 60 * 60 * 1000
    case "d":
      return value * 24 * 60 * 60 * 1000
    default:
      return 60 * 1000 // Default to 1 minute
  }
}

function aggregateItems(items: any[], aggregation: string) {
  if (items.length === 0) return {}

  const result: any = {}
  const firstItem = items[0].data

  Object.keys(firstItem).forEach((key) => {
    const values = items.map((item) => item.data[key]).filter((val) => typeof val === "number")

    if (values.length === 0) {
      result[key] = firstItem[key]
      return
    }

    switch (aggregation) {
      case "avg":
        result[key] = values.reduce((sum, val) => sum + val, 0) / values.length
        break
      case "sum":
        result[key] = values.reduce((sum, val) => sum + val, 0)
        break
      case "min":
        result[key] = Math.min(...values)
        break
      case "max":
        result[key] = Math.max(...values)
        break
      case "count":
        result[key] = values.length
        break
      default:
        result[key] = values[values.length - 1] // Latest value
    }
  })

  return result
}
