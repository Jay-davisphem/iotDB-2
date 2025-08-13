"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Device, DeviceType } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface DeviceModalProps {
  isOpen: boolean
  onClose: () => void
  device: Device | null
  deviceTypes: DeviceType[]
  mode: "create" | "edit" | "view"
}

export default function DeviceModal({ isOpen, onClose, device, deviceTypes, mode }: DeviceModalProps) {
  const [formData, setFormData] = useState({
    device_id: "",
    name: "",
    device_type_id: "",
    location: "",
    status: "active" as const,
    metadata: "{}",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (device && (mode === "edit" || mode === "view")) {
      setFormData({
        device_id: device.device_id,
        name: device.name,
        device_type_id: device.device_type_id || "",
        location: device.location || "",
        status: device.status,
        metadata: JSON.stringify(device.metadata, null, 2),
      })
    } else {
      setFormData({
        device_id: "",
        name: "",
        device_type_id: "",
        location: "",
        status: "active",
        metadata: "{}",
      })
    }
    setError("")
  }, [device, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let metadata
      try {
        metadata = JSON.parse(formData.metadata)
      } catch {
        setError("Invalid JSON in metadata field")
        setLoading(false)
        return
      }

      const payload = {
        device_id: formData.device_id,
        name: formData.name,
        device_type_id: formData.device_type_id || null,
        location: formData.location,
        status: formData.status,
        metadata,
      }

      const url = mode === "create" ? "/api/devices" : `/api/devices/${device?.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onClose()
      } else {
        const result = await response.json()
        setError(result.error || "Failed to save device")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Add New Device"
      case "edit":
        return "Edit Device"
      case "view":
        return "Device Details"
      default:
        return "Device"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Add a new IoT device to your system"
      case "edit":
        return "Update device information and configuration"
      case "view":
        return "View device details and current status"
      default:
        return ""
    }
  }

  const isReadOnly = mode === "view"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device_id">Device ID</Label>
              <Input
                id="device_id"
                value={formData.device_id}
                onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                placeholder="e.g., TEMP_001"
                required
                disabled={isReadOnly || mode === "edit"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Living Room Sensor"
                required
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device_type">Device Type</Label>
              <Select
                value={formData.device_type_id}
                onValueChange={(value) => setFormData({ ...formData, device_type_id: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Type</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Living Room"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (JSON)</Label>
            <Textarea
              id="metadata"
              value={formData.metadata}
              onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              placeholder='{"key": "value"}'
              rows={4}
              disabled={isReadOnly}
              className="font-mono text-sm"
            />
          </div>

          {mode === "view" && device && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Created At</Label>
                <div className="text-sm text-gray-600">{new Date(device.created_at).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <div className="text-sm text-gray-600">{new Date(device.updated_at).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label>Last Seen</Label>
                <div className="text-sm text-gray-600">
                  {device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current Status</Label>
                <Badge
                  className={
                    device.status === "active"
                      ? "bg-green-100 text-green-800"
                      : device.status === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                  }
                >
                  {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {mode === "view" ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Device" : "Update Device"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
