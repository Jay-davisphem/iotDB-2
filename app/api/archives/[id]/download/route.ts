import { type NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(request)

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get archive info
    const { data: archive, error: archiveError } = await supabase
      .from("data_archives")
      .select("*")
      .eq("id", params.id)
      .single()

    if (archiveError || !archive) {
      return NextResponse.json({ error: "Archive not found" }, { status: 404 })
    }

    // Get the archived data
    const startDate = new Date(archive.archive_date)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)

    const { data: iotData, error: dataError } = await supabase
      .from("iot_data")
      .select("*")
      .eq("device_id", archive.device_id)
      .gte("time", startDate.toISOString())
      .lt("time", endDate.toISOString())

    if (dataError) {
      return NextResponse.json({ error: dataError.message }, { status: 500 })
    }

    // Create CSV content
    const headers = ["timestamp", "data", "metadata"]
    let csvContent = headers.join(",") + "\n"

    iotData?.forEach((item) => {
      const row = [item.time, JSON.stringify(item.data), JSON.stringify(item.metadata)]
      csvContent += row.join(",") + "\n"
    })

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="archive-${params.id}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
