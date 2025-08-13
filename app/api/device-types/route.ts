import { type NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { data, error } = await supabase.from("device_types").select("*").order("name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ device_types: data })
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
    const { name, description, schema_definition } = body

    if (!name || !schema_definition) {
      return NextResponse.json({ error: "name and schema_definition are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("device_types")
      .insert({
        name,
        description,
        schema_definition,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({ error: "Device type name already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ device_type: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
