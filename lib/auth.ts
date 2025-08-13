import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; deviceId?: string }> {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  // Hash the provided API key
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

  const { data, error } = await supabase
    .from("api_keys")
    .select("device_id, expires_at, is_active")
    .eq("key_hash", keyHash)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Check if key is active
  if (!data.is_active) {
    return { valid: false }
  }

  // Check if key has expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false }
  }

  // Update last_used timestamp
  await supabase.from("api_keys").update({ last_used: new Date().toISOString() }).eq("key_hash", keyHash)

  return { valid: true, deviceId: data.device_id }
}

export async function requireAuth(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error("Unauthorized")
  }

  return session
}
