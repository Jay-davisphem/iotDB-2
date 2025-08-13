export interface Device {
  id: string
  device_id: string
  name: string
  device_type_id: string | null
  location: string | null
  status: "active" | "inactive" | "maintenance" | "error"
  metadata: Record<string, any>
  last_seen: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DeviceType {
  id: string
  name: string
  description: string | null
  schema_definition: Record<string, any>
  created_at: string
  updated_at: string
}

export interface IoTData {
  time: string
  device_id: string
  data: Record<string, any>
  metadata: Record<string, any>
  created_at: string
}

export interface Alert {
  id: string
  device_id: string | null
  title: string
  description: string | null
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "acknowledged" | "resolved"
  conditions: Record<string, any>
  triggered_at: string
  acknowledged_at: string | null
  resolved_at: string | null
  acknowledged_by: string | null
  resolved_by: string | null
  created_at: string
}

export interface ApiKey {
  id: string
  key_hash: string
  name: string
  device_id: string | null
  permissions: Record<string, any>
  expires_at: string | null
  last_used: string | null
  is_active: boolean
  created_at: string
  created_by: string | null
}
