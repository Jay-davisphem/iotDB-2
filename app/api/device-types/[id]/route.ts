import { type NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
      .update({
        name,
        description,
        schema_definition,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Device type not found" }, { status: 404 })
      }
      if (error.code === "23505") {
        return NextResponse.json({ error: "Device type name already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ device_type: data })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(request)

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    const { error } = await supabase.from("device_types").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Device type deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
