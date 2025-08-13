"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Play, Download, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Device } from "@/lib/types"

interface QueryBuilderProps {
  devices: Device[]
  onQuery: (params: QueryParams) => void
  loading: boolean
}

export interface QueryParams {
  deviceId: string
  startTime?: string
  endTime?: string
  limit: number
  aggregation?: string
  interval?: string
  fields?: string[]
}

export default function QueryBuilder({ devices, onQuery, loading }: QueryBuilderProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [limit, setLimit] = useState("1000")
  const [aggregation, setAggregation] = useState<string>("none")
  const [interval, setInterval] = useState<string>("")
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [availableFields, setAvailableFields] = useState<string[]>([])

  // Fetch available fields when device changes
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceFields(selectedDevice)
    }
  }, [selectedDevice])

  const fetchDeviceFields = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/data/fields?device_id=${deviceId}`)
      if (response.ok) {
        const result = await response.json()
        setAvailableFields(result.fields || [])
      }
    } catch (error) {
      console.error("Error fetching device fields:", error)
    }
  }

  const handleQuery = () => {
    if (!selectedDevice) return

    const params: QueryParams = {
      deviceId: selectedDevice,
      limit: Number.parseInt(limit),
    }

    if (startDate) {
      params.startTime = startDate.toISOString()
    }

    if (endDate) {
      params.endTime = endDate.toISOString()
    }

    if (aggregation !== "none") {
      params.aggregation = aggregation
    }

    if (interval && aggregation !== "none") {
      params.interval = interval
    }

    if (selectedFields.length > 0) {
      params.fields = selectedFields
    }

    onQuery(params)
  }

  const handleExport = async () => {
    if (!selectedDevice) return

    const params = new URLSearchParams({
      device_id: selectedDevice,
      limit: limit,
      format: "csv",
    })

    if (startDate) {
      params.append("start_time", startDate.toISOString())
    }

    if (endDate) {
      params.append("end_time", endDate.toISOString())
    }

    try {
      const response = await fetch(`/api/data/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `iot-data-${selectedDevice}-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  const toggleField = (field: string) => {
    setSelectedFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Query Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Selection */}
        <div className="space-y-2">
          <Label>Device</Label>
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger>
              <SelectValue placeholder="Select a device" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.device_id}>
                  {device.name} ({device.device_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Aggregation Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Limit</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 records</SelectItem>
                <SelectItem value="500">500 records</SelectItem>
                <SelectItem value="1000">1,000 records</SelectItem>
                <SelectItem value="5000">5,000 records</SelectItem>
                <SelectItem value="10000">10,000 records</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aggregation</Label>
            <Select value={aggregation} onValueChange={setAggregation}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="avg">Average</SelectItem>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="min">Minimum</SelectItem>
                <SelectItem value="max">Maximum</SelectItem>
                <SelectItem value="count">Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Interval</Label>
            <Select value={interval} onValueChange={setInterval} disabled={aggregation === "none"}>
              <SelectTrigger>
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 minute</SelectItem>
                <SelectItem value="5m">5 minutes</SelectItem>
                <SelectItem value="15m">15 minutes</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="6h">6 hours</SelectItem>
                <SelectItem value="1d">1 day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Field Selection */}
        {availableFields.length > 0 && (
          <div className="space-y-2">
            <Label>Fields (optional - leave empty for all)</Label>
            <div className="flex flex-wrap gap-2">
              {availableFields.map((field) => (
                <Badge
                  key={field}
                  variant={selectedFields.includes(field) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => toggleField(field)}
                >
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleQuery} disabled={!selectedDevice || loading} className="flex-1">
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Run Query
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={!selectedDevice}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
