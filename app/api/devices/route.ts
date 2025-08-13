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
    const deviceType = searchParams.get("device_type")
    const location = searchParams.get("location")

    let query = supabase
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

    if (status) {
      query = query.eq("status", status)
    }

    if (deviceType) {
      query = query.eq("device_type_id", deviceType)
    }

    if (location) {
      query = query.ilike("location", `%${location}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ devices: data })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const body = await request.json()
    const { device_id, name, device_type_id, location, metadata } = body

    if (!device_id || !name) {
      return NextResponse.json({ error: "device_id and name are required" }, { status: 400 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { data, error } = await supabase
      .from("devices")
      .insert({
        device_id,
        name,
        device_type_id,
        location,
        metadata: metadata || {},
        created_by: session?.user?.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ error: "Device ID already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ device: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
