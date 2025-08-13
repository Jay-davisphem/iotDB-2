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
    const status = searchParams.get("status")
    const severity = searchParams.get("severity")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from("alerts")
      .select(`
        *,
        devices (
          name,
          location
        )
      `)
      .order("triggered_at", { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq("status", status)
    }

    if (severity) {
      query = query.eq("severity", severity)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ alerts: data })
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
    const { title, description, device_id, severity, conditions } = body

    if (!title || !severity || !conditions) {
      return NextResponse.json({ error: "title, severity, and conditions are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("alerts")
      .insert({
        title,
        description,
        device_id: device_id || null,
        severity,
        conditions,
        status: "open",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ alert: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
