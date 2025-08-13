import { type NextRequest, NextResponse } from "next/server"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { validateApiKey } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix
    const { valid, deviceId } = await validateApiKey(apiKey)

    if (!valid) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { device_id, data, timestamp, metadata } = body

    if (!device_id || !data) {
      return NextResponse.json({ error: "device_id and data are required" }, { status: 400 })
    }

    // If API key is device-specific, ensure it matches
    if (deviceId && deviceId !== device_id) {
      return NextResponse.json({ error: "API key not authorized for this device" }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get device UUID from device_id
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, device_type_id, device_types(schema_definition)")
      .eq("device_id", device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Validate data against device type schema if available
    if (device.device_types?.schema_definition) {
      const schema = device.device_types.schema_definition
      const requiredFields = schema.properties
        ? Object.keys(schema.properties).filter((key) => schema.required?.includes(key))
        : []

      for (const field of requiredFields) {
        if (!(field in data)) {
          return NextResponse.json(
            {
              error: `Missing required field: ${field}`,
            },
            { status: 400 },
          )
        }
      }
    }

    // Insert IoT data
    const { data: insertedData, error: insertError } = await supabase
      .from("iot_data")
      .insert({
        device_id: device.id,
        data,
        metadata: metadata || {},
        time: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Update device last_seen
    await supabase.from("devices").update({ last_seen: new Date().toISOString() }).eq("id", device.id)

    return NextResponse.json(
      {
        message: "Data ingested successfully",
        data: insertedData,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Data ingestion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
