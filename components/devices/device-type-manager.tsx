"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, Trash2 } from "lucide-react"
import type { DeviceType } from "@/lib/types"

interface DeviceTypeManagerProps {
  deviceTypes: DeviceType[]
  onRefresh: () => void
}

export default function DeviceTypeManager({ deviceTypes, onRefresh }: DeviceTypeManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<DeviceType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schema_definition: JSON.stringify(
      {
        type: "object",
        properties: {
          temperature: { type: "number", unit: "celsius" },
          humidity: { type: "number", unit: "percentage" },
        },
        required: ["temperature"],
      },
      null,
      2,
    ),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = () => {
    setSelectedType(null)
    setFormData({
      name: "",
      description: "",
      schema_definition: JSON.stringify(
        {
          type: "object",
          properties: {
            temperature: { type: "number", unit: "celsius" },
            humidity: { type: "number", unit: "percentage" },
          },
          required: ["temperature"],
        },
        null,
        2,
      ),
    })
    setError("")
    setIsModalOpen(true)
  }

  const handleEdit = (deviceType: DeviceType) => {
    setSelectedType(deviceType)
    setFormData({
      name: deviceType.name,
      description: deviceType.description || "",
      schema_definition: JSON.stringify(deviceType.schema_definition, null, 2),
    })
    setError("")
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let schema_definition
      try {
        schema_definition = JSON.parse(formData.schema_definition)
      } catch {
        setError("Invalid JSON in schema definition")
        setLoading(false)
        return
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        schema_definition,
      }

      const url = selectedType ? `/api/device-types/${selectedType.id}` : "/api/device-types"
      const method = selectedType ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsModalOpen(false)
        onRefresh()
      } else {
        const result = await response.json()
        setError(result.error || "Failed to save device type")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (typeId: string) => {
    if (!confirm("Are you sure you want to delete this device type?")) {
      return
    }

    try {
      const response = await fetch(`/api/device-types/${typeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onRefresh()
      } else {
        alert("Failed to delete device type")
      }
    } catch (error) {
      console.error("Error deleting device type:", error)
      alert("Failed to delete device type")
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Device Types</CardTitle>
            <Button onClick={handleCreate} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deviceTypes.map((type) => (
              <Card key={type.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      {type.description && <p className="text-sm text-gray-600 mt-1">{type.description}</p>}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(type)} className="h-8 w-8 p-0">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Schema Fields:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(type.schema_definition.properties || {}).map((field) => (
                        <Badge key={field} variant="secondary" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Type Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedType ? "Edit Device Type" : "Create Device Type"}</DialogTitle>
            <DialogDescription>
              {selectedType ? "Update the device type configuration" : "Define a new device type with its data schema"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Temperature Sensor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the device type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schema">Schema Definition (JSON)</Label>
              <Textarea
                id="schema"
                value={formData.schema_definition}
                onChange={(e) => setFormData({ ...formData, schema_definition: e.target.value })}
                rows={10}
                className="font-mono text-sm"
                placeholder="JSON schema defining the expected data structure"
                required
              />
              <div className="text-xs text-gray-500">
                Define the expected data structure for devices of this type using JSON Schema format.
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Saving..." : selectedType ? "Update Type" : "Create Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
