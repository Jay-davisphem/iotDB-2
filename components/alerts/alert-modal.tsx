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
import type { Alert, Device } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  alert: Alert | null
  devices: Device[]
  mode: "create" | "edit" | "view"
}

export default function AlertModal({ isOpen, onClose, alert, devices, mode }: AlertModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    device_id: "",
    severity: "medium" as const,
    conditions: JSON.stringify(
      {
        field: "temperature",
        operator: ">",
        value: 30,
      },
      null,
      2,
    ),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (alert && (mode === "edit" || mode === "view")) {
      setFormData({
        title: alert.title,
        description: alert.description || "",
        device_id: alert.device_id || "",
        severity: alert.severity,
        conditions: JSON.stringify(alert.conditions, null, 2),
      })
    } else {
      setFormData({
        title: "",
        description: "",
        device_id: "",
        severity: "medium",
        conditions: JSON.stringify(
          {
            field: "temperature",
            operator: ">",
            value: 30,
          },
          null,
          2,
        ),
      })
    }
    setError("")
  }, [alert, mode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let conditions
      try {
        conditions = JSON.parse(formData.conditions)
      } catch {
        setError("Invalid JSON in conditions field")
        setLoading(false)
        return
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        device_id: formData.device_id || null,
        severity: formData.severity,
        conditions,
      }

      const url = mode === "create" ? "/api/alerts" : `/api/alerts/${alert?.id}`
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
        setError(result.error || "Failed to save alert")
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
        return "Create Alert Rule"
      case "edit":
        return "Edit Alert Rule"
      case "view":
        return "Alert Details"
      default:
        return "Alert"
    }
  }

  const getDescription = () => {
    switch (mode) {
      case "create":
        return "Create a new alert rule to monitor device conditions"
      case "edit":
        return "Update alert rule configuration"
      case "view":
        return "View alert details and status"
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

          <div className="space-y-2">
            <Label htmlFor="title">Alert Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., High Temperature Alert"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the alert condition"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="device">Device (optional)</Label>
              <Select
                value={formData.device_id}
                onValueChange={(value) => setFormData({ ...formData, device_id: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All devices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All devices</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.device_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions">Alert Conditions (JSON)</Label>
            <Textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              placeholder='{"field": "temperature", "operator": ">", "value": 30}'
              rows={6}
              disabled={isReadOnly}
              className="font-mono text-sm"
            />
            <div className="text-xs text-gray-500">
              Define conditions using JSON format. Supported operators: {(">", "<", ">=", "<=", "==", "!=")}
            </div>
          </div>

          {mode === "view" && alert && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge
                  className={
                    alert.status === "resolved"
                      ? "bg-green-100 text-green-800"
                      : alert.status === "acknowledged"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Triggered At</Label>
                <div className="text-sm text-gray-600">{new Date(alert.triggered_at).toLocaleString()}</div>
              </div>
              {alert.acknowledged_at && (
                <div className="space-y-2">
                  <Label>Acknowledged At</Label>
                  <div className="text-sm text-gray-600">{new Date(alert.acknowledged_at).toLocaleString()}</div>
                </div>
              )}
              {alert.resolved_at && (
                <div className="space-y-2">
                  <Label>Resolved At</Label>
                  <div className="text-sm text-gray-600">{new Date(alert.resolved_at).toLocaleString()}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {mode === "view" ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Alert Rule" : "Update Alert Rule"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
