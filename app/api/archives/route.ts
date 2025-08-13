import { type NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase
      .from("data_archives")
      .select(`
        *,
        devices (
          id,
          name,
          device_id
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ archives: data })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const body = await request.json()
    const { device_id, archive_date } = body

    if (!device_id || !archive_date) {
      return NextResponse.json({ error: "device_id and archive_date are required" }, { status: 400 })
    }

    // Get data to archive
    const startDate = new Date(archive_date)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)

    const { data: iotData, error: dataError } = await supabase
      .from("iot_data")
      .select("*")
      .eq("device_id", device_id)
      .gte("time", startDate.toISOString())
      .lt("time", endDate.toISOString())

    if (dataError) {
      return NextResponse.json({ error: dataError.message }, { status: 500 })
    }

    if (!iotData || iotData.length === 0) {
      return NextResponse.json({ error: "No data found for the specified date" }, { status: 404 })
    }

    // Create CSV content
    const headers = ["timestamp", "data", "metadata"]
    let csvContent = headers.join(",") + "\n"

    iotData.forEach((item) => {
      const row = [item.time, JSON.stringify(item.data), JSON.stringify(item.metadata)]
      csvContent += row.join(",") + "\n"
    })

    // Calculate file size
    const fileSize = Buffer.byteLength(csvContent, "utf8")

    // Create archive record
    const { data: archive, error: archiveError } = await supabase
      .from("data_archives")
      .insert({
        device_id,
        archive_date: startDate.toISOString().split("T")[0],
        file_path: `/archives/${device_id}/${archive_date}.csv`,
        file_size: fileSize,
        record_count: iotData.length,
        compression_type: "none",
        created_by: session.user.id,
      })
      .select()
      .single()

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 })
    }

    return NextResponse.json({ archive }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
